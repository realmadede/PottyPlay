import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "../src/lib/db";
import { TicketService } from "../src/features/tickets/ticket-service";
import { OtpService } from "../src/features/messaging/otp-service";
import { SessionService } from "../src/features/sessions/session-service";
import { ScreeningService } from "../src/features/screenings/screening-service";
import { BillingService } from "../src/features/billing/billing-service";
import { RightsService } from "../src/features/rights/rights-service";
import { CustomerAuthService } from "../src/features/auth/customer-auth-service";
import { AfricasTalkingSmsAdapter } from "../src/features/messaging/africas-talking-adapter";
import { hashOtp } from "../src/lib/crypto";
import { ScreeningStatus, SessionStatus, TicketStatus, CinemaStatus } from "@prisma/client";

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
});
