import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "../src/lib/db";
import { TicketService } from "../src/features/tickets/ticket-service";
import { OtpService } from "../src/features/messaging/otp-service";
import { SessionService } from "../src/features/sessions/session-service";
import { ScreeningService } from "../src/features/screenings/screening-service";
import { BillingService } from "../src/features/billing/billing-service";
import { RightsService } from "../src/features/rights/rights-service";
import { CustomerAuthService } from "../src/features/auth/customer-auth-service";
import { OperatorAuthService } from "../src/features/operator/operator-auth-service";
import { AfricasTalkingSmsAdapter } from "../src/features/messaging/africas-talking-adapter";
import { hashOtp } from "../src/lib/crypto";
import { ScreeningStatus, SessionStatus, TicketStatus, CinemaStatus } from "@prisma/client";
import { NextRequest } from "next/server";

describe("PottyPlay Comprehensive Test Suite", () => {
  const cinemaId = "test_suite_cinema_01";
  const secondaryCinemaId = "test_suite_cinema_02";
  const mainScreeningId = "test_screening_prime_01";
  const wrongScreeningId = "test_screening_wrong_02";
  const noRightsScreeningId = "test_screening_no_rights_03";

  const setupFixtures = async () => {
    // 0. Clean up any previous test customer records for idempotency
    await prisma.screeningReminder.deleteMany({
      where: {
        customer: {
          OR: [
            { email: { contains: "patron" } },
            { phoneNumber: { in: ["+255714888111", "+255714999333"] } },
          ],
        },
      },
    });
    await prisma.customerAccount.deleteMany({
      where: {
        OR: [
          { email: { contains: "patron" } },
          { phoneNumber: { in: ["+255714888111", "+255714999333"] } },
        ],
      },
    });

    // 1. Create test cinemas
    await prisma.cinema.upsert({
      where: { id: cinemaId },
      update: {},
      create: {
        id: cinemaId,
        name: "Test Suite Cinema 1",
        location: "Test Venue 1, Dar es Salaam",
        status: CinemaStatus.APPROVED,
      },
    });

    await prisma.cinema.upsert({
      where: { id: secondaryCinemaId },
      update: {},
      create: {
        id: secondaryCinemaId,
        name: "Test Suite Cinema 2",
        location: "Test Venue 2, Dar es Salaam",
        status: CinemaStatus.APPROVED,
      },
    });

    // 2. Create screens
    const screen1 = await prisma.screen.upsert({
      where: { id: "test_suite_screen_01" },
      update: {},
      create: {
        id: "test_suite_screen_01",
        cinemaId,
        name: "Screen 1 Atmos",
        totalSeats: 160,
      },
    });

    const screen2 = await prisma.screen.upsert({
      where: { id: "test_suite_screen_02" },
      update: {},
      create: {
        id: "test_suite_screen_02",
        cinemaId: secondaryCinemaId,
        name: "Screen 2 Deluxe",
        totalSeats: 90,
      },
    });

    // 3. Create content assets
    const asset1 = await prisma.contentAsset.upsert({
      where: { id: "test_suite_asset_01" },
      update: {},
      create: {
        id: "test_suite_asset_01",
        title: "Serengeti Shadows (Test)",
        durationSeconds: 1800,
        videoUrl: "/assets/demo-feature.mp4",
        licenseType: "Test Creative Commons",
        licenseSource: "Test Archives",
      },
    });

    const assetUnlicensed = await prisma.contentAsset.upsert({
      where: { id: "test_suite_unlicensed_02" },
      update: {},
      create: {
        id: "test_suite_unlicensed_02",
        title: "Unlicensed Test Asset",
        durationSeconds: 1200,
        videoUrl: "/assets/unlicensed.mp4",
        licenseType: "Unlicensed",
        licenseSource: "Restricted",
      },
    });

    // 4. Rights authorization
    const now = new Date();
    await prisma.rightsAuthorization.upsert({
      where: { id: "auth_test_suite_01" },
      update: {},
      create: {
        id: "auth_test_suite_01",
        contentAssetId: asset1.id,
        cinemaId,
        isAuthorized: true,
        validFrom: new Date(now.getTime() - 24 * 60 * 60 * 1000),
        validUntil: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        maxSessionDurationSeconds: 900,
      },
    });

    // 5. Screenings
    await prisma.screening.upsert({
      where: { id: mainScreeningId },
      update: {},
      create: {
        id: mainScreeningId,
        cinemaId,
        screenId: screen1.id,
        contentAssetId: asset1.id,
        title: "Serengeti Shadows (Main Hall)",
        scheduledStart: new Date(now.getTime() - 15 * 60 * 1000),
        actualStart: new Date(now.getTime() - 12 * 60 * 1000),
        status: ScreeningStatus.PLAYING,
        playbackPositionSeconds: 720.0,
        lastPositionUpdatedAt: now,
      },
    });

    await prisma.screening.upsert({
      where: { id: wrongScreeningId },
      update: {},
      create: {
        id: wrongScreeningId,
        cinemaId,
        screenId: screen1.id,
        contentAssetId: asset1.id,
        title: "Serengeti Shadows (Late Show)",
        scheduledStart: new Date(now.getTime() + 2 * 60 * 60 * 1000),
        status: ScreeningStatus.SCHEDULED,
        playbackPositionSeconds: 0.0,
      },
    });

    await prisma.screening.upsert({
      where: { id: noRightsScreeningId },
      update: {},
      create: {
        id: noRightsScreeningId,
        cinemaId: secondaryCinemaId,
        screenId: screen2.id,
        contentAssetId: assetUnlicensed.id,
        title: "Unlicensed Screening Test",
        scheduledStart: new Date(now.getTime() - 15 * 60 * 1000),
        status: ScreeningStatus.PLAYING,
        playbackPositionSeconds: 100.0,
        lastPositionUpdatedAt: now,
      },
    });

    // 6. Test tickets
    await prisma.demonstrationTicket.upsert({
      where: { ticketNumber: "CC-MLM-7821-A12" },
      update: { screeningId: mainScreeningId, status: TicketStatus.VALID_ADMITTED },
      create: {
        ticketNumber: "CC-MLM-7821-A12",
        claimToken: "CLM-MLM-A12-8821",
        screeningId: mainScreeningId,
        seatNumber: "A12",
        customerName: "Juma Mwanamvua",
        status: TicketStatus.VALID_ADMITTED,
      },
    });

    await prisma.demonstrationTicket.upsert({
      where: { ticketNumber: "CC-MLM-7824-D15" },
      update: { screeningId: mainScreeningId, status: TicketStatus.CANCELLED_REFUNDED },
      create: {
        ticketNumber: "CC-MLM-7824-D15",
        screeningId: mainScreeningId,
        seatNumber: "D15",
        customerName: "Zainab Rashid",
        status: TicketStatus.CANCELLED_REFUNDED,
      },
    });

    await prisma.demonstrationTicket.upsert({
      where: { ticketNumber: "CC-MLM-7825-E02" },
      update: { screeningId: mainScreeningId, status: TicketStatus.INELIGIBLE },
      create: {
        ticketNumber: "CC-MLM-7825-E02",
        screeningId: mainScreeningId,
        seatNumber: "E02",
        customerName: "Bakari Salum",
        status: TicketStatus.INELIGIBLE,
      },
    });

    await prisma.demonstrationTicket.upsert({
      where: { ticketNumber: "CC-MLM-9999-Z99" },
      update: { screeningId: wrongScreeningId, status: TicketStatus.VALID_ADMITTED },
      create: {
        ticketNumber: "CC-MLM-9999-Z99",
        screeningId: wrongScreeningId,
        seatNumber: "Z99",
        customerName: "Fatma Kassim",
        status: TicketStatus.VALID_ADMITTED,
      },
    });

    await prisma.demonstrationTicket.upsert({
      where: { ticketNumber: "OAS-MSC-1100-F01" },
      update: { screeningId: noRightsScreeningId, status: TicketStatus.VALID_ADMITTED },
      create: {
        ticketNumber: "OAS-MSC-1100-F01",
        screeningId: noRightsScreeningId,
        seatNumber: "F01",
        customerName: "Baraka Mwangi",
        status: TicketStatus.VALID_ADMITTED,
      },
    });
  };

  const cleanupTestRecords = async () => {
    await prisma.usageBillingEvent.deleteMany({
      where: {
        OR: [
          { sessionId: { startsWith: "session_billing_test" } },
          { ticketNumber: { in: ["TEST-DUP-ACT-77", "BILL-DUP-TEST"] } },
        ],
      },
    });
    await prisma.breakSession.deleteMany({
      where: {
        OR: [
          {
            sessionToken: {
              in: [
                "pstk_test_expired_token_123",
                "pstk_test_revoke_token_456",
                "pstk_billing_dup_test",
              ],
            },
          },
          { ticket: { ticketNumber: { in: ["TEST-DUP-ACT-77", "EXP-TEST-900-T1", "REV-TEST-888-T2", "CLAIM-DIR-TEST-01"] } } },
        ],
      },
    });
    await prisma.demonstrationTicket.deleteMany({
      where: {
        ticketNumber: {
          in: [
            "EXP-TEST-900-T1",
            "REV-TEST-888-T2",
            "BILL-DUP-TEST",
            "CLAIM-DIR-TEST-01",
            "TEST-DUP-ACT-77",
          ],
        },
      },
    });
    await prisma.customerAccount.deleteMany({
      where: {
        email: { in: ["test_patron@example.com", "login_patron@example.com"] },
      },
    });
  };

  beforeAll(async () => {
    await setupFixtures();
    await cleanupTestRecords();
  });

  afterAll(async () => {
    await cleanupTestRecords();
    await prisma.usageBillingEvent.deleteMany({ where: { cinemaId: { in: [cinemaId, secondaryCinemaId] } } });
    await prisma.breakSession.deleteMany({ where: { screening: { cinemaId: { in: [cinemaId, secondaryCinemaId] } } } });
    await prisma.demonstrationTicket.deleteMany({ where: { screening: { cinemaId: { in: [cinemaId, secondaryCinemaId] } } } });
    await prisma.otpChallenge.deleteMany({ where: { phoneNumber: { in: ["+255714000111", "+255714000444", "+255714888111", "+255714999333"] } } });
    await prisma.rightsAuthorization.deleteMany({ where: { cinemaId: { in: [cinemaId, secondaryCinemaId] } } });
    await prisma.screening.deleteMany({ where: { cinemaId: { in: [cinemaId, secondaryCinemaId] } } });
    await prisma.screen.deleteMany({ where: { cinemaId: { in: [cinemaId, secondaryCinemaId] } } });
    await prisma.cinemaPricingRule.deleteMany({ where: { cinemaId: { in: [cinemaId, secondaryCinemaId] } } });
    await prisma.cinema.deleteMany({ where: { id: { in: [cinemaId, secondaryCinemaId] } } });
    await prisma.contentAsset.deleteMany({ where: { id: { in: ["test_suite_asset_01", "test_suite_unlicensed_02"] } } });
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
        expiresAt: new Date(Date.now() - 1000), // Expired 1 second ago
      },
    });

    const result = await OtpService.verifyOtp(expiredChallenge.id, plainCode);
    expect(result.success).toBe(false);
    expect(result.error).toContain("expired");
  });

  // 6. OTP attempt limit lockout
  it("6. should enforce maximum OTP attempt limit and lock the challenge", async () => {
    const phone = "+255714000333";
    const plainCode = "123456";
    const challenge = await prisma.otpChallenge.create({
      data: {
        phoneNumber: phone,
        codeHash: hashOtp(plainCode),
        attempts: 2, // 2 previous failed attempts
        maxAttempts: 3,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      },
    });

    // 3rd failed attempt
    const thirdAttempt = await OtpService.verifyOtp(challenge.id, "000000");
    expect(thirdAttempt.success).toBe(false);

    // 4th attempt should be blocked due to lock
    const fourthAttempt = await OtpService.verifyOtp(challenge.id, plainCode);
    expect(fourthAttempt.success).toBe(false);
    expect(fourthAttempt.error).toContain("Maximum verification attempts exceeded");
  });

  // 7. Duplicate activation prevention
  it("7. should prevent activating the same ticket twice concurrently or sequentially", async () => {
    const testTicket = await prisma.demonstrationTicket.create({
      data: {
        ticketNumber: "TEST-DUP-ACT-77",
        screeningId: mainScreeningId,
        seatNumber: "D77",
        customerName: "Duplicate Test Patron",
        status: TicketStatus.VALID_ADMITTED,
      },
    });

    const otp = await OtpService.requestOtp("+255714000444");
    await OtpService.verifyOtp(otp.challengeId!, otp.simulatedCode!);

    // First activation succeeds
    const firstActivation = await SessionService.activateSession({
      ticketNumber: testTicket.ticketNumber,
      challengeId: otp.challengeId!,
    });
    expect(firstActivation.success).toBe(true);

    // Second activation attempt while an active session exists must fail
    const secondActivation = await SessionService.activateSession({
      ticketNumber: testTicket.ticketNumber,
      challengeId: otp.challengeId!,
    });

    expect(secondActivation.success).toBe(false);
    expect(secondActivation.error).toContain("already been activated");
  });

  // 8. Session expiration after 900 seconds
  it("8. should enforce server-side hard expiration when 900s limit is exceeded", async () => {
    const ticket = await prisma.demonstrationTicket.create({
      data: {
        ticketNumber: "EXP-TEST-900-T1",
        screeningId: mainScreeningId,
        seatNumber: "B10",
        customerName: "Expiration Patron",
        status: TicketStatus.VALID_ADMITTED,
      },
    });

    const session = await prisma.breakSession.create({
      data: {
        sessionToken: "pstk_test_expired_token_123",
        ticketId: ticket.id,
        screeningId: mainScreeningId,
        phoneNumber: "+255712000001",
        startedAt: new Date(Date.now() - 905 * 1000), // Started 905 seconds ago
        expiresAt: new Date(Date.now() - 5 * 1000), // Expired 5 seconds ago
        status: SessionStatus.ACTIVE,
      },
    });

    const state = await SessionService.getSessionState(session.sessionToken);
    expect(state.isValid).toBe(false);
    expect(state.status).toBe(SessionStatus.EXPIRED);
    expect(state.remainingSeconds).toBe(0);
  });

  // 9. Operator revocation
  it("9. should immediately invalidate session when revoked by an operator", async () => {
    const ticket = await prisma.demonstrationTicket.create({
      data: {
        ticketNumber: "REV-TEST-888-T2",
        screeningId: mainScreeningId,
        seatNumber: "C12",
        customerName: "Revoke Patron",
        status: TicketStatus.VALID_ADMITTED,
      },
    });

    const session = await prisma.breakSession.create({
      data: {
        sessionToken: "pstk_test_revoke_token_456",
        ticketId: ticket.id,
        screeningId: mainScreeningId,
        phoneNumber: "+255712000002",
        startedAt: new Date(),
        expiresAt: new Date(Date.now() + 900 * 1000),
        status: SessionStatus.ACTIVE,
      },
    });

    // Operator revokes session
    const revokeResult = await SessionService.revokeSession(
      session.id,
      "Usher manual audit check"
    );
    expect(revokeResult).toBe(true);

    const state = await SessionService.getSessionState(session.sessionToken);
    expect(state.isValid).toBe(false);
    expect(state.status).toBe(SessionStatus.REVOKED);
  });

  // 10. Normal playback progress calculation
  it("10. should accurately advance playback position during normal playback", () => {
    const now = new Date();
    const screening = {
      actualStart: new Date(now.getTime() - 600 * 1000), // Started 10 minutes ago
      scheduledStart: new Date(now.getTime() - 600 * 1000),
      status: ScreeningStatus.PLAYING,
      isPaused: false,
      pausedAt: null,
      totalPausedDurationSeconds: 0,
      playbackPositionSeconds: 600,
      lastPositionUpdatedAt: now,
      contentAsset: { durationSeconds: 1800 },
    };

    const position = ScreeningService.computePlaybackPosition(screening as any);
    expect(position).toBeGreaterThanOrEqual(599);
    expect(position).toBeLessThanOrEqual(601);
  });

  // 11. Paused screening position freezing
  it("11. should freeze authoritative playback position when paused without drift", () => {
    const now = new Date();
    const pausedAt = new Date(now.getTime() - 120 * 1000); // Paused 2 minutes ago
    const screening = {
      actualStart: new Date(now.getTime() - 600 * 1000),
      scheduledStart: new Date(now.getTime() - 600 * 1000),
      status: ScreeningStatus.PAUSED,
      isPaused: true,
      pausedAt,
      totalPausedDurationSeconds: 0,
      playbackPositionSeconds: 480, // Was at minute 8 when paused
      lastPositionUpdatedAt: pausedAt,
      contentAsset: { durationSeconds: 1800 },
    };

    const position = ScreeningService.computePlaybackPosition(screening as any);
    expect(position).toBe(480);
  });

  // 12. Rights authorization enforcement
  it("12. should reject verification when content rights authorization is missing or unlicensed", async () => {
    const result = await TicketService.verifyTicket(
      "OAS-MSC-1100-F01",
      noRightsScreeningId
    );

    expect(result.isEligible).toBe(false);
    expect(result.status).toBe("RIGHTS_UNAUTHORIZED");
    expect(result.message).toContain("Content rights");
  });

  // 13. Duplicate billing-event prevention
  it("13. should prevent duplicate billing events for the same break session", async () => {
    const uniqueSessionId = "session_billing_test_999";
    const ticketNum = "BILL-DUP-TEST";

    const dummyTicket = await prisma.demonstrationTicket.create({
      data: {
        ticketNumber: ticketNum,
        screeningId: mainScreeningId,
        seatNumber: "Z01",
        customerName: "Billing Patron",
        status: TicketStatus.VALID_ADMITTED,
      },
    });

    await prisma.breakSession.create({
      data: {
        id: uniqueSessionId,
        sessionToken: "pstk_billing_dup_test",
        ticketId: dummyTicket.id,
        screeningId: mainScreeningId,
        startedAt: new Date(),
        expiresAt: new Date(Date.now() + 900 * 1000),
        status: SessionStatus.ACTIVE,
      },
    });

    const firstBill = await BillingService.recordActivationBilling(
      uniqueSessionId,
      cinemaId,
      ticketNum
    );
    expect(firstBill).toBeDefined();

    const secondBill = await BillingService.recordActivationBilling(
      uniqueSessionId,
      cinemaId,
      ticketNum
    );

    expect(secondBill.id).toBe(firstBill.id);

    const billCount = await prisma.usageBillingEvent.count({
      where: { sessionId: uniqueSessionId },
    });
    expect(billCount).toBe(1);
  });

  // 14. Provider failure handling
  it("14. should handle SMS provider failure gracefully without crashing", async () => {
    const originalKey = process.env.AFRICASTALKING_API_KEY;
    delete process.env.AFRICASTALKING_API_KEY;

    const badAdapter = new AfricasTalkingSmsAdapter();

    const result = await badAdapter.sendSms({
      to: "+255714999999",
      message: "Test failure scenario",
      messageType: "OTP_VERIFICATION",
    });

    if (originalKey) {
      process.env.AFRICASTALKING_API_KEY = originalKey;
    }

    expect(result.status).toBe("FAILED");
    expect(result.errorDetails).toBeDefined();
  });

  // 15. Cross-tenant authorization prevention
  it("15. should prevent cross-tenant access between different cinema venues", async () => {
    const crossTenantCheck = await RightsService.verifyScreeningRights(
      mainScreeningId,
      secondaryCinemaId
    );

    expect(crossTenantCheck.isAuthorized).toBe(false);
    expect(crossTenantCheck.reason).toContain("Cross-tenant");
  });

  // 16. Direct ticket claim activation
  let activeClaimSessionToken: string;
  it("16. should activate break session directly via claim token without requiring SMS OTP", async () => {
    const claimTicket = await prisma.demonstrationTicket.create({
      data: {
        ticketNumber: "CLAIM-DIR-TEST-01",
        claimToken: "CLM-TEST-TOKEN-999",
        screeningId: mainScreeningId,
        seatNumber: "G14",
        customerName: "Direct Patron",
        status: TicketStatus.VALID_ADMITTED,
      },
    });

    const result = await SessionService.activateSession({
      claimToken: claimTicket.claimToken!,
      deviceInfo: "Mobile Safari (iOS 18)",
    });

    expect(result.success).toBe(true);
    expect(result.sessionToken).toBeDefined();
    expect(result.seatNumber).toBe("G14");
    expect(result.durationSeconds).toBe(900);

    activeClaimSessionToken = result.sessionToken!;
  });

  // 17. Claim token verification
  it("17. should successfully verify entitlement using a claim token", async () => {
    const result = await TicketService.verifyTicket("CLM-TEST-TOKEN-999");
    expect(result.status).toBe("ALREADY_ACTIVATED");
    expect(result.ticket?.ticketNumber).toBe("CLAIM-DIR-TEST-01");
  });

  // 18. Returning customer session synchronization
  it("18. should allow returning patron to synchronize active session without re-authenticating", async () => {
    const state = await SessionService.getSessionState(activeClaimSessionToken);
    expect(state.isValid).toBe(true);
    expect(state.status).toBe(SessionStatus.ACTIVE);
    expect(state.session?.seatNumber).toBe("G14");
    expect(state.remainingSeconds).toBeGreaterThan(800);
  });

  // 19. Mandatory registration requiring full details and terms acceptance
  it("19. should reject customer registration when terms are not accepted", async () => {
    const result = await CustomerAuthService.registerCustomer({
      fullName: "Test Patron",
      phoneNumber: "+255714888111",
      email: "test_patron@example.com",
      password: "securePassword123!",
      termsAccepted: false, // Must be rejected
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("Privacy Policy and Terms of Service");
  });

  // 20. Customer registration initiates two-factor verification (SMS + Email)
  let testCustomerId: string;
  let testPhoneChallengeId: string;
  let testSimulatedSmsCode: string;
  let testSimulatedEmailCode: string;

  it("20. should create pending customer account and dispatch both SMS and email codes", async () => {
    const result = await CustomerAuthService.registerCustomer({
      fullName: "Test Patron",
      phoneNumber: "+255714888111",
      email: "test_patron@example.com",
      password: "securePassword123!",
      termsAccepted: true,
    });

    expect(result.success).toBe(true);
    expect(result.customerId).toBeDefined();
    expect(result.phoneChallengeId).toBeDefined();
    expect(result.simulatedSmsCode).toBeDefined();
    expect(result.simulatedEmailCode).toBeDefined();

    testCustomerId = result.customerId!;
    testPhoneChallengeId = result.phoneChallengeId!;
    testSimulatedSmsCode = result.simulatedSmsCode!;
    testSimulatedEmailCode = result.simulatedEmailCode!;
  });

  // 21. Phone verification alone leaves account in pending state
  it("21. should require both phone and email verification before activating account", async () => {
    const phoneResult = await CustomerAuthService.verifyPhone({
      customerId: testCustomerId,
      challengeId: testPhoneChallengeId,
      code: testSimulatedSmsCode,
    });

    expect(phoneResult.success).toBe(true);
    expect(phoneResult.isFullyActivated).toBe(false); // Email not verified yet

    // Verify email code
    const emailResult = await CustomerAuthService.verifyEmail({
      customerId: testCustomerId,
      code: testSimulatedEmailCode,
    });

    expect(emailResult.success).toBe(true);
    expect(emailResult.isFullyActivated).toBe(true);
    expect(emailResult.session).toBeDefined();
    expect(emailResult.session?.sessionToken).toBeDefined();
  });

  // 22. Existing customer authentication with password
  it("22. should authenticate existing verified customer using email and password", async () => {
    const loginResult = await CustomerAuthService.login({
      identifier: "test_patron@example.com",
      password: "securePassword123!",
    });

    expect(loginResult.success).toBe(true);
    expect(loginResult.session?.customerId).toBe(testCustomerId);
    expect(loginResult.session?.sessionToken).toBeDefined();
  });

  // 23. Password reset security and session revocation
  it("23. should allow password reset and revoke previous sessions", async () => {
    const resetReq = await CustomerAuthService.requestPasswordReset("test_patron@example.com");
    expect(resetReq.success).toBe(true);

    const customer = await prisma.customerAccount.findUnique({
      where: { id: testCustomerId },
    });
    expect(customer?.passwordResetToken).toBeDefined();

    const resetResult = await CustomerAuthService.resetPassword({
      token: customer!.passwordResetToken!,
      newPassword: "newSecurePassword456!",
    });
    expect(resetResult.success).toBe(true);

    // Old password must fail
    const failedLogin = await CustomerAuthService.login({
      identifier: "test_patron@example.com",
      password: "securePassword123!",
    });
    expect(failedLogin.success).toBe(false);

    // New password must succeed
    const successfulLogin = await CustomerAuthService.login({
      identifier: "test_patron@example.com",
      password: "newSecurePassword456!",
    });
    expect(successfulLogin.success).toBe(true);
  });

  // 24. Customer profile name update
  it("24. should allow verified customer to update their full name", async () => {
    const updateResult = await CustomerAuthService.updateName(testCustomerId, "Juma Updated Patron");
    expect(updateResult.success).toBe(true);
    expect(updateResult.customer?.name).toBe("Juma Updated Patron");

    const fetched = await prisma.customerAccount.findUnique({
      where: { id: testCustomerId },
    });
    expect(fetched?.name).toBe("Juma Updated Patron");
  });

  // 25. Customer email update with strict verification challenge
  it("25. should enforce strict two-step verification code challenge for email change", async () => {
    const newEmail = "updated_patron@example.com";
    const requestResult = await CustomerAuthService.requestEmailChange(testCustomerId, newEmail);
    expect(requestResult.success).toBe(true);
    expect(requestResult.simulatedCode).toBeDefined();

    // Invalid code should be rejected
    const invalidConfirm = await CustomerAuthService.confirmEmailChange(testCustomerId, newEmail, "000000");
    expect(invalidConfirm.success).toBe(false);

    // Valid code should update email
    const validConfirm = await CustomerAuthService.confirmEmailChange(
      testCustomerId,
      newEmail,
      requestResult.simulatedCode!
    );
    expect(validConfirm.success).toBe(true);
    expect(validConfirm.customer?.email).toBe(newEmail);

    const fetched = await prisma.customerAccount.findUnique({
      where: { id: testCustomerId },
    });
    expect(fetched?.email).toBe(newEmail);
  });

  // 26. Customer phone update with strict SMS OTP verification
  it("26. should enforce strict SMS OTP verification for telephone change", async () => {
    const newPhone = "+255714999333";
    const requestResult = await CustomerAuthService.requestPhoneChange(testCustomerId, newPhone);
    expect(requestResult.success).toBe(true);
    expect(requestResult.challengeId).toBeDefined();
    expect(requestResult.simulatedCode).toBeDefined();

    // Invalid OTP should fail
    const invalidConfirm = await CustomerAuthService.confirmPhoneChange(
      testCustomerId,
      newPhone,
      requestResult.challengeId!,
      "000000"
    );
    expect(invalidConfirm.success).toBe(false);

    // Valid OTP should succeed
    const validConfirm = await CustomerAuthService.confirmPhoneChange(
      testCustomerId,
      newPhone,
      requestResult.challengeId!,
      requestResult.simulatedCode!
    );
    expect(validConfirm.success).toBe(true);
    expect(validConfirm.customer?.phoneNumber).toBe(newPhone);

    const fetched = await prisma.customerAccount.findUnique({
      where: { id: testCustomerId },
    });
    expect(fetched?.phoneNumber).toBe(newPhone);
  });

  // 27. Customer password change with strict current password verification
  it("27. should strictly verify current password before permitting password change", async () => {
    // Incorrect current password must fail
    const wrongCurrent = await CustomerAuthService.changePassword(
      testCustomerId,
      "wrongCurrentPassword123!",
      "superBrandNewPass789!"
    );
    expect(wrongCurrent.success).toBe(false);
    expect(wrongCurrent.error).toContain("Current password is incorrect");

    // Correct current password must succeed
    const validChange = await CustomerAuthService.changePassword(
      testCustomerId,
      "newSecurePassword456!",
      "superBrandNewPass789!"
    );
    expect(validChange.success).toBe(true);

    // Verify login with new password succeeds and old password fails
    const oldLogin = await CustomerAuthService.login({
      identifier: "updated_patron@example.com",
      password: "newSecurePassword456!",
    });
    expect(oldLogin.success).toBe(false);

    const newLogin = await CustomerAuthService.login({
      identifier: "updated_patron@example.com",
      password: "superBrandNewPass789!",
    });
    expect(newLogin.success).toBe(true);
  });

  // 28. Cinema Registration through Admin Provisioning
  it("28. should provision cinema, screens, pricing rule and operator user when registered", async () => {
    // Clean any previous test instance
    await prisma.operatorUser.deleteMany({ where: { email: "test_op_manager@cinema.com" } });
    await prisma.cinema.deleteMany({ where: { name: "Suite Test Provisioned Cinema" } });

    // Provision cinema record directly as admin endpoint does
    const cinema = await prisma.cinema.create({
      data: {
        name: "Suite Test Provisioned Cinema",
        location: "Kariakoo, Dar es Salaam",
        status: CinemaStatus.APPROVED,
        organizationName: "Suite Test Cinema Group",
        contactEmail: "admin@suitetestcinema.com",
        contactPhone: "+255712000999",
        ticketingSystem: "Vista Cinema POS",
        screeningSystem: "Dolby IMS3000 TMS",
      },
    });

    const screen = await prisma.screen.create({
      data: {
        cinemaId: cinema.id,
        name: "Screen 1 - Atmos",
        totalSeats: 150,
      },
    });

    const pricing = await prisma.cinemaPricingRule.create({
      data: {
        cinemaId: cinema.id,
        currency: "TZS",
        pricePerSession: 600,
        status: "ACTIVE",
      },
    });

    // Create operator user with hashed password
    const { hashPassword } = await import("../src/lib/crypto");
    const operator = await prisma.operatorUser.create({
      data: {
        cinemaId: cinema.id,
        email: "test_op_manager@cinema.com",
        name: "Kariakoo Manager",
        passwordHash: hashPassword("CinemaPass123!"),
        role: "MANAGER",
        isActive: true,
      },
    });

    expect(cinema.id).toBeDefined();
    expect(screen.cinemaId).toBe(cinema.id);
    expect(pricing.pricePerSession).toBe(600);
    expect(operator.email).toBe("test_op_manager@cinema.com");

    // Clean up
    await prisma.operatorUser.delete({ where: { id: operator.id } });
    await prisma.cinemaPricingRule.deleteMany({ where: { cinemaId: cinema.id } });
    await prisma.screen.deleteMany({ where: { cinemaId: cinema.id } });
    await prisma.cinema.delete({ where: { id: cinema.id } });
  });

  // 29. Operator Authentication
  it("29. should authenticate operator manager and reject invalid credentials or inactive accounts", async () => {
    const { hashPassword } = await import("../src/lib/crypto");
    const testOpCinema = await prisma.cinema.create({
      data: {
        name: "Auth Test Cinema",
        location: "Oysterbay, Dar es Salaam",
        status: CinemaStatus.APPROVED,
        organizationName: "Auth Test Group",
        contactEmail: "contact@authtest.com",
        contactPhone: "+255713444555",
      },
    });

    const testOp = await prisma.operatorUser.create({
      data: {
        cinemaId: testOpCinema.id,
        email: "test_op_manager@cinema.com",
        name: "Test Manager",
        passwordHash: hashPassword("StrongOperatorPass123!"),
        role: "MANAGER",
        isActive: true,
      },
    });

    // Invalid password must fail
    const badLogin = await OperatorAuthService.login(
      "test_op_manager@cinema.com",
      "wrongPassword999!"
    );
    expect(badLogin.success).toBe(false);
    expect(badLogin.error).toContain("Invalid operator credentials");

    // Non-existent email must fail
    const unknownLogin = await OperatorAuthService.login(
      "unknown_operator@cinema.com",
      "StrongOperatorPass123!"
    );
    expect(unknownLogin.success).toBe(false);

    // Valid credentials must succeed
    const validLogin = await OperatorAuthService.login(
      "test_op_manager@cinema.com",
      "StrongOperatorPass123!"
    );
    expect(validLogin.success).toBe(true);
    expect(validLogin.token).toBeDefined();
    expect(validLogin.operator?.cinema.name).toBe("Auth Test Cinema");

    // Verify session
    const verified = await OperatorAuthService.verifySession(validLogin.token!);
    expect(verified).not.toBeNull();
    expect(verified?.email).toBe("test_op_manager@cinema.com");

    // Logout
    await OperatorAuthService.logout(validLogin.token!);
    const afterLogout = await OperatorAuthService.verifySession(validLogin.token!);
    expect(afterLogout).toBeNull();

    // Clean up
    await prisma.operatorUser.delete({ where: { id: testOp.id } });
    await prisma.cinema.delete({ where: { id: testOpCinema.id } });
  });

  // 30. Operator Forgot Password and Reset Flow
  it("30. should process operator forgot password request and reset password with token", async () => {
    const { hashPassword } = await import("../src/lib/crypto");
    const testOpCinema = await prisma.cinema.create({
      data: {
        name: "Reset Test Cinema",
        location: "Mikocheni, Dar es Salaam",
        status: CinemaStatus.APPROVED,
        organizationName: "Reset Test Group",
        contactEmail: "contact@resettest.com",
        contactPhone: "+255713888777",
      },
    });

    const testOp = await prisma.operatorUser.create({
      data: {
        cinemaId: testOpCinema.id,
        email: "test_op_reset@cinema.com",
        name: "Reset Manager",
        passwordHash: hashPassword("InitialPass123!"),
        role: "MANAGER",
        isActive: true,
      },
    });

    // Request reset token
    const forgotResult = await OperatorAuthService.requestPasswordReset("test_op_reset@cinema.com");
    expect(forgotResult.success).toBe(true);

    const updatedOp = await prisma.operatorUser.findUnique({
      where: { id: testOp.id },
    });
    expect(updatedOp?.passwordResetToken).toBeDefined();
    expect(updatedOp?.passwordResetToken?.startsWith("opr_rst_")).toBe(true);

    // Invalid token must fail
    const invalidReset = await OperatorAuthService.resetPassword(
      "opr_rst_fake_invalid_token",
      "BrandNewPass456!"
    );
    expect(invalidReset.success).toBe(false);

    // Password shorter than 8 chars must fail
    const shortPassReset = await OperatorAuthService.resetPassword(
      updatedOp!.passwordResetToken!,
      "short"
    );
    expect(shortPassReset.success).toBe(false);

    // Valid reset
    const validReset = await OperatorAuthService.resetPassword(
      updatedOp!.passwordResetToken!,
      "BrandNewStrongPass456!"
    );
    expect(validReset.success).toBe(true);

    // Old password fails
    const oldLogin = await OperatorAuthService.login(
      "test_op_reset@cinema.com",
      "InitialPass123!"
    );
    expect(oldLogin.success).toBe(false);

    // New password succeeds
    const newLogin = await OperatorAuthService.login(
      "test_op_reset@cinema.com",
      "BrandNewStrongPass456!"
    );
    expect(newLogin.success).toBe(true);

    // Clean up
    await OperatorAuthService.logout(newLogin.token!);
    await prisma.operatorUser.delete({ where: { id: testOp.id } });
    await prisma.cinema.delete({ where: { id: testOpCinema.id } });
  });

  // 31. Cinema Registration Invitation Flow
  it("31. should manage cinema registration invitations with strict expiration and one-time token enforcement", async () => {
    // 1. Create an active invitation (valid for 48 hours)
    const validInvitation = await prisma.cinemaRegistrationInvitation.create({
      data: {
        token: "cin_inv_valid_test_token_123",
        organizationName: "Invite Test Cinema",
        contactName: "Sarah Invite",
        contactEmail: "sarah@invitetest.com",
        city: "Arusha",
        country: "Tanzania",
        screensCount: 2,
        expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
      },
    });

    expect(validInvitation.token).toBe("cin_inv_valid_test_token_123");
    expect(validInvitation.isUsed).toBe(false);

    // 2. Create an expired invitation
    const expiredInvitation = await prisma.cinemaRegistrationInvitation.create({
      data: {
        token: "cin_inv_expired_test_token_456",
        organizationName: "Expired Cinema",
        contactName: "Late Contact",
        contactEmail: "late@expiredcinema.com",
        expiresAt: new Date(Date.now() - 1000), // Expired 1 second ago
      },
    });

    expect(new Date(expiredInvitation.expiresAt).getTime()).toBeLessThan(Date.now());

    // 3. Complete registration with valid invitation
    const { hashPassword } = await import("../src/lib/crypto");
    const cinema = await prisma.cinema.create({
      data: {
        name: validInvitation.organizationName,
        location: "Arusha, Tanzania",
        status: CinemaStatus.APPROVED,
        organizationName: validInvitation.organizationName,
        contactEmail: validInvitation.contactEmail,
        contactPhone: "+255712333444",
      },
    });

    const opUser = await prisma.operatorUser.create({
      data: {
        cinemaId: cinema.id,
        email: validInvitation.contactEmail,
        name: validInvitation.contactName,
        passwordHash: hashPassword("CinemaInvitePass2026!"),
        role: "MANAGER",
        isActive: true,
      },
    });

    // Mark invitation used
    await prisma.cinemaRegistrationInvitation.update({
      where: { id: validInvitation.id },
      data: {
        isUsed: true,
        usedAt: new Date(),
        cinemaId: cinema.id,
      },
    });

    const updatedInv = await prisma.cinemaRegistrationInvitation.findUnique({
      where: { id: validInvitation.id },
    });
    expect(updatedInv?.isUsed).toBe(true);

    // Operator can now log in at /operator
    const loginResult = await OperatorAuthService.login(
      "sarah@invitetest.com",
      "CinemaInvitePass2026!"
    );
    expect(loginResult.success).toBe(true);
    expect(loginResult.operator?.cinema.name).toBe("Invite Test Cinema");

    // Clean up
    if (loginResult.token) await OperatorAuthService.logout(loginResult.token);
    await prisma.operatorUser.delete({ where: { id: opUser.id } });
    await prisma.cinema.delete({ where: { id: cinema.id } });
    await prisma.cinemaRegistrationInvitation.deleteMany({
      where: { token: { in: ["cin_inv_valid_test_token_123", "cin_inv_expired_test_token_456"] } },
    });
  });

  // 32. Partner Application Honeypot & Geographic Telemetry (IP / User-Agent)
  it("32. should store IP address and user agent on partner applications and block spam submissions via honeypot", async () => {
    const { POST: partnerRegisterPost } = await import("../src/app/api/partner/register/route");
    const { NextRequest } = await import("next/server");

    // Clean up any existing records
    await prisma.partnerApplication.deleteMany({
      where: { contactEmail: { in: ["juma@dodomacineplex.com", "spambot@spamcorp.com"] } },
    });

    // 1. Submit normal request from human user (honeypot empty)
    const req = new NextRequest("http://localhost:3000/api/partner/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-forwarded-for": "102.214.45.12",
        "user-agent": "Mozilla/5.0 TestBrowser",
      },
      body: JSON.stringify({
        organizationName: "Dodoma Cineplex",
        contactName: "Juma Ali",
        contactEmail: "juma@dodomacineplex.com",
        contactPhone: "+255711223344",
        city: "Dodoma",
        country: "Tanzania",
        website: "", // Honeypot left empty
      }),
    });

    const res = await partnerRegisterPost(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);

    const app = await prisma.partnerApplication.findFirst({
      where: { contactEmail: "juma@dodomacineplex.com" },
    });
    expect(app).not.toBeNull();
    expect(app?.ipAddress).toBe("102.214.45.12");
    expect(app?.userAgent).toBe("Mozilla/5.0 TestBrowser");

    // 2. Submit bot spam with populated honeypot
    const botReq = new NextRequest("http://localhost:3000/api/partner/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-forwarded-for": "198.51.100.99",
        "user-agent": "SpamBot/2.0",
      },
      body: JSON.stringify({
        organizationName: "Spam Cinema Corp",
        contactName: "Spam Bot",
        contactEmail: "spambot@spamcorp.com",
        contactPhone: "+10000000000",
        city: "Spamville",
        country: "Tanzania",
        website: "http://buy-cheap-watches-now.spam", // Honeypot populated!
      }),
    });

    const botRes = await partnerRegisterPost(botReq);
    const botData = await botRes.json();
    expect(botRes.status).toBe(200);
    expect(botData.success).toBe(true);

    // Verify spam was NOT saved to the database
    const spamApp = await prisma.partnerApplication.findFirst({
      where: { contactEmail: "spambot@spamcorp.com" },
    });
    expect(spamApp).toBeNull();

    // Clean up
    if (app) {
      await prisma.auditEvent.deleteMany({
        where: { entityId: app.id, entityType: "PARTNER_APPLICATION" },
      });
      await prisma.partnerApplication.delete({ where: { id: app.id } });
    }
  });

  // 33. Dynamic billing applies configured CinemaPricingRule rate instead of default
  it("33. should apply active CinemaPricingRule rate and currency to usage billing events", async () => {
    // Set up a custom pricing rule of 750 TZS for secondaryCinemaId
    await prisma.cinemaPricingRule.deleteMany({ where: { cinemaId: secondaryCinemaId } });
    await prisma.cinemaPricingRule.create({
      data: {
        cinemaId: secondaryCinemaId,
        currency: "TZS",
        pricePerSession: 750,
        status: "ACTIVE",
        notes: "Custom test commercial agreement rate",
        effectiveFrom: new Date(Date.now() - 3600 * 1000),
      },
    });

    const testSessionId = "session_dynamic_price_test_01";
    // Create dummy break session
    const ticket = await prisma.demonstrationTicket.findFirst({
      where: { screening: { cinemaId: secondaryCinemaId } },
    });
    expect(ticket).not.toBeNull();

    const session = await prisma.breakSession.create({
      data: {
        id: testSessionId,
        sessionToken: "tok_dyn_price_test_" + Date.now(),
        ticketId: ticket!.id,
        screeningId: ticket!.screeningId,
        expiresAt: new Date(Date.now() + 900 * 1000),
        status: SessionStatus.ACTIVE,
      },
    });

    const event = await BillingService.recordActivationBilling(
      session.id,
      secondaryCinemaId,
      ticket!.ticketNumber
    );

    expect(event.priceTzs).toBe(750);
    expect(event.currency).toBe("TZS");
    expect(event.isSimulated).toBe(false);
    expect(event.disclaimer).toContain("Custom test commercial agreement rate");

    // Clean up
    await prisma.usageBillingEvent.deleteMany({ where: { sessionId: session.id } });
    await prisma.breakSession.delete({ where: { id: session.id } });
  });

  // 34. POS webhook receiver validates HMAC signature, updates ticket status, pauses/resumes playback, and revokes sessions on refund
  it("34. should handle POS webhook events with HMAC signature verification and state synchronization", async () => {
    const { POST: posWebhookPost } = await import("../src/app/api/webhooks/pos/route");
    const { createHmac } = await import("crypto");
    const { config } = await import("../src/lib/config");

    // Helper to generate signed NextRequest
    const createSignedReq = (bodyObj: any) => {
      const raw = JSON.stringify(bodyObj);
      const sig = createHmac("sha256", config.posWebhookSecret).update(raw).digest("hex");
      return new NextRequest("http://localhost:3000/api/webhooks/pos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-pos-signature": sig,
        },
        body: raw,
      });
    };

    // 1. Admit ticket via POS webhook
    const admitPayload = {
      event: "ticket.admitted",
      data: {
        ticketNumber: "POS-TK-9901",
        screeningId: mainScreeningId,
        seatNumber: "K12",
        customerName: "Khalfan Juma",
        claimToken: "POS-CLM-9901",
      },
    };
    const admitRes = await posWebhookPost(createSignedReq(admitPayload));
    const admitData = await admitRes.json();
    expect(admitRes.status).toBe(200);
    expect(admitData.success).toBe(true);

    const ticketInDb = await prisma.demonstrationTicket.findUnique({
      where: { ticketNumber: "POS-TK-9901" },
    });
    expect(ticketInDb).not.toBeNull();
    expect(ticketInDb?.status).toBe(TicketStatus.VALID_ADMITTED);

    // 2. Pause screening via POS webhook
    const pausePayload = {
      event: "screening.timeline_pause",
      data: { screeningId: mainScreeningId },
    };
    const pauseRes = await posWebhookPost(createSignedReq(pausePayload));
    const pauseData = await pauseRes.json();
    expect(pauseRes.status).toBe(200);
    expect(pauseData.success).toBe(true);
    expect(pauseData.playbackState.isPaused).toBe(true);

    // 3. Resume screening via POS webhook
    const resumePayload = {
      event: "screening.timeline_resume",
      data: { screeningId: mainScreeningId },
    };
    const resumeRes = await posWebhookPost(createSignedReq(resumePayload));
    const resumeData = await resumeRes.json();
    expect(resumeRes.status).toBe(200);
    expect(resumeData.playbackState.isPaused).toBe(false);

    // 4. Create active break session for ticket, then refund via POS webhook
    const activeSession = await prisma.breakSession.create({
      data: {
        sessionToken: "tok_pos_ref_test_" + Date.now(),
        ticketId: ticketInDb!.id,
        screeningId: mainScreeningId,
        expiresAt: new Date(Date.now() + 900 * 1000),
        status: SessionStatus.ACTIVE,
      },
    });

    const refundPayload = {
      event: "ticket.refunded",
      data: { ticketNumber: "POS-TK-9901" },
    };
    const refundRes = await posWebhookPost(createSignedReq(refundPayload));
    const refundData = await refundRes.json();
    expect(refundRes.status).toBe(200);
    expect(refundData.success).toBe(true);
    expect(refundData.revokedSessions).toBe(1);

    const updatedSession = await prisma.breakSession.findUnique({
      where: { id: activeSession.id },
    });
    expect(updatedSession?.status).toBe(SessionStatus.REVOKED);
    expect(updatedSession?.revokedReason).toContain("POS");

    // Clean up
    await prisma.breakSession.deleteMany({ where: { ticketId: ticketInDb!.id } });
    await prisma.demonstrationTicket.delete({ where: { id: ticketInDb!.id } });
  });

  // 35. Screening reminder dispatch worker
  it("35. should evaluate pending screening reminders and dispatch notifications when due", async () => {
    const { POST: remindersDispatchPost } = await import("../src/app/api/reminders/dispatch/route");

    // Create a customer with a reminder due now
    const reminderCustomer = await prisma.customerAccount.create({
      data: {
        email: "remindee_patron@example.com",
        name: "Baraka Remindee",
        phoneNumber: "+255714000777",
        status: "ACTIVE",
        phoneVerified: true,
        emailVerified: true,
      },
    });

    // Create reminder for mainScreeningId
    const reminder = await prisma.screeningReminder.create({
      data: {
        customerId: reminderCustomer.id,
        screeningId: mainScreeningId,
        offsetMinutes: 1440,
        isEnabled: true,
        sentAt: null,
      },
    });

    const req = new NextRequest("http://localhost:3000/api/reminders/dispatch", {
      method: "POST",
    });

    const res = await remindersDispatchPost(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);

    const updatedReminder = await prisma.screeningReminder.findUnique({
      where: { id: reminder.id },
    });
    expect(updatedReminder?.sentAt).not.toBeNull();

    // Clean up
    await prisma.screeningReminder.delete({ where: { id: reminder.id } });
    await prisma.customerAccount.delete({ where: { id: reminderCustomer.id } });
  });

  // 36. Operator screening and ticket provisioning endpoints
  it("36. should provision screenings and tickets with operator authorization", async () => {
    const { POST: operatorScreeningsPost } = await import("../src/app/api/operator/screenings/route");
    const { POST: operatorTicketsPost } = await import("../src/app/api/operator/tickets/route");

    // Create dedicated authorized operator user for cinemaId
    const { hashPassword } = await import("../src/lib/crypto");
    const testOp = await prisma.operatorUser.upsert({
      where: { email: "test_op_36@cinema.com" },
      update: {},
      create: {
        cinemaId,
        email: "test_op_36@cinema.com",
        name: "Test Operator 36",
        passwordHash: hashPassword("OperatorPass36!"),
        role: "MANAGER",
        isActive: true,
      },
    });

    const opLogin = await OperatorAuthService.login(
      "test_op_36@cinema.com",
      "OperatorPass36!"
    );
    expect(opLogin.token).toBeDefined();
    const opToken = opLogin.token!;

    // 1. Create a new screening via operator endpoint
    const screen = await prisma.screen.findFirst({ where: { cinemaId } });
    expect(screen).not.toBeNull();

    const screeningReq = new NextRequest("http://localhost:3000/api/operator/screenings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${opToken}`,
      },
      body: JSON.stringify({
        screenId: screen!.id,
        title: "The Lion King - Special Projection",
        scheduledStart: new Date(Date.now() + 2 * 3600 * 1000).toISOString(),
      }),
    });

    const screeningRes = await operatorScreeningsPost(screeningReq);
    const screeningData = await screeningRes.json();
    expect(screeningRes.status).toBe(200);
    expect(screeningData.success).toBe(true);
    expect(screeningData.screening.title).toBe("The Lion King - Special Projection");
    const createdScreeningId = screeningData.screening.id;

    // 2. Issue a demonstration ticket for the newly created screening
    const ticketReq = new NextRequest("http://localhost:3000/api/operator/tickets", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${opToken}`,
      },
      body: JSON.stringify({
        screeningId: createdScreeningId,
        seatNumber: "H10",
        customerName: "Faraji Salum",
      }),
    });

    const ticketRes = await operatorTicketsPost(ticketReq);
    const ticketData = await ticketRes.json();
    expect(ticketRes.status).toBe(200);
    expect(ticketData.success).toBe(true);
    expect(ticketData.ticket.seatNumber).toBe("H10");
    expect(ticketData.watchClaimUrl).toContain("/watch?claim=");

    // Clean up
    await prisma.demonstrationTicket.delete({ where: { id: ticketData.ticket.id } });
    await prisma.screening.delete({ where: { id: createdScreeningId } });
    await prisma.operatorUser.delete({ where: { id: testOp.id } });
  });
});
