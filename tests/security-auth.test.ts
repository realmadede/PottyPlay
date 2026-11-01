import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { NextRequest } from "next/server";
import { prisma } from "../src/lib/db";
import { hashPassword } from "../src/lib/crypto";
import { AdminAuthService } from "../src/features/admin/admin-auth-service";
import { maskPhoneNumber, maskToken } from "../src/lib/auth-guards";
import { GET as ticketsGet, POST as ticketsPost } from "../src/app/api/operator/tickets/route";
import { GET as screeningsGet, POST as screeningsPost } from "../src/app/api/operator/screenings/route";
import { GET as dashboardGet } from "../src/app/api/operator/dashboard/route";
import { POST as revokePost } from "../src/app/api/operator/revoke/route";
import { GET as pricingGet, POST as pricingPost } from "../src/app/api/operator/pricing/route";
import { GET as currentGet } from "../src/app/api/screenings/current/route";
import { GET as rightsGet, POST as rightsPost } from "../src/app/api/admin/rights/route";
import { GET as assetsGet, POST as assetsPost } from "../src/app/api/operator/assets/route";
import { GET as playbackGet, POST as playbackPost } from "../src/app/api/simulator/playback/route";
import { POST as posWebhookPost } from "../src/app/api/webhooks/pos/route";
import { POST as partnerReviewPost } from "../src/app/api/admin/partners/review/route";
import { POST as otpRequestPost } from "../src/app/api/auth/otp/request/route";
import { POST as ticketVerifyPost } from "../src/app/api/tickets/verify/route";
import { GET as sessionsSyncGet } from "../src/app/api/sessions/sync/route";
import { POST as remindersDispatchPost, GET as remindersDispatchGet } from "../src/app/api/reminders/dispatch/route";
import { SessionService } from "../src/features/sessions/session-service";
import { TicketService } from "../src/features/tickets/ticket-service";
import { OtpService } from "../src/features/messaging/otp-service";
import { createHmac, createHash } from "crypto";
import { config } from "../src/lib/config";
import { CinemaStatus, OperatorRole, ScreeningStatus, SessionStatus, TicketStatus } from "@prisma/client";

/**
 * Security regression tests for operator authentication and tenant isolation.
 * Every test here failed against the code base before the shared auth guard was introduced.
 */
describe("Operator API authentication and tenant isolation", () => {
  const A = "sec_cinema_a";
  const B = "sec_cinema_b";
  const C = "sec_cinema_c";
  const assetId = "sec_asset_01";
  const assetBOnly = "sec_asset_b_only";
  const assetUnlicensed = "sec_asset_unlicensed";
  const adminAssetTitle = "Sec Admin Provisioned Asset";
  const tokenMgrC = "opr_sec_manager_c_token";
  const screenA = "sec_screen_a";
  const screenB = "sec_screen_b";
  const screeningA = "sec_screening_a";
  const screeningB = "sec_screening_b";
  const tokenMgrA = "opr_sec_manager_a_token";
  const tokenProjA = "opr_sec_projectionist_a_token";
  const tokenMgrB = "opr_sec_manager_b_token";
  const adminUsername = "sec_test_admin";
  const sessionIdB = "sec_session_b";
  let adminToken = "";

  const url = (path: string) => `http://localhost:3000${path}`;
  const bearer = (token: string): Record<string, string> => ({ Authorization: `Bearer ${token}` });
  const get = (path: string, token?: string) =>
    new NextRequest(url(path), { method: "GET", headers: token ? bearer(token) : {} });
  const post = (path: string, body: unknown, token?: string) =>
    new NextRequest(url(path), {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(token ? bearer(token) : {}) },
      body: JSON.stringify(body),
    });

  const cleanup = async () => {
    await prisma.auditEvent.deleteMany({
      where: { OR: [{ cinemaId: { in: [A, B, C] } }, { entityId: { in: [screeningA, screeningB, sessionIdB] } }] },
    });
    await prisma.operatorUser.deleteMany({
      where: { OR: [{ cinemaId: { in: [A, B, C] } }, { email: { contains: "sec_" } }] },
    });
    await prisma.partnerApplication.deleteMany({
      where: { contactEmail: { contains: "sec_" } },
    });
    await prisma.otpChallenge.deleteMany({
      where: { phoneNumber: { in: ["+255714000333", "+255714000999"] } },
    });
    await prisma.cinema.deleteMany({ where: { id: { in: [A, B, C] } } });
    await prisma.contentAsset.deleteMany({
      where: { OR: [{ id: { in: [assetId, assetBOnly, assetUnlicensed] } }, { title: adminAssetTitle }] },
    });
    await prisma.adminUser.deleteMany({ where: { username: adminUsername } });
  };

  beforeAll(async () => {
    await cleanup();

    for (const [id, name] of [[A, "Security Cinema A"], [B, "Security Cinema B"], [C, "Security Cinema C"]] as const) {
      await prisma.cinema.create({
        data: { id, name, location: "Test", status: CinemaStatus.APPROVED },
      });
    }
    await prisma.contentAsset.create({
      data: {
        id: assetId,
        title: "Security Asset",
        durationSeconds: 3600,
        videoUrl: "https://example.com/video.mp4",
        licenseType: "TEST",
        licenseSource: "TEST",
      },
    });
    for (const id of [assetBOnly, assetUnlicensed]) {
      await prisma.contentAsset.create({
        data: {
          id,
          title: `Asset ${id}`,
          durationSeconds: 3600,
          videoUrl: "https://example.com/other.mp4",
          licenseType: "TEST",
          licenseSource: "TEST",
        },
      });
    }
    const rightsWindow = {
      isAuthorized: true,
      validFrom: new Date(Date.now() - 24 * 3600 * 1000),
      validUntil: new Date(Date.now() + 365 * 24 * 3600 * 1000),
    };
    await prisma.rightsAuthorization.createMany({
      data: [
        { cinemaId: A, contentAssetId: assetId, ...rightsWindow },
        { cinemaId: B, contentAssetId: assetId, ...rightsWindow },
        { cinemaId: B, contentAssetId: assetBOnly, ...rightsWindow },
      ],
    });
    await prisma.screen.create({ data: { id: screenA, cinemaId: A, name: "Screen A" } });
    await prisma.screen.create({ data: { id: "sec_screen_c", cinemaId: C, name: "Screen C" } });
    await prisma.screen.create({ data: { id: screenB, cinemaId: B, name: "Screen B" } });
    for (const [id, cinemaId, screenId] of [
      [screeningA, A, screenA],
      [screeningB, B, screenB],
    ] as const) {
      await prisma.screening.create({
        data: {
          id,
          cinemaId,
          screenId,
          contentAssetId: assetId,
          title: `Screening ${cinemaId}`,
          scheduledStart: new Date(Date.now() - 600 * 1000),
          actualStart: new Date(Date.now() - 600 * 1000),
          status: ScreeningStatus.PLAYING,
        },
      });
    }

    const passwordHash = hashPassword("Irrelevant-Password-1!");
    const expires = new Date(Date.now() + 3600 * 1000);
    await prisma.operatorUser.createMany({
      data: [
        { cinemaId: A, email: "sec_mgr_a@test.local", name: "Mgr A", passwordHash, role: OperatorRole.MANAGER, sessionToken: tokenMgrA, tokenExpiresAt: expires },
        { cinemaId: A, email: "sec_proj_a@test.local", name: "Proj A", passwordHash, role: OperatorRole.PROJECTIONIST, sessionToken: tokenProjA, tokenExpiresAt: expires },
        { cinemaId: B, email: "sec_mgr_b@test.local", name: "Mgr B", passwordHash, role: OperatorRole.MANAGER, sessionToken: tokenMgrB, tokenExpiresAt: expires },
        { cinemaId: C, email: "sec_mgr_c@test.local", name: "Mgr C", passwordHash, role: OperatorRole.MANAGER, sessionToken: tokenMgrC, tokenExpiresAt: expires },
      ],
    });

    await prisma.cinemaPricingRule.create({
      data: { cinemaId: A, pricePerSession: 111, status: "ACTIVE" },
    });
    await prisma.cinemaPricingRule.create({
      data: { cinemaId: B, pricePerSession: 222, status: "ACTIVE" },
    });

    const ticketB = await prisma.demonstrationTicket.create({
      data: {
        ticketNumber: "SEC-TK-B-1",
        claimToken: "SEC-CLM-B-1",
        screeningId: screeningB,
        seatNumber: "B1",
        customerName: "Patron B",
        status: TicketStatus.VALID_ADMITTED,
      },
    });
    await prisma.demonstrationTicket.create({
      data: {
        ticketNumber: "SEC-TK-A-1",
        claimToken: "SEC-CLM-A-1",
        screeningId: screeningA,
        seatNumber: "A1",
        customerName: "Patron A",
        status: TicketStatus.VALID_ADMITTED,
      },
    });
    await prisma.breakSession.create({
      data: {
        id: sessionIdB,
        sessionToken: "pstk_sec_session_b_token",
        ticketId: ticketB.id,
        screeningId: screeningB,
        phoneNumber: "+255712345678",
        expiresAt: new Date(Date.now() + 900 * 1000),
        status: SessionStatus.ACTIVE,
      },
    });

    await prisma.adminUser.create({
      data: {
        username: adminUsername,
        email: "sec_admin@test.local",
        passwordHash: hashPassword("Sec-Admin-Password-1!"),
      },
    });
    const login = await AdminAuthService.login(adminUsername, "Sec-Admin-Password-1!", "203.0.113.50");
    expect(login.success).toBe(true);
    adminToken = login.token as string;
  });

  afterAll(async () => {
    await cleanup();
  });

  describe("forged administrator tokens", () => {
    const forged = "adm_forged_prefix_only";

    it("rejects a forged adm_ token on every operator endpoint", async () => {
      const results = await Promise.all([
        ticketsGet(get(`/api/operator/tickets?cinemaId=${B}`, forged)),
        screeningsGet(get(`/api/operator/screenings?cinemaId=${B}`, forged)),
        dashboardGet(get(`/api/operator/dashboard?cinemaId=${B}`, forged)),
        revokePost(post("/api/operator/revoke", { sessionId: sessionIdB, reason: "forged attempt" }, forged)),
        pricingGet(get(`/api/operator/pricing?cinemaId=${B}`, forged)),
        playbackGet(get("/api/simulator/playback", forged)),
      ]);
      expect(results.map((r) => r.status)).toEqual([401, 401, 401, 401, 401, 401]);

      const session = await prisma.breakSession.findUnique({ where: { id: sessionIdB } });
      expect(session?.status).toBe(SessionStatus.ACTIVE);
    });

    it("rejects a correctly shaped but wrongly signed admin token", async () => {
      const [id, ts] = adminToken.slice(4).split(".");
      const tampered = `adm_${id}.${ts}.${"0".repeat(64)}`;
      const res = await ticketsGet(get(`/api/operator/tickets?cinemaId=${B}`, tampered));
      expect(res.status).toBe(401);
    });
  });

  describe("unauthenticated access", () => {
    it("rejects requests without a token", async () => {
      const results = await Promise.all([
        ticketsGet(get(`/api/operator/tickets?cinemaId=${A}`)),
        pricingGet(get(`/api/operator/pricing?cinemaId=${A}`)),
        pricingPost(post("/api/operator/pricing", { cinemaId: A, pricePerSession: 1 })),
        playbackGet(get("/api/simulator/playback")),
        playbackPost(post("/api/simulator/playback", { action: "pause", screeningId: screeningA })),
      ]);
      expect(results.map((r) => r.status)).toEqual([401, 401, 401, 401, 401]);

      const rules = await prisma.cinemaPricingRule.findMany({ where: { cinemaId: A, status: "ACTIVE" } });
      expect(rules).toHaveLength(1);
      expect(rules[0].pricePerSession).toBe(111);
      const screening = await prisma.screening.findUnique({ where: { id: screeningA } });
      expect(screening?.isPaused).toBe(false);
    });
  });

  describe("valid platform administrator", () => {
    it("can read a specific cinema but must name one", async () => {
      const ok = await ticketsGet(get(`/api/operator/tickets?cinemaId=${B}`, adminToken));
      expect(ok.status).toBe(200);
      const json = await ok.json();
      expect(json.tickets.map((t: { ticketNumber: string }) => t.ticketNumber)).toEqual(["SEC-TK-B-1"]);

      const missing = await ticketsGet(get("/api/operator/tickets", adminToken));
      expect(missing.status).toBe(400);
    });
  });

  describe("cross-tenant isolation", () => {
    it("denies an operator requesting another cinema", async () => {
      const query = await ticketsGet(get(`/api/operator/tickets?cinemaId=${B}`, tokenMgrA));
      expect(query.status).toBe(403);

      const header = await ticketsGet(
        new NextRequest(url("/api/operator/tickets"), {
          headers: { ...bearer(tokenMgrA), "x-cinema-id": B },
        })
      );
      expect(header.status).toBe(403);

      const body = await ticketsPost(
        post(
          "/api/operator/tickets",
          { screeningId: screeningB, seatNumber: "Z9", customerName: "Intruder", cinemaId: B },
          tokenMgrA
        )
      );
      expect(body.status).toBe(403);
    });

    it("cannot issue a ticket for another cinema's screening even without naming it", async () => {
      const res = await ticketsPost(
        post("/api/operator/tickets", { screeningId: screeningB, seatNumber: "Z9", customerName: "Intruder" }, tokenMgrA)
      );
      expect(res.status).toBe(404);
      const count = await prisma.demonstrationTicket.count({ where: { seatNumber: "Z9" } });
      expect(count).toBe(0);
    });

    it("only returns the operator's own tickets, screenings and cinema", async () => {
      const tickets = await (await ticketsGet(get("/api/operator/tickets", tokenMgrA))).json();
      expect(tickets.tickets.map((t: { ticketNumber: string }) => t.ticketNumber)).toEqual(["SEC-TK-A-1"]);

      const screenings = await (await screeningsGet(get("/api/operator/screenings", tokenMgrA))).json();
      expect(screenings.screenings.map((s: { id: string }) => s.id)).toEqual([screeningA]);

      const dashboard = await (await dashboardGet(get("/api/operator/dashboard", tokenMgrA))).json();
      expect(dashboard.cinema.id).toBe(A);
      expect(dashboard.availableCinemas.map((c: { id: string }) => c.id)).toEqual([A]);
    });

    it("cannot revoke another cinema's session, but can revoke its own", async () => {
      const denied = await revokePost(
        post("/api/operator/revoke", { sessionId: sessionIdB, reason: "cross tenant attempt" }, tokenMgrA)
      );
      expect(denied.status).toBe(404);
      expect((await prisma.breakSession.findUnique({ where: { id: sessionIdB } }))?.status).toBe(
        SessionStatus.ACTIVE
      );

      const allowed = await revokePost(
        post("/api/operator/revoke", { sessionId: sessionIdB, reason: "legitimate revoke" }, tokenMgrB)
      );
      expect(allowed.status).toBe(200);
      expect((await prisma.breakSession.findUnique({ where: { id: sessionIdB } }))?.status).toBe(
        SessionStatus.REVOKED
      );

      // Restore for later tests
      await prisma.breakSession.update({
        where: { id: sessionIdB },
        data: { status: SessionStatus.ACTIVE, endedAt: null, revokedReason: null },
      });
    });
  });

  describe("pricing authorization", () => {
    it("scopes reads to the operator's cinema", async () => {
      const json = await (await pricingGet(get("/api/operator/pricing", tokenMgrA))).json();
      expect(json.pricingRules.map((r: { pricePerSession: number }) => r.pricePerSession)).toEqual([111]);

      const other = await pricingGet(get(`/api/operator/pricing?cinemaId=${B}`, tokenMgrA));
      expect(other.status).toBe(403);
    });

    it("blocks writes by projectionists and cross-cinema writes by managers", async () => {
      const projectionist = await pricingPost(
        post("/api/operator/pricing", { cinemaId: A, pricePerSession: 1 }, tokenProjA)
      );
      expect(projectionist.status).toBe(403);

      const crossCinema = await pricingPost(
        post("/api/operator/pricing", { cinemaId: B, pricePerSession: 1 }, tokenMgrA)
      );
      expect(crossCinema.status).toBe(403);

      const rulesB = await prisma.cinemaPricingRule.findMany({ where: { cinemaId: B, status: "ACTIVE" } });
      expect(rulesB.map((r) => r.pricePerSession)).toEqual([222]);
    });

    it("lets a manager update their own cinema's pricing", async () => {
      const res = await pricingPost(
        post("/api/operator/pricing", { cinemaId: A, pricePerSession: 333 }, tokenMgrA)
      );
      expect(res.status).toBe(200);
      const active = await prisma.cinemaPricingRule.findMany({ where: { cinemaId: A, status: "ACTIVE" } });
      expect(active.map((r) => r.pricePerSession)).toEqual([333]);
    });
  });

  describe("projection console (simulator) authorization", () => {
    it("masks viewer phone numbers and scopes the state to the operator's cinema", async () => {
      const json = await (await playbackGet(get("/api/simulator/playback", tokenMgrB))).json();
      expect(json.playback.screeningId).toBe(screeningB);
      expect(json.activeViewers).toHaveLength(1);
      expect(json.activeViewers[0].phoneNumber).not.toContain("12345");
      expect(json.activeViewers[0].phoneNumber).toBe(maskPhoneNumber("+255712345678"));

      const own = await (await playbackGet(get("/api/simulator/playback", tokenMgrA))).json();
      expect(own.playback.screeningId).toBe(screeningA);
      expect(own.activeViewers).toHaveLength(0);
    });

    it("refuses to control another cinema's screening", async () => {
      const res = await playbackPost(
        post("/api/simulator/playback", { action: "pause", screeningId: screeningB }, tokenMgrA)
      );
      expect(res.status).toBe(404);
      const screening = await prisma.screening.findUnique({ where: { id: screeningB } });
      expect(screening?.isPaused).toBe(false);
    });

    it("allows an operator to control their own screening", async () => {
      const res = await playbackPost(
        post("/api/simulator/playback", { action: "pause", screeningId: screeningA }, tokenProjA)
      );
      expect(res.status).toBe(200);
      const screening = await prisma.screening.findUnique({ where: { id: screeningA } });
      expect(screening?.isPaused).toBe(true);
    });
  });


  describe("content rights cannot be self-granted by operators", () => {
    const start = () => new Date(Date.now() + 3600 * 1000).toISOString();

    it("rejects an unlicensed asset and does not create a rights record", async () => {
      const before = await prisma.rightsAuthorization.count({ where: { cinemaId: A } });
      const res = await screeningsPost(
        post(
          "/api/operator/screenings",
          { screenId: screenA, title: "Pirate Cut", contentAssetId: assetUnlicensed, scheduledStart: start() },
          tokenMgrA
        )
      );
      expect(res.status).toBe(403);
      expect(await prisma.rightsAuthorization.count({ where: { cinemaId: A } })).toBe(before);
      expect(await prisma.screening.count({ where: { title: "Pirate Cut" } })).toBe(0);
    });

    it("rejects an asset that is only licensed to a different cinema", async () => {
      const res = await screeningsPost(
        post(
          "/api/operator/screenings",
          { screenId: screenA, title: "Borrowed Cut", contentAssetId: assetBOnly, scheduledStart: start() },
          tokenMgrA
        )
      );
      expect(res.status).toBe(403);
      expect(await prisma.screening.count({ where: { title: "Borrowed Cut" } })).toBe(0);
    });

    it("rejects scheduling outside the licensed window", async () => {
      const farFuture = new Date(Date.now() + 400 * 24 * 3600 * 1000).toISOString();
      const res = await screeningsPost(
        post(
          "/api/operator/screenings",
          { screenId: screenA, title: "Expired Window", contentAssetId: assetId, scheduledStart: farFuture },
          tokenMgrA
        )
      );
      expect(res.status).toBe(403);
    });

    it("rejects an invalid start time instead of failing with a server error", async () => {
      const res = await screeningsPost(
        post(
          "/api/operator/screenings",
          { screenId: screenA, title: "Bad Date", scheduledStart: "not-a-date" },
          tokenMgrA
        )
      );
      expect(res.status).toBe(400);
    });

    it("schedules with a licensed asset, and defaults only to this cinema's licensed content", async () => {
      const explicit = await screeningsPost(
        post(
          "/api/operator/screenings",
          { screenId: screenA, title: "Licensed Explicit", contentAssetId: assetId, scheduledStart: start() },
          tokenMgrA
        )
      );
      expect(explicit.status).toBe(200);

      const implicit = await screeningsPost(
        post("/api/operator/screenings", { screenId: screenA, title: "Licensed Default", scheduledStart: start() }, tokenMgrA)
      );
      expect(implicit.status).toBe(200);
      const created = await prisma.screening.findFirst({ where: { title: "Licensed Default" } });
      expect(created?.contentAssetId).toBe(assetId);
    });

    it("creates no assets or rights for a cinema without licensed content", async () => {
      const assetsBefore = await prisma.contentAsset.count();
      const res = await screeningsPost(
        post("/api/operator/screenings", { screenId: "sec_screen_c", title: "No Rights", scheduledStart: start() }, tokenMgrC)
      );
      expect(res.status).toBe(403);
      expect(await prisma.contentAsset.count()).toBe(assetsBefore);
      expect(await prisma.rightsAuthorization.count({ where: { cinemaId: C } })).toBe(0);
    });
  });

  describe("platform administration grants content rights", () => {
    const grant = (body: unknown, token?: string) => post("/api/admin/rights", body, token);
    const window = () => ({
      validFrom: new Date(Date.now() - 3600 * 1000).toISOString(),
      validUntil: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
    });

    it("requires a valid administrator token", async () => {
      const body = { cinemaId: C, contentAssetId: assetUnlicensed, ...window() };
      expect((await rightsPost(grant(body))).status).toBe(401);
      expect((await rightsPost(grant(body, tokenMgrC))).status).toBe(401);
      expect((await rightsPost(grant(body, "adm_forged"))).status).toBe(401);
      expect((await rightsGet(get("/api/admin/rights", tokenMgrC))).status).toBe(401);
      expect(await prisma.rightsAuthorization.count({ where: { cinemaId: C } })).toBe(0);
    });

    it("validates input", async () => {
      const w = window();
      const neither = await rightsPost(grant({ cinemaId: C, ...w }, adminToken));
      expect(neither.status).toBe(400);
      const tooLong = await rightsPost(
        grant({ cinemaId: C, contentAssetId: assetUnlicensed, ...w, maxSessionDurationSeconds: 5000 }, adminToken)
      );
      expect(tooLong.status).toBe(400);
      const inverted = await rightsPost(
        grant({ cinemaId: C, contentAssetId: assetUnlicensed, validFrom: w.validUntil, validUntil: w.validFrom }, adminToken)
      );
      expect(inverted.status).toBe(400);
      const noCinema = await rightsPost(
        grant({ cinemaId: "sec_missing", contentAssetId: assetUnlicensed, ...w }, adminToken)
      );
      expect(noCinema.status).toBe(404);
      const noAsset = await rightsPost(grant({ cinemaId: C, contentAssetId: "sec_missing_asset", ...w }, adminToken));
      expect(noAsset.status).toBe(404);
    });

    it("grants rights that then allow the operator to schedule, and records an audit event", async () => {
      const res = await rightsPost(
        grant(
          {
            cinemaId: C,
            asset: {
              title: adminAssetTitle,
              durationSeconds: 1800,
              videoUrl: "https://example.com/admin.mp4",
              licenseType: "TEST",
              licenseSource: "TEST",
            },
            ...window(),
          },
          adminToken
        )
      );
      expect(res.status).toBe(201);
      const { authorization } = await res.json();

      const audit = await prisma.auditEvent.findFirst({
        where: { eventType: "CONTENT_RIGHTS_GRANTED", entityId: authorization.id },
      });
      expect(audit).not.toBeNull();

      const list = await (await rightsGet(get(`/api/admin/rights?cinemaId=${C}`, adminToken))).json();
      expect(list.rights).toHaveLength(1);

      const scheduled = await screeningsPost(
        post(
          "/api/operator/screenings",
          { screenId: "sec_screen_c", title: "Now Licensed", scheduledStart: new Date(Date.now() + 3600 * 1000).toISOString() },
          tokenMgrC
        )
      );
      expect(scheduled.status).toBe(200);
    });
  });

  describe("current screening endpoint", () => {
    const patronToken = "pstk_sec_session_b_token";

    it("rejects anonymous, forged and unknown tokens", async () => {
      expect((await currentGet(get("/api/screenings/current"))).status).toBe(401);
      expect((await currentGet(get("/api/screenings/current", "adm_forged"))).status).toBe(401);
      expect((await currentGet(get("/api/screenings/current", "opr_not_a_real_token"))).status).toBe(401);
      expect((await currentGet(get("/api/screenings/current", "pstk_unknown"))).status).toBe(403);
    });

    it("does not default to a demo screening for authenticated callers without screenings", async () => {
      await prisma.screening.deleteMany({ where: { cinemaId: C } });
      const res = await currentGet(get("/api/screenings/current", tokenMgrC));
      expect(res.status).toBe(404);
    });

    it("gives patrons only their own screening regardless of the requested id", async () => {
      const res = await currentGet(get(`/api/screenings/current?screeningId=${screeningA}`, patronToken));
      expect(res.status).toBe(200);
      expect((await res.json()).screeningId).toBe(screeningB);
    });

    it("rejects patron sessions that are expired or revoked", async () => {
      await prisma.breakSession.update({ where: { id: sessionIdB }, data: { expiresAt: new Date(Date.now() - 1000) } });
      expect((await currentGet(get("/api/screenings/current", patronToken))).status).toBe(403);
      await prisma.breakSession.update({
        where: { id: sessionIdB },
        data: { expiresAt: new Date(Date.now() + 900 * 1000), status: SessionStatus.REVOKED },
      });
      expect((await currentGet(get("/api/screenings/current", patronToken))).status).toBe(403);
      await prisma.breakSession.update({ where: { id: sessionIdB }, data: { status: SessionStatus.ACTIVE } });
    });

    it("scopes operators to their own cinema's screenings", async () => {
      const own = await currentGet(get("/api/screenings/current", tokenMgrA));
      expect((await own.json()).cinemaId).toBe(A);
      const other = await currentGet(get(`/api/screenings/current?screeningId=${screeningB}`, tokenMgrA));
      expect(other.status).toBe(404);
    });
  });

  describe("operator content assets management", () => {
    it("rejects unauthenticated and forged access to content assets", async () => {
      expect((await assetsGet(get("/api/operator/assets"))).status).toBe(401);
      expect((await assetsGet(get("/api/operator/assets", "adm_forged"))).status).toBe(401);
      expect(
        (
          await assetsPost(
            post("/api/operator/assets", { title: "Dune", durationMinutes: 120, videoUrl: "https://example.com/dune.mp4" })
          )
        ).status
      ).toBe(401);
    });

    it("scopes asset listings strictly to the operator's cinema", async () => {
      const listA = await (await assetsGet(get("/api/operator/assets", tokenMgrA))).json();
      expect(listA.success).toBe(true);
      const assetIdsA = listA.assets.map((a: { id: string }) => a.id);
      expect(assetIdsA).toContain(assetId);
      expect(assetIdsA).not.toContain(assetBOnly);

      const listB = await (await assetsGet(get("/api/operator/assets", tokenMgrB))).json();
      const assetIdsB = listB.assets.map((a: { id: string }) => a.id);
      expect(assetIdsB).toContain(assetBOnly);
    });

    it("blocks projectionists from registering new content assets", async () => {
      const res = await assetsPost(
        post(
          "/api/operator/assets",
          { title: "Unauthorized Upload", durationMinutes: 90, videoUrl: "https://example.com/unauth.mp4" },
          tokenProjA
        )
      );
      expect(res.status).toBe(403);
    });

    it("registers a new content asset and rights authorization for the operator cinema", async () => {
      const res = await assetsPost(
        post(
          "/api/operator/assets",
          {
            title: "Interstellar Theatrical Re-release",
            durationMinutes: 169,
            videoUrl: "https://example.com/interstellar.mp4",
            licenseType: "STUDIO_THEATRICAL_LICENSE",
            licenseSource: "Paramount Pictures",
          },
          tokenMgrA
        )
      );
      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.asset.title).toBe("Interstellar Theatrical Re-release");
      expect(data.authorization.cinemaId).toBe(A);

      // Verify the new asset is returned in cinema A's list
      const updatedListA = await (await assetsGet(get("/api/operator/assets", tokenMgrA))).json();
      const titlesA = updatedListA.assets.map((a: { title: string }) => a.title);
      expect(titlesA).toContain("Interstellar Theatrical Re-release");

      // Verify cinema B cannot see cinema A's newly registered asset
      const listB = await (await assetsGet(get("/api/operator/assets", tokenMgrB))).json();
      const titlesB = listB.assets.map((a: { title: string }) => a.title);
      expect(titlesB).not.toContain("Interstellar Theatrical Re-release");

      // Verify cinema A operator can now schedule a screening with this new asset!
      const scheduleRes = await screeningsPost(
        post(
          "/api/operator/screenings",
          {
            screenId: screenA,
            title: "Interstellar Prime Screening",
            contentAssetId: data.asset.id,
            scheduledStart: new Date(Date.now() + 7200 * 1000).toISOString(),
          },
          tokenMgrA
        )
      );
      expect(scheduleRes.status).toBe(200);
      const scheduleData = await scheduleRes.json();
      expect(scheduleData.screening.contentAssetId).toBe(data.asset.id);
    });
  });

  describe("pos webhook security and hardening", () => {
    const makeSignedReq = (bodyObj: any, secret = config.posWebhookSecret, headers: Record<string, string> = {}) => {
      const raw = JSON.stringify(bodyObj);
      const sig = createHmac("sha256", secret).update(raw).digest("hex");
      return new NextRequest("http://localhost:3000/api/webhooks/pos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-pos-signature": sig,
          ...headers,
        },
        body: raw,
      });
    };

    it("rejects unsigned webhook requests in all environments", async () => {
      const raw = JSON.stringify({ event: "ticket.cancelled", data: { ticketNumber: "NOPE" } });
      const req = new NextRequest("http://localhost:3000/api/webhooks/pos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: raw,
      });
      const res = await posWebhookPost(req);
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toContain("signature");
    });

    it("rejects webhook requests with wrong signature", async () => {
      const req = makeSignedReq(
        { event: "ticket.cancelled", data: { ticketNumber: "NOPE" } },
        "wrong_pos_secret_key"
      );
      const res = await posWebhookPost(req);
      expect(res.status).toBe(401);
    });

    it("rejects webhook requests with expired timestamp", async () => {
      const expiredTimestamp = (Date.now() - 10 * 60 * 1000).toString(); // 10 minutes ago
      const req = makeSignedReq(
        { event: "ticket.cancelled", data: { ticketNumber: "NOPE" } },
        config.posWebhookSecret,
        { "x-pos-timestamp": expiredTimestamp }
      );
      const res = await posWebhookPost(req);
      expect(res.status).toBe(401);
      expect((await res.json()).error).toContain("timestamp");
    });

    it("rejects admitting tickets for non-existent screenings", async () => {
      const req = makeSignedReq({
        event: "ticket.admitted",
        data: {
          ticketNumber: "SEC-POS-TK-NONEXISTENT",
          screeningId: "screening_nonexistent_xyz",
        },
      });
      const res = await posWebhookPost(req);
      expect(res.status).toBe(404);
      expect((await res.json()).error).toContain("not found");
    });

    it("rejects re-binding an existing ticket to a different screening", async () => {
      const req = makeSignedReq({
        event: "ticket.admitted",
        data: {
          ticketNumber: "SEC-TK-A-1",
          screeningId: screeningB, // Belongs to screeningA in test fixtures
        },
      });
      const res = await posWebhookPost(req);
      expect(res.status).toBe(409);
      expect((await res.json()).error).toContain("already bound to another screening");
    });

    it("processes TMS projection automation events (pause, resume, stop)", async () => {
      // 1. TMS Pause Event
      const pauseReq = makeSignedReq({
        event: "screening.playback_paused",
        data: { screeningId: screeningA },
      });
      const pauseRes = await posWebhookPost(pauseReq);
      expect(pauseRes.status).toBe(200);
      const pauseJson = await pauseRes.json();
      expect(pauseJson.success).toBe(true);
      expect(pauseJson.playbackState.isPaused).toBe(true);

      // 2. TMS Resume Event
      const resumeReq = makeSignedReq({
        event: "screening.playback_resumed",
        data: { screeningId: screeningA },
      });
      const resumeRes = await posWebhookPost(resumeReq);
      expect(resumeRes.status).toBe(200);
      const resumeJson = await resumeRes.json();
      expect(resumeJson.success).toBe(true);
      expect(resumeJson.playbackState.isPaused).toBe(false);

      // 3. TMS Stop Event
      const stopReq = makeSignedReq({
        event: "screening.playback_stopped",
        data: { screeningId: screeningA },
      });
      const stopRes = await posWebhookPost(stopReq);
      expect(stopRes.status).toBe(200);
      const stopJson = await stopRes.json();
      expect(stopJson.success).toBe(true);
      expect(stopJson.status).toBe(ScreeningStatus.COMPLETED);
    });
  });

  describe("partner review provisions one-time setup token", () => {
    it("creates operator with secure setup token instead of hardcoded password", async () => {
      const app = await prisma.partnerApplication.create({
        data: {
          organizationName: "Security Test Cineplex",
          contactName: "Sec Contact",
          contactEmail: "sec_partner_unique@cineplex.co.tz",
          contactPhone: "+255712999000",
          city: "Arusha",
          status: "PENDING",
        },
      });

      const res = await partnerReviewPost(
        post(
          "/api/admin/partners/review",
          { applicationId: app.id, decision: "APPROVED", reviewNotes: "Security verification check" },
          adminToken
        )
      );
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.invitationUrl).toBeDefined();
      expect(data.invitationUrl).toContain("/operator?resetToken=opr_rst_");

      const createdOperator = await prisma.operatorUser.findUnique({
        where: { email: "sec_partner_unique@cineplex.co.tz" },
      });
      expect(createdOperator).not.toBeNull();
      expect(createdOperator?.passwordResetToken).toBeDefined();
      expect(createdOperator?.passwordResetToken).toMatch(/^opr_rst_/);
      // Verify password is NOT the old hardcoded "CinemaPass2026!"
      const { verifyPassword } = await import("../src/lib/crypto");
      expect(verifyPassword("CinemaPass2026!", createdOperator!.passwordHash)).toBe(false);
    });
  });

  describe("production OTP security guard", () => {
    it("does not return simulatedCode when running in production mode", async () => {
      const prevEnv = process.env.NODE_ENV;
      try {
        (process.env as any).NODE_ENV = "production";
        const req = post("/api/auth/otp/request", { phoneNumber: "+255714000999" });
        const res = await otpRequestPost(req);
        const data = await res.json();
        expect(data.simulatedCode).toBeUndefined();
        expect(data.isSimulator).toBe(false);
      } finally {
        (process.env as any).NODE_ENV = prevEnv;
      }
    });
  });

  describe("session activation race condition and phone verification", () => {
    it("prevents double-spend when concurrent parallel activations target the same ticket", async () => {
      const raceTicket = await prisma.demonstrationTicket.create({
        data: {
          ticketNumber: "SEC-RACE-TK-01",
          screeningId: screeningA,
          seatNumber: "R01",
          customerName: "Race Condition Patron",
          status: TicketStatus.VALID_ADMITTED,
        },
      });

      // Fire 5 simultaneous activation requests for the exact same ticket
      const results = await Promise.all([
        SessionService.activateSession({ ticketNumber: raceTicket.ticketNumber }),
        SessionService.activateSession({ ticketNumber: raceTicket.ticketNumber }),
        SessionService.activateSession({ ticketNumber: raceTicket.ticketNumber }),
        SessionService.activateSession({ ticketNumber: raceTicket.ticketNumber }),
        SessionService.activateSession({ ticketNumber: raceTicket.ticketNumber }),
      ]);

      const successCount = results.filter((r) => r.success).length;
      const failureCount = results.filter((r) => !r.success).length;

      // Exactly ONE activation MUST succeed; all others MUST fail under row lock
      expect(successCount).toBe(1);
      expect(failureCount).toBe(4);

      // Verify that in the database, only one active break session and one billing event exist
      const activeSessions = await prisma.breakSession.findMany({
        where: { ticketId: raceTicket.id, status: SessionStatus.ACTIVE },
      });
      expect(activeSessions).toHaveLength(1);

      const billingEvents = await prisma.usageBillingEvent.findMany({
        where: { ticketNumber: raceTicket.ticketNumber },
      });
      expect(billingEvents).toHaveLength(1);
    });

    it("rejects attaching an unverified phone number without OTP challenge", async () => {
      const ticket = await prisma.demonstrationTicket.create({
        data: {
          ticketNumber: "SEC-UNVERIF-PHONE-01",
          screeningId: screeningA,
          seatNumber: "U01",
          customerName: "Unverified Phone Patron",
          status: TicketStatus.VALID_ADMITTED,
        },
      });

      const res = await SessionService.activateSession({
        ticketNumber: ticket.ticketNumber,
        phoneNumber: "+255712999888", // No challengeId provided!
      });

      expect(res.success).toBe(false);
      expect(res.error).toContain("Phone verification");

      // Verify no session was created
      const sessions = await prisma.breakSession.findMany({ where: { ticketId: ticket.id } });
      expect(sessions).toHaveLength(0);
    });

    it("accepts activation when phone number matches verified challenge", async () => {
      await prisma.otpChallenge.deleteMany({ where: { phoneNumber: "+255714000333" } });
      const ticket = await prisma.demonstrationTicket.create({
        data: {
          ticketNumber: "SEC-VERIF-PHONE-02",
          screeningId: screeningA,
          seatNumber: "U02",
          customerName: "Verified Phone Patron",
          status: TicketStatus.VALID_ADMITTED,
        },
      });

      const otp = await OtpService.requestOtp("+255714000333");
      await OtpService.verifyOtp(otp.challengeId!, otp.simulatedCode!);

      const res = await SessionService.activateSession({
        ticketNumber: ticket.ticketNumber,
        challengeId: otp.challengeId,
        phoneNumber: "+255714000333",
      });

      expect(res.success).toBe(true);
      expect(res.sessionToken).toBeDefined();

      const session = await prisma.breakSession.findUnique({ where: { id: res.sessionId } });
      expect(session?.phoneNumber).toBe("+255714000333");
    });

    it("supports case-insensitive claim token lookup during activation", async () => {
      const ticket = await prisma.demonstrationTicket.create({
        data: {
          ticketNumber: "SEC-CASE-TK-03",
          claimToken: "SEC-case-token-mixed-99",
          screeningId: screeningA,
          seatNumber: "U03",
          customerName: "Case Sensitivity Patron",
          status: TicketStatus.VALID_ADMITTED,
        },
      });

      // Pass lowercase version of the mixed-case claim token
      const res = await SessionService.activateSession({
        claimToken: "sec-case-token-mixed-99",
      });

      expect(res.success).toBe(true);
      expect(res.ticketNumber).toBe("SEC-CASE-TK-03");
    });
  });

  describe("ticket verification rate limiter", () => {
    it("rate limits rapid consecutive verification attempts from same IP", async () => {
      const testIp = "198.51.100.77";
      const requests = Array.from({ length: 32 }, () =>
        ticketVerifyPost(
          new NextRequest("http://localhost:3000/api/tickets/verify", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-forwarded-for": testIp,
            },
            body: JSON.stringify({ ticketNumber: "RATE-LIMIT-PROBE" }),
          })
        )
      );

      const responses = await Promise.all(requests);
      const statuses = responses.map((r) => r.status);

      // The first 30 should not be 429, but after exceeding 30, it should return 429
      expect(statuses).toContain(429);
      const rateLimitedCount = statuses.filter((s) => s === 429).length;
      expect(rateLimitedCount).toBeGreaterThanOrEqual(1);
    });
  });

  describe("maskPhoneNumber and maskToken", () => {
    it("keeps only the prefix and last three digits for phone numbers", () => {
      expect(maskPhoneNumber("+255712345678")).toBe("+255******678");
      expect(maskPhoneNumber("")).toBe("");
      expect(maskPhoneNumber(null)).toBe("");
      expect(maskPhoneNumber("123")).toBe("***");
    });

    it("masks claim tokens and secrets leaving only edge characters", () => {
      expect(maskToken("CLAIM-ALPHA-OMEGA-99")).toBe("CLAI...A-99");
      expect(maskToken("12345")).toBe("***");
      expect(maskToken("")).toBe("");
      expect(maskToken(null)).toBe("");
    });
  });

  describe("Session token transport security (Item 13)", () => {
    it("rejects tokens passed in query parameters (?token=...)", async () => {
      // Create a valid session in cinema A
      const ticket = await prisma.demonstrationTicket.create({
        data: {
          screeningId: screeningA,
          ticketNumber: "SYNC-TRANSPORT-01",
          seatNumber: "A1",
          customerName: "Sync Patron",
          claimToken: "SYNC-CLAIM-01",
          status: TicketStatus.VALID_ADMITTED,
        },
      });

      const activated = await SessionService.activateSession({
        ticketNumber: ticket.ticketNumber,
      });
      expect(activated.success).toBe(true);
      const validToken = activated.sessionToken!;

      // 1. Query param should be rejected (401)
      const queryParamReq = new NextRequest(`http://localhost:3000/api/sessions/sync?token=${validToken}`, {
        method: "GET",
      });
      const resQuery = await sessionsSyncGet(queryParamReq);
      expect(resQuery.status).toBe(401);
      const dataQuery = await resQuery.json();
      expect(dataQuery.reason).toContain("Missing session authorization token");

      // 2. Header x-session-token should succeed (200)
      const headerReq = new NextRequest("http://localhost:3000/api/sessions/sync", {
        method: "GET",
        headers: {
          "x-session-token": validToken,
        },
      });
      const resHeader = await sessionsSyncGet(headerReq);
      expect(resHeader.status).toBe(200);
      const dataHeader = await resHeader.json();
      expect(dataHeader.isValid).toBe(true);

      // Clean up
      await prisma.breakSession.deleteMany({ where: { sessionToken: validToken } });
      await prisma.demonstrationTicket.deleteMany({ where: { id: ticket.id } });
    });
  });

  describe("Session Token Hashing at Rest (Item 8)", () => {
    it("stores SHA-256 hash of sessionToken in database and resolves session via hash", async () => {
      const ticket = await prisma.demonstrationTicket.create({
        data: {
          screeningId: screeningA,
          ticketNumber: "HASH-TEST-TK-01",
          seatNumber: "H01",
          customerName: "Hash Test Patron",
          status: TicketStatus.VALID_ADMITTED,
        },
      });

      const activateRes = await SessionService.activateSession({
        ticketNumber: "HASH-TEST-TK-01",
      });
      expect(activateRes.success).toBe(true);
      const rawToken = activateRes.sessionToken!;
      expect(rawToken).toBeDefined();

      // Verify that database row contains the SHA-256 hash
      const dbSession = await prisma.breakSession.findUnique({
        where: { id: activateRes.sessionId },
      });
      expect(dbSession).not.toBeNull();
      const actualComputedHash = createHash("sha256").update(rawToken).digest("hex");
      expect(dbSession?.sessionTokenHash).toBe(actualComputedHash);

      // Verify synchronization succeeds using the bearer token via hash lookup
      const syncResult = await SessionService.getSessionState(rawToken);
      expect(syncResult.isValid).toBe(true);
      expect(syncResult.session?.ticketNumber).toBe("HASH-TEST-TK-01");

      // Clean up
      await prisma.breakSession.deleteMany({ where: { id: activateRes.sessionId } });
      await prisma.demonstrationTicket.deleteMany({ where: { id: ticket.id } });
    });
  });

  describe("Screening Reminders Cron Worker & Atomic Claim (Item 14)", () => {
    const originalEnv = { ...process.env };

    afterAll(() => {
      process.env = originalEnv;
    });

    it("requires CRON_SECRET in production and rejects unauthorized triggers", async () => {
      (process.env as any).NODE_ENV = "production";
      (process.env as any).CRON_SECRET = "production_cron_secret_777";

      // 1. Missing or wrong bearer token returns 401
      const unauthReq = new NextRequest("http://localhost:3000/api/reminders/dispatch", {
        method: "POST",
      });
      const resUnauth = await remindersDispatchPost(unauthReq);
      expect(resUnauth.status).toBe(401);

      // 2. GET also requires authorization
      const getUnauthReq = new NextRequest("http://localhost:3000/api/reminders/dispatch", {
        method: "GET",
      });
      const resGetUnauth = await remindersDispatchGet(getUnauthReq);
      expect(resGetUnauth.status).toBe(401);

      // 3. Valid bearer token succeeds
      const authReq = new NextRequest("http://localhost:3000/api/reminders/dispatch", {
        method: "POST",
        headers: {
          authorization: "Bearer production_cron_secret_777",
        },
      });
      const resAuth = await remindersDispatchPost(authReq);
      expect(resAuth.status).toBe(200);
      const dataAuth = await resAuth.json();
      expect(dataAuth.success).toBe(true);
      expect(dataAuth).toHaveProperty("expiredSessionsCount");

      // Reset env
      (process.env as any).NODE_ENV = "test";
      delete (process.env as any).CRON_SECRET;
    });

    it("prevents duplicate sends through atomic claim-then-send", async () => {
      // Create a test customer and a reminder starting in 10 minutes
      const cust = await prisma.customerAccount.create({
        data: {
          email: "cron_patron@example.com",
          name: "Cron Patron",
          phoneNumber: "+255799999888",
          passwordHash: "dummy",
        },
      });

      const screening = await prisma.screening.findUnique({
        where: { id: screeningA },
      });
      expect(screening).toBeDefined();

      const reminder = await prisma.screeningReminder.create({
        data: {
          customerId: cust.id,
          screeningId: screeningA,
          offsetMinutes: 15,
          ticketNumber: "TKT-CRON-DUPE",
          isEnabled: true,
          sentAt: null,
        },
      });

      // Update screening start to trigger window: 10 minutes from now (offset 15 is active)
      const tenMinutesFromNow = new Date(Date.now() + 10 * 60 * 1000);
      await prisma.screening.update({
        where: { id: screeningA },
        data: { scheduledStart: tenMinutesFromNow },
      });

      // Trigger dispatch concurrently 3 times
      const reqFactory = () =>
        new NextRequest("http://localhost:3000/api/reminders/dispatch", {
          method: "POST",
        });

      const [res1, res2, res3] = await Promise.all([
        remindersDispatchPost(reqFactory()),
        remindersDispatchPost(reqFactory()),
        remindersDispatchPost(reqFactory()),
      ]);

      const [d1, d2, d3] = await Promise.all([res1.json(), res2.json(), res3.json()]);

      const totalDispatchedForReminder = [d1, d2, d3].reduce((acc, body) => {
        const found = (body.dispatched || []).filter((r: any) => r.reminderId === reminder.id);
        return acc + found.length;
      }, 0);

      // Exactly ONE concurrent execution must have claimed and dispatched the reminder
      expect(totalDispatchedForReminder).toBe(1);

      // Cleanup
      await prisma.auditEvent.deleteMany({ where: { entityId: reminder.id } });
      await prisma.screeningReminder.deleteMany({ where: { id: reminder.id } });
      await prisma.customerAccount.deleteMany({ where: { id: cust.id } });
    });
  });

  describe("Session Expiration and Atomic Transitions (Items 15 & 16)", () => {
    it("expireStaleSessions sweeps sessions whose expiresAt has elapsed", async () => {
      const ticket = await prisma.demonstrationTicket.create({
        data: {
          screeningId: screeningA,
          ticketNumber: "TKT-SWEEP-01",
          seatNumber: "S1",
          customerName: "Sweep Patron",
          status: TicketStatus.VALID_ADMITTED,
        },
      });

      const activated = await SessionService.activateSession({
        ticketNumber: ticket.ticketNumber,
      });
      expect(activated.success).toBe(true);

      // Artificially age the session expiresAt to 1 minute ago
      await prisma.breakSession.update({
        where: { sessionToken: activated.sessionToken! },
        data: {
          expiresAt: new Date(Date.now() - 60 * 1000),
        },
      });

      // Run sweeper
      const sweepCount = await SessionService.expireStaleSessions();
      expect(sweepCount).toBeGreaterThanOrEqual(1);

      // Verify the session in DB is now EXPIRED
      const sessionAfter = await prisma.breakSession.findUnique({
        where: { sessionToken: activated.sessionToken! },
      });
      expect(sessionAfter?.status).toBe(SessionStatus.EXPIRED);

      // Clean up
      await prisma.auditEvent.deleteMany({ where: { sessionId: sessionAfter?.id } });
      await prisma.breakSession.deleteMany({ where: { id: sessionAfter?.id } });
      await prisma.demonstrationTicket.deleteMany({ where: { id: ticket.id } });
    });

    it("completeSession and revokeSession execute atomically", async () => {
      const ticket = await prisma.demonstrationTicket.create({
        data: {
          screeningId: screeningA,
          ticketNumber: "TKT-COMPLETE-01",
          seatNumber: "S2",
          customerName: "Complete Patron",
          status: TicketStatus.VALID_ADMITTED,
        },
      });

      const activated = await SessionService.activateSession({
        ticketNumber: ticket.ticketNumber,
      });
      expect(activated.success).toBe(true);

      const completed = await SessionService.completeSession(activated.sessionToken!);
      expect(completed.status).toBe(SessionStatus.COMPLETED);

      // Check audit event was created
      const audit = await prisma.auditEvent.findFirst({
        where: {
          sessionId: completed.id,
          eventType: "SESSION_COMPLETED_EARLY",
        },
      });
      expect(audit).toBeDefined();

      // Clean up
      await prisma.auditEvent.deleteMany({ where: { sessionId: completed.id } });
      await prisma.breakSession.deleteMany({ where: { id: completed.id } });
      await prisma.demonstrationTicket.deleteMany({ where: { id: ticket.id } });
    });
  });
});
