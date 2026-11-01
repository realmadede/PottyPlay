import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { NextRequest } from "next/server";
import { prisma } from "../src/lib/db";
import {
  ipv4ToUint32,
  isIpInCidr,
  isRfc1918PrivateIp,
  isClientOnCinemaLan,
  resolvePlaybackStreamUrls,
} from "../src/lib/edge-streaming";
import { GET as edgeGet, POST as edgePost } from "../src/app/api/operator/edge/route";
import { SessionService } from "../src/features/sessions/session-service";
import { ScreeningService } from "../src/features/screenings/screening-service";
import { CinemaStatus, OperatorRole, ScreeningStatus, TicketStatus } from "@prisma/client";

describe("In-Auditorium Network & Local Edge Streaming", () => {
  const cinemaId = "edge_test_cinema";
  const foreignCinemaId = "edge_foreign_cinema";
  const assetId = "edge_test_asset";
  const screenId = "edge_test_screen";
  const screeningId = "edge_test_screening";
  const ticketNumber = "EDGE-TKT-101";
  const claimToken = "EDGE-CLAIM-101";

  const operatorToken = "opr_edge_manager_token";
  const foreignOperatorToken = "opr_foreign_manager_token";

  beforeAll(async () => {
    // Clean up any stale data from previous test runs
    await prisma.breakSession.deleteMany({
      where: { ticket: { ticketNumber: { in: [ticketNumber] } } },
    });
    await prisma.demonstrationTicket.deleteMany({
      where: { ticketNumber: { in: [ticketNumber] } },
    });
    await prisma.rightsAuthorization.deleteMany({
      where: { contentAssetId: { in: [assetId] } },
    });
    await prisma.screening.deleteMany({
      where: { id: { in: [screeningId] } },
    });
    await prisma.screen.deleteMany({
      where: { id: { in: [screenId] } },
    });
    await prisma.contentAsset.deleteMany({
      where: { id: { in: [assetId] } },
    });
    await prisma.operatorUser.deleteMany({
      where: { email: { in: ["edge_op@test.com", "foreign_op@test.com"] } },
    });
    await prisma.cinema.deleteMany({
      where: { id: { in: [cinemaId, foreignCinemaId] } },
    });

    // Create target cinema with edge streaming configured
    await prisma.cinema.create({
      data: {
        id: cinemaId,
        name: "Grand Auditorium IMAX",
        location: "Basement Level 2",
        status: CinemaStatus.APPROVED,
        edgeStreamingEnabled: true,
        edgeServerUrl: "http://192.168.1.100:8080/live",
        venueWifiSsid: "pottyplay-cinema-guest",
        lanIpSubnets: "192.168.1.0/24,10.200.0.0/16",
      },
    });

    // Create foreign cinema for tenant isolation tests
    await prisma.cinema.create({
      data: {
        id: foreignCinemaId,
        name: "Foreign Cinema",
        location: "Sector B",
        status: CinemaStatus.APPROVED,
        edgeStreamingEnabled: false,
      },
    });

    // Create operator users and sessions
    const expires = new Date(Date.now() + 86400000);
    await prisma.operatorUser.create({
      data: {
        cinemaId,
        email: "edge_op@test.com",
        name: "Edge Operator",
        role: OperatorRole.MANAGER,
        passwordHash: "hash_placeholder",
        sessionToken: operatorToken,
        tokenExpiresAt: expires,
      },
    });

    await prisma.operatorUser.create({
      data: {
        cinemaId: foreignCinemaId,
        email: "foreign_op@test.com",
        name: "Foreign Operator",
        role: OperatorRole.MANAGER,
        passwordHash: "hash_placeholder",
        sessionToken: foreignOperatorToken,
        tokenExpiresAt: expires,
      },
    });

    // Create content asset with both cloud URL and edge relative path
    await prisma.contentAsset.create({
      data: {
        id: assetId,
        title: "Dune 4K Companion Cut",
        durationSeconds: 7200,
        videoUrl: "https://cloud.pottyplay.com/assets/dune_feature.mp4",
        edgeRelativePath: "hls/dune/master.m3u8",
        licenseType: "THEATRICAL_COMPANION",
        licenseSource: "Warner Bros Demo License",
      },
    });

    // Authorize rights for target cinema
    await prisma.rightsAuthorization.create({
      data: {
        cinemaId,
        contentAssetId: assetId,
        isAuthorized: true,
        validFrom: new Date(Date.now() - 24 * 3600 * 1000),
        validUntil: new Date(Date.now() + 365 * 24 * 3600 * 1000),
      },
    });

    // Create auditorium screen and screening
    await prisma.screen.create({
      data: {
        id: screenId,
        cinemaId,
        name: "Main Basement Hall",
        totalSeats: 300,
      },
    });

    await prisma.screening.create({
      data: {
        id: screeningId,
        cinemaId,
        screenId,
        contentAssetId: assetId,
        title: "Dune 4K Companion Cut (Basement Hall)",
        status: ScreeningStatus.PLAYING,
        playbackPositionSeconds: 1500,
        scheduledStart: new Date(Date.now() - 1500000),
      },
    });

    // Create demonstration ticket
    await prisma.demonstrationTicket.create({
      data: {
        ticketNumber,
        claimToken,
        screeningId,
        seatNumber: "B12",
        customerName: "Auditorium Patron",
        status: TicketStatus.VALID_ADMITTED,
        breakCount: 0,
        maxBreaks: 2,
      },
    });
  });

  afterAll(async () => {
    await prisma.breakSession.deleteMany({
      where: { ticket: { ticketNumber: { in: [ticketNumber] } } },
    });
    await prisma.demonstrationTicket.deleteMany({
      where: { ticketNumber: { in: [ticketNumber] } },
    });
    await prisma.rightsAuthorization.deleteMany({
      where: { contentAssetId: { in: [assetId] } },
    });
    await prisma.screening.deleteMany({
      where: { id: { in: [screeningId] } },
    });
    await prisma.screen.deleteMany({
      where: { id: { in: [screenId] } },
    });
    await prisma.contentAsset.deleteMany({
      where: { id: { in: [assetId] } },
    });
    await prisma.operatorUser.deleteMany({
      where: { email: { in: ["edge_op@test.com", "foreign_op@test.com"] } },
    });
    await prisma.cinema.deleteMany({
      where: { id: { in: [cinemaId, foreignCinemaId] } },
    });
  });

  describe("Subnet & CIDR calculations", () => {
    it("converts IPv4 strings into 32-bit unsigned integers", () => {
      expect(ipv4ToUint32("192.168.1.1")).toBe(3232235777);
      expect(ipv4ToUint32("10.0.0.1")).toBe(167772161);
      expect(ipv4ToUint32("invalid.ip")).toBeNull();
      expect(ipv4ToUint32("256.0.0.1")).toBeNull();
    });

    it("evaluates CIDR subnet membership correctly", () => {
      expect(isIpInCidr("192.168.1.50", "192.168.1.0/24")).toBe(true);
      expect(isIpInCidr("192.168.2.50", "192.168.1.0/24")).toBe(false);
      expect(isIpInCidr("10.200.4.12", "10.200.0.0/16")).toBe(true);
      expect(isIpInCidr("10.201.4.12", "10.200.0.0/16")).toBe(false);
    });

    it("identifies RFC 1918 private network addresses", () => {
      expect(isRfc1918PrivateIp("192.168.1.25")).toBe(true);
      expect(isRfc1918PrivateIp("10.5.0.1")).toBe(true);
      expect(isRfc1918PrivateIp("172.16.5.9")).toBe(true);
      expect(isRfc1918PrivateIp("127.0.0.1")).toBe(true);
      expect(isRfc1918PrivateIp("8.8.8.8")).toBe(false);
      expect(isRfc1918PrivateIp("198.51.100.1")).toBe(false);
    });

    it("correctly identifies whether a client IP is on the cinema LAN", () => {
      // Configured subnet
      expect(isClientOnCinemaLan("192.168.1.88", "192.168.1.0/24,10.0.0.0/8")).toBe(true);
      // Outside configured subnet
      expect(isClientOnCinemaLan("198.51.100.5", "192.168.1.0/24")).toBe(false);
    });
  });

  describe("Playback stream resolution logic", () => {
    it("resolves to LAN_EDGE when edge is enabled and client is on theater Wi-Fi LAN", () => {
      const result = resolvePlaybackStreamUrls({
        contentAsset: {
          videoUrl: "https://cloud.pottyplay.com/assets/dune.mp4",
          edgeRelativePath: "hls/dune/master.m3u8",
        },
        cinema: {
          edgeStreamingEnabled: true,
          edgeServerUrl: "http://192.168.1.100:8080/live",
          venueWifiSsid: "pottyplay-cinema-guest",
          lanIpSubnets: "192.168.1.0/24",
        },
        clientIp: "192.168.1.55",
      });

      expect(result.primaryVideoUrl).toBe("https://cloud.pottyplay.com/assets/dune.mp4");
      expect(result.edgeVideoUrl).toBe("http://192.168.1.100:8080/live/hls/dune/master.m3u8");
      expect(result.venueWifiSsid).toBe("pottyplay-cinema-guest");
      expect(result.isLanClient).toBe(true);
      expect(result.preferredRoute).toBe("LAN_EDGE");
    });

    it("resolves to WAN_CDN when client is on external public cellular network", () => {
      const result = resolvePlaybackStreamUrls({
        contentAsset: {
          videoUrl: "https://cloud.pottyplay.com/assets/dune.mp4",
          edgeRelativePath: "hls/dune/master.m3u8",
        },
        cinema: {
          edgeStreamingEnabled: true,
          edgeServerUrl: "http://192.168.1.100:8080/live",
          venueWifiSsid: "pottyplay-cinema-guest",
          lanIpSubnets: "192.168.1.0/24",
        },
        clientIp: "197.250.45.12", // Public cellular IP
      });

      expect(result.primaryVideoUrl).toBe("https://cloud.pottyplay.com/assets/dune.mp4");
      expect(result.edgeVideoUrl).toBe("http://192.168.1.100:8080/live/hls/dune/master.m3u8");
      expect(result.isLanClient).toBe(false);
      expect(result.preferredRoute).toBe("WAN_CDN");
    });

    it("resolves to WAN_CDN with null edgeVideoUrl when edge streaming is disabled", () => {
      const result = resolvePlaybackStreamUrls({
        contentAsset: {
          videoUrl: "https://cloud.pottyplay.com/assets/dune.mp4",
        },
        cinema: {
          edgeStreamingEnabled: false,
          edgeServerUrl: "http://192.168.1.100:8080/live",
        },
        clientIp: "192.168.1.55",
      });

      expect(result.primaryVideoUrl).toBe("https://cloud.pottyplay.com/assets/dune.mp4");
      expect(result.edgeVideoUrl).toBeNull();
      expect(result.preferredRoute).toBe("WAN_CDN");
    });
  });

  describe("Operator Edge Configuration API (/api/operator/edge)", () => {
    it("requires operator authentication", async () => {
      const req = new NextRequest("http://localhost/api/operator/edge");
      const res = await edgeGet(req);
      expect(res.status).toBe(401);
    });

    it("returns cinema edge configuration for authenticated operator", async () => {
      const req = new NextRequest("http://localhost/api/operator/edge", {
        headers: { Authorization: `Bearer ${operatorToken}` },
      });
      const res = await edgeGet(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.cinema.edgeStreamingEnabled).toBe(true);
      expect(json.cinema.edgeServerUrl).toBe("http://192.168.1.100:8080/live");
      expect(json.cinema.venueWifiSsid).toBe("pottyplay-cinema-guest");
    });

    it("updates cinema edge configuration and records audit event", async () => {
      const req = new NextRequest("http://localhost/api/operator/edge", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${operatorToken}`,
        },
        body: JSON.stringify({
          edgeStreamingEnabled: true,
          edgeServerUrl: "http://192.168.1.222:8080/stream",
          venueWifiSsid: "Updated-Cinema-Guest-WiFi",
          lanIpSubnets: "192.168.1.0/24",
        }),
      });

      const res = await edgePost(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.cinema.edgeServerUrl).toBe("http://192.168.1.222:8080/stream");
      expect(json.cinema.venueWifiSsid).toBe("Updated-Cinema-Guest-WiFi");

      // Verify audit event in database
      const audit = await prisma.auditEvent.findFirst({
        where: {
          cinemaId,
          eventType: "CINEMA_EDGE_CONFIG_UPDATED",
        },
        orderBy: { createdAt: "desc" },
      });
      expect(audit).not.toBeNull();
      expect(audit?.actor).toBe("OPERATOR");
    });

    it("prevents operators from configuring a different cinema (tenant isolation)", async () => {
      const req = new NextRequest("http://localhost/api/operator/edge", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${foreignOperatorToken}`,
        },
        body: JSON.stringify({
          cinemaId, // Foreign operator attempts to target primary cinemaId
          edgeStreamingEnabled: true,
          edgeServerUrl: "http://malicious.edge.local:8080",
          venueWifiSsid: "Attacker-WiFi",
        }),
      });

      const res = await edgePost(req);
      expect(res.status).toBe(200);
      // The update must have scoped strictly to foreignOperator's own cinema, leaving primary cinema intact
      const primaryCinema = await prisma.cinema.findUnique({
        where: { id: cinemaId },
      });
      expect(primaryCinema?.edgeServerUrl).toBe("http://192.168.1.222:8080/stream");
      expect(primaryCinema?.venueWifiSsid).toBe("Updated-Cinema-Guest-WiFi");
    });
  });

  describe("End-to-End Session Activation with Edge Resolution", () => {
    it("activates break session and returns dual streaming routes with Wi-Fi guidance", async () => {
      const result = await SessionService.activateSession({
        ticketNumber,
        clientIp: "192.168.1.42", // On-prem cinema LAN IP
      });

      expect(result.success).toBe(true);
      expect(result.sessionToken).toBeDefined();
      expect(result.videoUrl).toBe("https://cloud.pottyplay.com/assets/dune_feature.mp4");
      expect(result.primaryVideoUrl).toBe("https://cloud.pottyplay.com/assets/dune_feature.mp4");
      expect(result.edgeVideoUrl).toBe("http://192.168.1.222:8080/stream/hls/dune/master.m3u8");
      expect(result.venueWifiSsid).toBe("Updated-Cinema-Guest-WiFi");
      expect(result.preferredRoute).toBe("LAN_EDGE");
      expect(result.isLanClient).toBe(true);

      // Verify sync state returns the same edge parameters
      const syncResult = await SessionService.getSessionState(result.sessionToken!, "192.168.1.42");
      expect(syncResult.isValid).toBe(true);
      expect(syncResult.screening?.edgeVideoUrl).toBe("http://192.168.1.222:8080/stream/hls/dune/master.m3u8");
      expect(syncResult.screening?.venueWifiSsid).toBe("Updated-Cinema-Guest-WiFi");
      expect(syncResult.screening?.preferredRoute).toBe("LAN_EDGE");
    });

    it("returns WAN_CDN preferred route when patron syncs over public cellular network", async () => {
      const activeSession = await prisma.breakSession.findFirst({
        where: { ticket: { ticketNumber } },
        orderBy: { startedAt: "desc" },
      });
      expect(activeSession).not.toBeNull();

      const syncResult = await SessionService.getSessionState(
        activeSession!.sessionToken,
        "197.250.88.99" // Public cellular IP
      );
      expect(syncResult.isValid).toBe(true);
      expect(syncResult.screening?.preferredRoute).toBe("WAN_CDN");
      expect(syncResult.screening?.isLanClient).toBe(false);
      expect(syncResult.screening?.edgeVideoUrl).toBe("http://192.168.1.222:8080/stream/hls/dune/master.m3u8");
      expect(syncResult.screening?.venueWifiSsid).toBe("Updated-Cinema-Guest-WiFi");
    });

    it("provides edge streaming details in authoritative screening playback state", async () => {
      const state = await ScreeningService.getAuthoritativePlaybackState(
        screeningId,
        "192.168.1.42"
      );
      expect(state).not.toBeNull();
      expect(state?.primaryVideoUrl).toBe("https://cloud.pottyplay.com/assets/dune_feature.mp4");
      expect(state?.edgeVideoUrl).toBe("http://192.168.1.222:8080/stream/hls/dune/master.m3u8");
      expect(state?.venueWifiSsid).toBe("Updated-Cinema-Guest-WiFi");
      expect(state?.preferredRoute).toBe("LAN_EDGE");
      expect(state?.isLanClient).toBe(true);
    });
  });
});
