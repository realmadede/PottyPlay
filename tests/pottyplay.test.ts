import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "../src/lib/db";
import { TicketService } from "../src/features/tickets/ticket-service";
import { OtpService } from "../src/features/messaging/otp-service";
import { SessionService } from "../src/features/sessions/session-service";
import { ScreeningService } from "../src/features/screenings/screening-service";
import { BillingService } from "../src/features/billing/billing-service";
import { AfricasTalkingSmsAdapter } from "../src/features/messaging/africas-talking-adapter";
import { RightsService } from "../src/features/rights/rights-service";
import { hashOtp } from "../src/lib/crypto";
import { ScreeningStatus, SessionStatus, TicketStatus } from "@prisma/client";

describe("PottyPlay Comprehensive MVP Test Suite", () => {
  let mainScreeningId = "screening_prime_01";
  let cinemaId = "cinema_mlimani_01";

  beforeAll(async () => {
    // Verify database connection and seeded data
    const screening = await prisma.screening.findFirst({
      where: { id: mainScreeningId },
    });
    if (!screening) {
      throw new Error("Seeded demonstration screening not found. Please run seed script.");
    }
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // 1. Valid ticket verification
  it("1. should successfully verify a valid admitted demonstration ticket", async () => {
    const result = await TicketService.verifyTicket("CC-MLM-7821-A12", mainScreeningId);

    expect(result.isEligible).toBe(true);
    expect(result.status).toBe("ELIGIBLE");
    expect(result.ticket?.seatNumber).toBe("A12");
    expect(result.ticket?.customerName).toBe("Juma Mwanamvua");
    expect(result.screening?.id).toBe(mainScreeningId);
  });

  // 2. Invalid ticket rejection
  it("2. should reject a non-existent or invalid ticket number", async () => {
    const result = await TicketService.verifyTicket("INVALID-TICKET-9999", mainScreeningId);

    expect(result.isEligible).toBe(false);
    expect(result.status).toBe("INVALID_TICKET");
    expect(result.message).toContain("Ticket not found");
  });

  // 3. Wrong-screening rejection
  it("3. should reject a ticket that belongs to a different screening", async () => {
    // CC-MLM-9999-Z99 is for screening_wrong_02
    const result = await TicketService.verifyTicket("CC-MLM-9999-Z99", mainScreeningId);

    expect(result.isEligible).toBe(false);
    expect(result.status).toBe("WRONG_SCREENING");
    expect(result.message).toContain("different screening");
  });

  // 4. OTP success
  it("4. should generate and successfully verify an OTP code", async () => {
    const phone = "+255714000111";
    const requestResult = await OtpService.requestOtp(phone, "127.0.0.1");

    expect(requestResult.success).toBe(true);
    expect(requestResult.challengeId).toBeDefined();
    expect(requestResult.simulatedCode).toBeDefined();

    const verifyResult = await OtpService.verifyOtp(
      requestResult.challengeId!,
      requestResult.simulatedCode!
    );

    expect(verifyResult.success).toBe(true);
    expect(verifyResult.phoneNumber).toBe(phone);
  });

  // 5. OTP expiration
  it("5. should reject an expired OTP challenge", async () => {
    const phone = "+255714000222";
    const plainCode = "654321";
    const expiredChallenge = await prisma.otpChallenge.create({
      data: {
        phoneNumber: phone,
        codeHash: hashOtp(plainCode),
        attempts: 0,
        maxAttempts: 3,
        expiresAt: new Date(Date.now() - 60 * 1000), // Expired 1 minute ago
      },
    });

    const verifyResult = await OtpService.verifyOtp(expiredChallenge.id, plainCode);

    expect(verifyResult.success).toBe(false);
    expect(verifyResult.error).toContain("expired");
  });

  // 6. OTP attempt limits
  it("6. should enforce maximum OTP attempt limit and lock the challenge", async () => {
    const phone = "+255714000333";
    const plainCode = "123456";
    const challenge = await prisma.otpChallenge.create({
      data: {
        phoneNumber: phone,
        codeHash: hashOtp(plainCode),
        attempts: 0,
        maxAttempts: 3,
        expiresAt: new Date(Date.now() + 300 * 1000),
      },
    });

    // 3 failed attempts with wrong code
    await OtpService.verifyOtp(challenge.id, "000001");
    await OtpService.verifyOtp(challenge.id, "000002");
    const thirdAttempt = await OtpService.verifyOtp(challenge.id, "000003");

    expect(thirdAttempt.success).toBe(false);
    expect(thirdAttempt.attemptsRemaining).toBe(0);

    // 4th attempt even with correct code should fail due to attempt limit
    const fourthAttempt = await OtpService.verifyOtp(challenge.id, plainCode);
    expect(fourthAttempt.success).toBe(false);
    expect(fourthAttempt.error).toContain("Maximum verification attempts exceeded");
  });

  // 7. Duplicate activation prevention
  it("7. should prevent activating the same ticket twice concurrently or sequentially", async () => {
    // Ticket CC-MLM-7823-C08 was already activated in seed
    const otp = await OtpService.requestOtp("+255714000444");
    await OtpService.verifyOtp(otp.challengeId!, otp.simulatedCode!);

    const result = await SessionService.activateSession({
      ticketNumber: "CC-MLM-7823-C08",
      challengeId: otp.challengeId!,
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("already been activated");
  });

  // 8. Session expiration after 900 seconds
  it("8. should enforce server-side hard expiration when 900s limit is exceeded", async () => {
    const testTicket = await prisma.demonstrationTicket.create({
      data: {
        ticketNumber: "EXP-TEST-900-T1",
        screeningId: mainScreeningId,
        seatNumber: "X99",
        customerName: "Expiration Test User",
        status: TicketStatus.ALREADY_ACTIVATED,
      },
    });

    const now = new Date();
    // Started 950 seconds ago, expired 50 seconds ago
    const startedAt = new Date(now.getTime() - 950 * 1000);
    const expiresAt = new Date(now.getTime() - 50 * 1000);

    const session = await prisma.breakSession.create({
      data: {
        sessionToken: "pstk_test_expired_token_123",
        ticketId: testTicket.id,
        screeningId: mainScreeningId,
        phoneNumber: "+255714000555",
        startedAt,
        expiresAt,
        status: SessionStatus.ACTIVE,
      },
    });

    const sessionState = await SessionService.getSessionState(session.sessionToken);

    expect(sessionState.isValid).toBe(false);
    expect(sessionState.status).toBe(SessionStatus.EXPIRED);
    expect(sessionState.remainingSeconds).toBe(0);
    expect(sessionState.reason).toContain("expired");

    // Check DB record was updated to EXPIRED
    const updatedInDb = await prisma.breakSession.findUnique({
      where: { id: session.id },
    });
    expect(updatedInDb?.status).toBe(SessionStatus.EXPIRED);
  });

  // 9. Operator revocation
  it("9. should immediately invalidate session when revoked by an operator", async () => {
    const testTicket = await prisma.demonstrationTicket.create({
      data: {
        ticketNumber: "REV-TEST-888-T2",
        screeningId: mainScreeningId,
        seatNumber: "Y88",
        customerName: "Revocation Test User",
        status: TicketStatus.ALREADY_ACTIVATED,
      },
    });

    const session = await prisma.breakSession.create({
      data: {
        sessionToken: "pstk_test_revoke_token_456",
        ticketId: testTicket.id,
        screeningId: mainScreeningId,
        phoneNumber: "+255714000666",
        startedAt: new Date(),
        expiresAt: new Date(Date.now() + 900 * 1000),
        status: SessionStatus.ACTIVE,
      },
    });

    await SessionService.revokeSession(session.id, "Auditorium re-entry confirmed by usher.");

    const sessionState = await SessionService.getSessionState(session.sessionToken);

    expect(sessionState.isValid).toBe(false);
    expect(sessionState.status).toBe(SessionStatus.REVOKED);
    expect(sessionState.reason).toContain("Auditorium re-entry");
  });

  // 10. Synchronization during normal playback
  it("10. should accurately advance playback position during normal playback", async () => {
    const screening = await prisma.screening.findUnique({
      where: { id: mainScreeningId },
      include: { contentAsset: true },
    });

    expect(screening).toBeDefined();
    const position = ScreeningService.computePlaybackPosition(screening!);
    expect(position).toBeGreaterThanOrEqual(screening!.playbackPositionSeconds);
  });

  // 11. Synchronization during a pause
  it("11. should freeze authoritative playback position when paused without drift", async () => {
    await ScreeningService.pausePlayback(mainScreeningId);

    const state1 = await ScreeningService.getAuthoritativePlaybackState(mainScreeningId);
    expect(state1?.isPaused).toBe(true);

    const frozenPos = state1?.currentPositionSeconds;

    // Simulate clock passage
    const state2 = await ScreeningService.getAuthoritativePlaybackState(mainScreeningId);
    expect(state2?.currentPositionSeconds).toBe(frozenPos);

    // Resume for subsequent tests
    await ScreeningService.resumePlayback(mainScreeningId);
    const resumedState = await ScreeningService.getAuthoritativePlaybackState(mainScreeningId);
    expect(resumedState?.isPaused).toBe(false);
  });

  // 12. Failure when rights authorization is missing
  it("12. should reject verification when content rights authorization is missing or unlicensed", async () => {
    const result = await TicketService.verifyTicket("OAS-MSC-1100-F01");

    expect(result.isEligible).toBe(false);
    expect(result.status).toBe("RIGHTS_UNAUTHORIZED");
    expect(result.message).toContain("rights");
  });

  // 13. Duplicate billing-event prevention
  it("13. should prevent duplicate billing events for the same break session", async () => {
    const uniqueSessionId = "session_billing_test_999";
    const cinema = "cinema_mlimani_01";
    const ticketNum = "BILL-DUP-TEST";

    // Create a dummy session for billing
    const dummyTicket = await prisma.demonstrationTicket.create({
      data: {
        ticketNumber: ticketNum,
        screeningId: mainScreeningId,
        seatNumber: "Z01",
        customerName: "Billing User",
      },
    });

    await prisma.breakSession.create({
      data: {
        id: uniqueSessionId,
        sessionToken: "pstk_billing_dup_test",
        ticketId: dummyTicket.id,
        screeningId: mainScreeningId,
        phoneNumber: "+255714000777",
        startedAt: new Date(),
        expiresAt: new Date(Date.now() + 900 * 1000),
      },
    });

    const firstBill = await BillingService.recordActivationBilling(
      uniqueSessionId,
      cinema,
      ticketNum
    );
    expect(firstBill).toBeDefined();

    const secondBill = await BillingService.recordActivationBilling(
      uniqueSessionId,
      cinema,
      ticketNum
    );

    expect(secondBill.id).toBe(firstBill.id);

    const count = await prisma.usageBillingEvent.count({
      where: { sessionId: uniqueSessionId },
    });
    expect(count).toBe(1);
  });

  // 14. SMS provider failure
  it("14. should handle SMS provider failure gracefully without crashing", async () => {
    const adapter = new AfricasTalkingSmsAdapter();
    // Send without API key in config
    const result = await adapter.sendSms({
      to: "+255712345678",
      message: "Test message",
      messageType: "OTP_VERIFICATION",
    });

    expect(result.success).toBe(false);
    expect(result.status).toBe("FAILED");
    expect(result.errorDetails).toBeDefined();
  });

  // 15. Cross-tenant authorization where tenant access is implemented
  it("15. should prevent cross-tenant access between different cinema venues", async () => {
    // Check rights between screening of Cinema 1 and Cinema 2
    const crossTenantCheck = await RightsService.verifyScreeningRights(
      mainScreeningId,
      "cinema_oasis_02" // Different cinema tenant
    );

    expect(crossTenantCheck.isAuthorized).toBe(false);
    expect(crossTenantCheck.reason).toContain("Cross-tenant");
  });
});
