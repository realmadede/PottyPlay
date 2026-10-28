"use client";

import React, { useState, useEffect } from "react";
import { Bell, Plus, Trash2, Calendar, Clock, Ticket, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

interface ReminderItem {
  id: string;
  screeningId: string;
  screeningTitle: string;
  cinemaName: string;
  screenName: string;
  showtime: string;
  offsetMinutes: number;
  ticketNumber?: string;
}

export function RemindersView() {
  const [reminders, setReminders] = useState<ReminderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [ticketInput, setTicketInput] = useState("");
  const [selectedScreeningId, setSelectedScreeningId] = useState("screening_prime_01");
  const [offsetMinutes, setOffsetMinutes] = useState(30);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadReminders() {
      try {
        const res = await fetch("/api/reminders");
        const data = await res.json();
        if (data.success && Array.isArray(data.reminders)) {
          setReminders(data.reminders);
        } else {
          setReminders([]);
        }
      } catch {
        setErrorMessage("Unable to load reminders.");
      } finally {
        setLoading(false);
      }
    }
    loadReminders();
  }, []);

  const handleAddReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          screeningId: selectedScreeningId,
          offsetMinutes,
          ticketNumber: ticketInput.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to create reminder.");
      }

      setReminders((prev) => [data.reminder, ...prev]);
      setIsAdding(false);
      setTicketInput("");
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to save reminder.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReminder = async (id: string) => {
    try {
      const res = await fetch(`/api/reminders?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setReminders((prev) => prev.filter((r) => r.id !== id));
      }
    } catch {
      // Ignore
    }
  };

  const getOffsetLabel = (mins: number) => {
    if (mins === 1440) return "1 Day Prior";
    if (mins === 60) return "1 Hour Prior";
    return `${mins} Minutes Prior`;
  };

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-ink tracking-tight">
            Screening Reminders
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-muted">
            Never miss showtime. Automated reminders linked directly to verified cinema tickets.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAdding(!isAdding)}
          className="inline-flex items-center space-x-1.5 py-2.5 px-4 rounded-xl text-xs font-black bg-amber-500 text-neutral-950 hover:bg-amber-400 transition-all shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Reminder</span>
        </button>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-start space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Add Reminder Form */}
      {isAdding && (
        <form
          onSubmit={handleAddReminder}
          className="p-5 sm:p-6 rounded-2xl bg-field border border-line shadow-card space-y-4"
        >
          <div className="font-bold text-sm text-ink border-b border-line pb-3">
            Configure Ticket-Linked Reminder
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-ink mb-1">
                Select Screening
              </label>
              <select
                value={selectedScreeningId}
                onChange={(e) => setSelectedScreeningId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-line bg-bg text-ink text-xs focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20"
              >
                <option value="screening_prime_01" className="bg-field text-ink">Serengeti Shadows (Main Hall - 21:00)</option>
                <option value="screening_wrong_02" className="bg-field text-ink">Serengeti Shadows (Late Show - 23:30)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-ink mb-1">
                Reminder Offset
              </label>
              <select
                value={offsetMinutes}
                onChange={(e) => setOffsetMinutes(parseInt(e.target.value))}
                className="w-full px-3 py-2.5 rounded-xl border border-line bg-bg text-ink text-xs focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20"
              >
                <option value={30} className="bg-field text-ink">30 Minutes Before Showtime</option>
                <option value={60} className="bg-field text-ink">1 Hour Before Showtime</option>
                <option value={1440} className="bg-field text-ink">1 Day Before Showtime (24h)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-ink mb-1">
              Ticket Barcode / Code (e.g. CC-MLM-7821-A12)
            </label>
            <input
              type="text"
              placeholder="CC-MLM-7821-A12"
              value={ticketInput}
              onChange={(e) => setTicketInput(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-line bg-bg text-ink placeholder-muted text-xs font-mono uppercase focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20"
            />
            <span className="text-[11px] text-muted mt-1 block">
              Reminders verify legitimate ticket issuance with the cinema ticketing system.
            </span>
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="py-2.5 px-4 rounded-xl text-xs font-black bg-amber-500 text-neutral-950 hover:bg-amber-400 shadow-sm flex items-center space-x-1.5 disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              <span>Save Reminder</span>
            </button>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="py-2.5 px-4 rounded-xl text-xs font-semibold bg-bg border border-line text-muted hover:text-ink hover:bg-field-raised"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="p-5 rounded-2xl bg-field border border-line animate-pulse space-y-2">
              <div className="h-4 bg-neutral-800 rounded w-1/3" />
              <div className="h-3 bg-neutral-900 rounded w-1/4" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && reminders.length === 0 && (
        <div className="p-10 rounded-3xl bg-field border border-line text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-field-raised text-muted flex items-center justify-center mx-auto">
            <Bell className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-base text-ink">No Active Reminders</h3>
          <p className="text-xs text-muted max-w-sm mx-auto">
            You have no upcoming screening reminders configured. Add your cinema ticket to receive notifications before showtime.
          </p>
        </div>
      )}

      {/* Reminders list */}
      {!loading && reminders.length > 0 && (
        <div className="space-y-3">
          {reminders.map((reminder) => (
            <div
              key={reminder.id}
              className="p-4 sm:p-5 rounded-2xl bg-field border border-line shadow-card flex items-center justify-between gap-3"
            >
              <div className="flex items-start space-x-3.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-ink">
                    {reminder.screeningTitle}
                  </h4>
                  <div className="text-xs text-muted mt-0.5">
                    {reminder.cinemaName} &bull; {reminder.screenName}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px]">
                    <span className="px-2 py-0.5 rounded bg-bg font-semibold text-ink border border-line">
                      {getOffsetLabel(reminder.offsetMinutes)}
                    </span>
                    {reminder.ticketNumber && (
                      <span className="px-2 py-0.5 rounded bg-bg font-mono text-muted border border-line">
                        Ticket: {reminder.ticketNumber}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleDeleteReminder(reminder.id)}
                className="p-2 rounded-xl text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
                aria-label="Delete reminder"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
