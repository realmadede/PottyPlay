"use client";

import React, { FormEvent, useEffect, useState } from "react";
import { LandingHeader } from "@/components/LandingHeader";
import { AlertCircle, CheckCircle2, Loader2, Trash2 } from "lucide-react";

export default function AccountDeletionPage() {
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setToken(new URLSearchParams(window.location.hash.slice(1)).get("token") || "");
  }, []);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch("/api/account-deletion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(token ? { action: "confirm", token } : { action: "request", email }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || "The deletion request could not be completed.");
      }

      setMessage(result.message);
      if (token) {
        setToken("");
        window.history.replaceState({}, "", "/account-deletion");
      }
    } catch (requestError: unknown) {
      setError(requestError instanceof Error ? requestError.message : "Unable to contact PottyPlay. Check your connection and retry.");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-bg text-ink">
      <LandingHeader />
      <main className="flex-1 w-full max-w-2xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        <a href="/privacy/" className="text-xs font-semibold text-muted underline">Privacy Policy</a>
        <section className="mt-5 border-t border-line pt-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-red-500/10 text-red-400">
              <Trash2 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-black">Account deletion</h1>
              <p className="text-xs text-muted">Request deletion of your PottyPlay account and linked personal details.</p>
            </div>
          </div>

          <div className="mt-6 space-y-3 text-sm text-muted leading-relaxed">
            <p>Enter the email address on your account. We will send a confirmation link to that address. The link expires after 60 minutes and must be opened to confirm deletion.</p>
            <p>After confirmation, you can no longer sign in and active breaks are stopped. After a 30-day grace period, account details and linked support information are anonymized. Some cinema, billing, security, or legally required records may be retained in anonymized form.</p>
            <p>If you can no longer access the email address on your account, use the public support form for assistance with the request.</p>
          </div>

          {message && (
            <div role="status" className="mt-5 flex gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-300">
              <CheckCircle2 className="h-5 w-5 shrink-0" />
              <span>{message}</span>
            </div>
          )}
          {error && (
            <div role="alert" className="mt-5 flex gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!message?.startsWith("Deletion confirmed") && (
            <form onSubmit={submit} className="mt-6 space-y-4">
              {!token && (
                <div>
                  <label htmlFor="deletion-email" className="mb-1 block text-xs font-bold text-ink">Account email address</label>
                  <input
                    id="deletion-email"
                    type="email"
                    autoComplete="email"
                    required
                    maxLength={254}
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="w-full rounded-xl border border-line bg-field px-3 py-3 text-sm text-ink outline-none focus:border-amber-500"
                  />
                </div>
              )}
              {token && <p className="text-sm text-muted">Confirm the account deletion request associated with this email link.</p>}
              <button
                type="submit"
                disabled={pending || (!token && !email.trim())}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white disabled:opacity-50"
              >
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                {token ? "Confirm account deletion" : "Send confirmation link"}
              </button>
            </form>
          )}

          <a href="/support/#contact" className="mt-6 inline-block text-xs font-semibold text-muted underline">Contact support about a deletion request</a>
        </section>
      </main>
    </div>
  );
}
