import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { NextRequest } from "next/server";
import { prisma } from "../src/lib/db";
import { FeedbackService } from "../src/features/feedback/feedback-service";
import { CustomerAuthService } from "../src/features/auth/customer-auth-service";
import { POST as customerFeedbackPost, GET as customerFeedbackGet } from "../src/app/api/customer/feedback/route";
import { GET as operatorFeedbackGet, PATCH as operatorFeedbackPatch } from "../src/app/api/operator/feedback/route";
import { POST as cronPurgePost } from "../src/app/api/cron/purge-deleted/route";
import { FeedbackCategory, FeedbackStatus, CinemaStatus, OperatorRole, TicketStatus } from "@prisma/client";

describe("Patron Feedback, Support & PDPA Account Erasure Suite", () => {
  const testCinemaId = "fb_test_cinema_01";
  const foreignCinemaId = "fb_foreign_cinema_02";
  const testScreenId = "fb_test_screen_01";
  const testAssetId = "fb_test_asset_01";
  const testScreeningId = "fb_test_screening_01";
  const testTicketNumber = "FB-TKT-991";
  const testOperatorEmail = "fb_operator@cinema.test";
  const testOperatorToken = "opr_fb_test_session_token_123";

  let createdCustomerId: string;
  let expiredDeletionCustomerId: string;
  let recentDeletionCustomerId: string;

  beforeAll(async () => {
    // 1. Clean up stale test data
    await prisma.patronFeedback.deleteMany({
      where: {
        OR: [
          { cinemaId: { in: [testCinemaId, foreignCinemaId] } },
          { ticketNumber: testTicketNumber },
        ],
      },
    });
    await prisma.screeningReminder.deleteMany({
      where: { screeningId: testScreeningId },
    });
    await prisma.breakSession.deleteMany({
      where: { ticket: { ticketNumber: testTicketNumber } },
    });
    await prisma.demonstrationTicket.deleteMany({
      where: { ticketNumber: testTicketNumber },
    });
    await prisma.screening.deleteMany({
      where: { id: testScreeningId },
    });
    await prisma.screen.deleteMany({
      where: { id: testScreenId },
    });
    await prisma.contentAsset.deleteMany({
      where: { id: testAssetId },
    });
    await prisma.operatorUser.deleteMany({
      where: { email: testOperatorEmail },
    });
    await prisma.cinema.deleteMany({
      where: { id: { in: [testCinemaId, foreignCinemaId] } },
    });
    await prisma.customerAccount.deleteMany({
      where: {
        email: {
          in: [
            "fb_patron@test.com",
            "expired_del@test.com",
            "recent_del@test.com",
          ],
        },
      },
    });

    // 2. Provision test cinema circuit
    await prisma.cinema.create({
      data: {
        id: testCinemaId,
        name: "Dar es Salaam Century Cinema",
        location: "Mlimani City Mall Level -1",
        timezone: "Africa/Dar_es_Salaam",
        ticketingSystem: "CENTURY_POS",
        screeningSystem: "DOLBY_IMS3000",
        status: CinemaStatus.APPROVED,
      },
    });

    await prisma.cinema.create({
      data: {
        id: foreignCinemaId,
        name: "Arusha Palace Cinema",
        location: "Palace Hotel Ground Floor",
        timezone: "Africa/Dar_es_Salaam",
        ticketingSystem: "VISTA",
        screeningSystem: "CHRISTIE_CP2220",
        status: CinemaStatus.APPROVED,
      },
    });

    // 3. Provision operator
    await prisma.operatorUser.create({
      data: {
        cinemaId: testCinemaId,
        email: testOperatorEmail,
        passwordHash: "dummy_hash_for_test",
        name: "Duty Floor Usher",
        role: OperatorRole.MANAGER,
        sessionToken: testOperatorToken,
        tokenExpiresAt: new Date(Date.now() + 86400000),
      },
    });

    // 4. Provision asset, screen, and screening
    await prisma.contentAsset.create({
      data: {
        id: testAssetId,
        title: "Gladiator II",
        durationSeconds: 8880,
        videoUrl: "https://cdn.pottyplay.test/gladiator2.m3u8",
        licenseType: "COMMERCIAL_EXHIBITION_RIGHTS",
        licenseSource: "Paramount Pictures",
      },
    });

    await prisma.screen.create({
      data: {
        id: testScreenId,
        cinemaId: testCinemaId,
        name: "Auditorium 1",
        totalSeats: 250,
      },
    });

    await prisma.screening.create({
      data: {
        id: testScreeningId,
        cinemaId: testCinemaId,
        screenId: testScreenId,
        contentAssetId: testAssetId,
        title: "Gladiator II",
        scheduledStart: new Date(),
        actualStart: new Date(),
        status: "PLAYING",
      },
    });

    // 5. Provision ticket
    await prisma.demonstrationTicket.create({
      data: {
        ticketNumber: testTicketNumber,
        screeningId: testScreeningId,
        seatNumber: "H12",
        customerName: "Baraka Juma",
        status: TicketStatus.VALID_ADMITTED,
      },
    });

    // 6. Provision customer accounts for PDPA deletion testing
    const patron = await prisma.customerAccount.create({
      data: {
        email: "fb_patron@test.com",
        phoneNumber: "+255712999001",
        name: "Baraka Juma",
        status: "ACTIVE",
        phoneVerified: true,
        emailVerified: true,
      },
    });
    createdCustomerId = patron.id;

    // Expired deletion request (created 45 days ago)
    const expiredCutoff = new Date(Date.now() - 45 * 24 * 60 * 60 * 1000);
    const expiredPatron = await prisma.customerAccount.create({
      data: {
        email: "expired_del@test.com",
        phoneNumber: "+255712999002",
        name: "Amina Salum",
        status: "DELETION_REQUESTED",
        deletionRequestedAt: expiredCutoff,
        phoneVerified: true,
        emailVerified: true,
      },
    });
    expiredDeletionCustomerId = expiredPatron.id;

    // Attach reminder to test cascading deletion
    await prisma.screeningReminder.create({
      data: {
        customerId: expiredDeletionCustomerId,
        screeningId: testScreeningId,
        offsetMinutes: 30,
      },
    });

    // Recent deletion request (created 5 days ago, within 30-day grace period)
    const recentCutoff = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
    const recentPatron = await prisma.customerAccount.create({
      data: {
        email: "recent_del@test.com",
        phoneNumber: "+255712999003",
        name: "Chacha Mwita",
        status: "DELETION_REQUESTED",
        deletionRequestedAt: recentCutoff,
        phoneVerified: true,
        emailVerified: true,
      },
    });
    recentDeletionCustomerId = recentPatron.id;
  });

  afterAll(async () => {
    await prisma.patronFeedback.deleteMany({
      where: {
        OR: [
          { cinemaId: { in: [testCinemaId, foreignCinemaId] } },
          { ticketNumber: testTicketNumber },
        ],
      },
    });
    await prisma.screeningReminder.deleteMany({
      where: { screeningId: testScreeningId },
    });
    await prisma.demonstrationTicket.deleteMany({
      where: { ticketNumber: testTicketNumber },
    });
    await prisma.screening.deleteMany({
      where: { id: testScreeningId },
    });
    await prisma.screen.deleteMany({
      where: { id: testScreenId },
    });
    await prisma.contentAsset.deleteMany({
      where: { id: testAssetId },
    });
    await prisma.operatorUser.deleteMany({
      where: { email: testOperatorEmail },
    });
    await prisma.cinema.deleteMany({
      where: { id: { in: [testCinemaId, foreignCinemaId] } },
    });
    await prisma.customerAccount.deleteMany({
      where: {
        id: {
          in: [
            createdCustomerId,
            expiredDeletionCustomerId,
            recentDeletionCustomerId,
          ],
        },
      },
    });
  });

  describe("FeedbackService Backend Engine", () => {
    it("submits patron feedback with ticket number and resolves cinema/screening context", async () => {
      const feedback = await FeedbackService.submitFeedback({
        ticketNumber: testTicketNumber,
        category: FeedbackCategory.VIDEO_FROZEN,
        message: "Video paused for 10 seconds near the restroom entrance.",
        deviceInfo: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0)",
      });

      expect(feedback).toBeDefined();
      expect(feedback.id).toBeDefined();
      expect(feedback.ticketNumber).toBe(testTicketNumber);
      expect(feedback.category).toBe(FeedbackCategory.VIDEO_FROZEN);
      expect(feedback.status).toBe(FeedbackStatus.PENDING);
      expect(feedback.cinemaId).toBe(testCinemaId);
      expect(feedback.screeningId).toBe(testScreeningId);
    });

    it("lists feedback queue items strictly isolated to the cinema", async () => {
      const items = await FeedbackService.listByCinema(testCinemaId);
      expect(items.length).toBeGreaterThanOrEqual(1);
      const found = items.find((i) => i.ticketNumber === testTicketNumber);
      expect(found).toBeDefined();
      expect(found?.status).toBe(FeedbackStatus.PENDING);

      // Foreign cinema query should return 0 items
      const foreignItems = await FeedbackService.listByCinema(foreignCinemaId);
      const foreignMatch = foreignItems.find((i) => i.ticketNumber === testTicketNumber);
      expect(foreignMatch).toBeUndefined();
    });

    it("allows cinema operator to triage feedback and record operator notes", async () => {
      const items = await FeedbackService.listByCinema(testCinemaId);
      const target = items[0];

      const updated = await FeedbackService.updateStatus(
        target.id,
        testCinemaId,
        FeedbackStatus.INVESTIGATING,
        "Checked Wi-Fi AP 4 outside restroom; signal verified at -52 dBm."
      );

      expect(updated.status).toBe(FeedbackStatus.INVESTIGATING);
      expect(updated.operatorNotes).toContain("Checked Wi-Fi AP 4");

      // Resolve the issue
      const resolved = await FeedbackService.updateStatus(
        target.id,
        testCinemaId,
        FeedbackStatus.RESOLVED,
        "Patron reconnected to pottyplay-cinema-guest LAN cache."
      );

      expect(resolved.status).toBe(FeedbackStatus.RESOLVED);
      expect(resolved.resolvedAt).toBeDefined();
    });

    it("rejects triage updates across cinema tenant boundary", async () => {
      const items = await FeedbackService.listByCinema(testCinemaId);
      const target = items[0];

      await expect(
        FeedbackService.updateStatus(
          target.id,
          foreignCinemaId,
          FeedbackStatus.DISMISSED,
          "Unauthorized attempt from foreign cinema"
        )
      ).rejects.toThrow("Feedback item not found or unauthorized for this cinema");
    });
  });

  describe("Customer Feedback API Route (POST & GET)", () => {
    it("accepts valid JSON submission from patron via /api/customer/feedback", async () => {
      const req = new NextRequest("http://localhost:3000/api/customer/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketNumber: testTicketNumber,
          category: "CINEMA_FACILITY",
          message: "Guest Wi-Fi password was requested when scanning in basement.",
        }),
      });

      const res = await customerFeedbackPost(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.feedbackId).toBeDefined();
    });

    it("rejects empty message body with validation error", async () => {
      const req = new NextRequest("http://localhost:3000/api/customer/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: "GENERAL_FEEDBACK",
          message: "",
        }),
      });

      const res = await customerFeedbackPost(req);
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.success).toBe(false);
      expect(json.error).toContain("Message is required");
    });
  });

  describe("Operator Feedback API Route (GET & PATCH)", () => {
    it("allows authenticated operator to fetch feedback queue via /api/operator/feedback", async () => {
      const req = new NextRequest(
        `http://localhost:3000/api/operator/feedback?cinemaId=${testCinemaId}`,
        {
          headers: { Authorization: `Bearer ${testOperatorToken}` },
        }
      );

      const res = await operatorFeedbackGet(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(Array.isArray(json.feedbacks)).toBe(true);
      expect(json.feedbacks.length).toBeGreaterThanOrEqual(1);
    });

    it("allows authenticated operator to update status via PATCH /api/operator/feedback", async () => {
      const listReq = new NextRequest(
        `http://localhost:3000/api/operator/feedback?cinemaId=${testCinemaId}`,
        {
          headers: { Authorization: `Bearer ${testOperatorToken}` },
        }
      );
      const listRes = await operatorFeedbackGet(listReq);
      const listJson = await listRes.json();
      const firstItem = listJson.feedbacks[0];

      const patchReq = new NextRequest("http://localhost:3000/api/operator/feedback", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${testOperatorToken}`,
        },
        body: JSON.stringify({
          feedbackId: firstItem.id,
          status: "RESOLVED",
          operatorNotes: "Ticket reset at usher podium.",
        }),
      });

      const patchRes = await operatorFeedbackPatch(patchReq);
      const patchJson = await patchRes.json();

      expect(patchRes.status).toBe(200);
      expect(patchJson.success).toBe(true);
      expect(patchJson.feedback.status).toBe("RESOLVED");
    });
  });

  describe("PDPA 2022 Account Deletion & Automated PII Purge", () => {
    it("requests account deletion, immediately invalidating session tokens", async () => {
      await CustomerAuthService.requestDeletion(createdCustomerId);

      const account = await prisma.customerAccount.findUnique({
        where: { id: createdCustomerId },
      });

      expect(account?.status).toBe("DELETION_REQUESTED");
      expect(account?.deletionRequestedAt).toBeDefined();
      expect(account?.sessionToken).toBeNull();
      expect(account?.tokenExpiresAt).toBeNull();
    });

    it("anonymizes patron account, erasing phone number, email, and reminder links", async () => {
      await CustomerAuthService.anonymizeCustomerAccount(createdCustomerId);

      const scrubbed = await prisma.customerAccount.findUnique({
        where: { id: createdCustomerId },
      });

      expect(scrubbed?.status).toBe("DELETED");
      expect(scrubbed?.name).toBe("Anonymized Patron");
      expect(scrubbed?.phoneNumber).toBeNull();
      expect(scrubbed?.email).toBeNull();
      expect(scrubbed?.passwordHash).toBeNull();
      expect(scrubbed?.sessionToken).toBeNull();
      expect(scrubbed?.phoneVerified).toBe(false);
      expect(scrubbed?.emailVerified).toBe(false);
    });

    it("purges accounts past 30-day grace period while preserving accounts within grace period", async () => {
      // Execute purge with 30-day cutoff
      const result = await CustomerAuthService.purgeExpiredDeletionRequests(30);

      expect(result.purgedCount).toBeGreaterThanOrEqual(1);
      expect(result.accountIds).toContain(expiredDeletionCustomerId);
      expect(result.accountIds).not.toContain(recentDeletionCustomerId);

      // Verify expired account was anonymized
      const expiredAcc = await prisma.customerAccount.findUnique({
        where: { id: expiredDeletionCustomerId },
      });
      expect(expiredAcc?.status).toBe("DELETED");
      expect(expiredAcc?.email).toBeNull();
      expect(expiredAcc?.phoneNumber).toBeNull();

      // Verify reminder was deleted
      const reminder = await prisma.screeningReminder.findFirst({
        where: { customerId: expiredDeletionCustomerId },
      });
      expect(reminder).toBeNull();

      // Verify recent account is still within grace period (not yet anonymized)
      const recentAcc = await prisma.customerAccount.findUnique({
        where: { id: recentDeletionCustomerId },
      });
      expect(recentAcc?.status).toBe("DELETION_REQUESTED");
      expect(recentAcc?.email).toBe("recent_del@test.com");
    });

    it("triggers cron endpoint POST /api/cron/purge-deleted with secret validation", async () => {
      const cronReq = new NextRequest("http://localhost:3000/api/cron/purge-deleted?gracePeriodDays=30", {
        method: "POST",
      });

      const cronRes = await cronPurgePost(cronReq);
      const cronJson = await cronRes.json();

      expect(cronRes.status).toBe(200);
      expect(cronJson.success).toBe(true);
      expect(cronJson.message).toContain("PDPA 2022");
      expect(typeof cronJson.purgedCount).toBe("number");
    });
  });
});
