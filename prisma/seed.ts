import { PrismaClient, TicketStatus, ScreeningStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding PottyPlay database...");

  // Clean up any existing data in correct order
  await prisma.auditEvent.deleteMany();
  await prisma.usageBillingEvent.deleteMany();
  await prisma.smsDeliveryAttempt.deleteMany();
  await prisma.breakSession.deleteMany();
  await prisma.demonstrationTicket.deleteMany();
  await prisma.otpChallenge.deleteMany();
  await prisma.rightsAuthorization.deleteMany();
  await prisma.screening.deleteMany();
  await prisma.screen.deleteMany();
  await prisma.contentAsset.deleteMany();
  await prisma.cinema.deleteMany();

  // 1. Cinema
  const cinema = await prisma.cinema.create({
    data: {
      id: "cinema_mlimani_01",
      name: "Century Cinemax - Mlimani City (Simulated)",
      location: "Mlimani City Mall, Dar es Salaam, Tanzania",
      timezone: "Africa/Dar_es_Salaam",
    },
  });

  const secondaryCinema = await prisma.cinema.create({
    data: {
      id: "cinema_oasis_02",
      name: "Oasis Cinema - Masaki (Simulated)",
      location: "Masaki Peninsula, Dar es Salaam, Tanzania",
      timezone: "Africa/Dar_es_Salaam",
    },
  });

  // 2. Screen
  const screen = await prisma.screen.create({
    data: {
      id: "screen_atmosphere_01",
      cinemaId: cinema.id,
      name: "Screen 1 (Dolby Atmos)",
      totalSeats: 160,
    },
  });

  const screenSecondary = await prisma.screen.create({
    data: {
      id: "screen_oasis_01",
      cinemaId: secondaryCinema.id,
      name: "Screen 2 (Oasis Premiere)",
      totalSeats: 90,
    },
  });

  // 3. Content Asset (Explicit demonstration asset)
  const contentAsset = await prisma.contentAsset.create({
    data: {
      id: "asset_serengeti_shadows",
      title: "Serengeti Shadows: The Silent Guardian",
      durationSeconds: 1800, // 30 minutes
      videoUrl: "/assets/demo-feature.mp4",
      thumbnailUrl: "/assets/demo-thumbnail.jpg",
      licenseType: "Creative Commons BY-NC 4.0 & Original Visual Demonstration Asset",
      licenseSource: "Tanzanian Cinema Heritage & Open Demonstration Archives 2026",
    },
  });

  // Unlicensed asset for testing rights failure
  const unlicensedAsset = await prisma.contentAsset.create({
    data: {
      id: "asset_unlicensed_test",
      title: "Unlicensed Test Feature",
      durationSeconds: 1200,
      videoUrl: "/assets/unlicensed.mp4",
      licenseType: "Unlicensed / Restricted",
      licenseSource: "Restricted Proprietary",
    },
  });

  // 4. Rights Authorization
  const now = new Date();
  const validFrom = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 1 day ago
  const validUntil = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days ahead

  await prisma.rightsAuthorization.create({
    data: {
      id: "auth_mlimani_serengeti",
      contentAssetId: contentAsset.id,
      cinemaId: cinema.id,
      isAuthorized: true,
      validFrom,
      validUntil,
      maxSessionDurationSeconds: 900,
      notes: "Authorized demonstration asset for Africa's Talking Hackathon 2026",
    },
  });

  // 5. Screenings
  const scheduledStart = new Date(now.getTime() - 15 * 60 * 1000); // 15 mins ago
  const actualStart = new Date(now.getTime() - 12 * 60 * 1000); // 12 mins ago (3 min delay)
  const initialPositionSeconds = 720.0; // 12 minutes in

  const screening = await prisma.screening.create({
    data: {
      id: "screening_prime_01",
      cinemaId: cinema.id,
      screenId: screen.id,
      contentAssetId: contentAsset.id,
      title: "Serengeti Shadows (Main Hall)",
      scheduledStart,
      actualStart,
      status: ScreeningStatus.PLAYING,
      playbackPositionSeconds: initialPositionSeconds,
      lastPositionUpdatedAt: now,
      totalPausedDurationSeconds: 0.0,
      isPaused: false,
    },
  });

  // Other screening for wrong-screening ticket testing
  const wrongScreening = await prisma.screening.create({
    data: {
      id: "screening_wrong_02",
      cinemaId: cinema.id,
      screenId: screen.id,
      contentAssetId: contentAsset.id,
      title: "Serengeti Shadows (Late Show)",
      scheduledStart: new Date(now.getTime() + 2 * 60 * 60 * 1000),
      status: ScreeningStatus.SCHEDULED,
      playbackPositionSeconds: 0.0,
      isPaused: false,
    },
  });

  // Screening with missing rights for testing rights authorization failure
  const screeningNoRights = await prisma.screening.create({
    data: {
      id: "screening_no_rights_03",
      cinemaId: secondaryCinema.id,
      screenId: screenSecondary.id,
      contentAssetId: unlicensedAsset.id,
      title: "Unlicensed Screening Test",
      scheduledStart,
      actualStart,
      status: ScreeningStatus.PLAYING,
      playbackPositionSeconds: 100.0,
      lastPositionUpdatedAt: now,
      isPaused: false,
    },
  });

  // 6. Demonstration Tickets
  const validTicket1 = await prisma.demonstrationTicket.create({
    data: {
      id: "ticket_val_01",
      ticketNumber: "CC-MLM-7821-A12",
      screeningId: screening.id,
      seatNumber: "A12",
      customerName: "Juma Mwanamvua",
      status: TicketStatus.VALID_ADMITTED,
    },
  });

  await prisma.demonstrationTicket.create({
    data: {
      id: "ticket_val_02",
      ticketNumber: "CC-MLM-7822-B04",
      screeningId: screening.id,
      seatNumber: "B04",
      customerName: "Neema Kimaro",
      status: TicketStatus.VALID_ADMITTED,
    },
  });

  // Pre-activated ticket for duplicate activation check
  const activatedTicket = await prisma.demonstrationTicket.create({
    data: {
      id: "ticket_act_03",
      ticketNumber: "CC-MLM-7823-C08",
      screeningId: screening.id,
      seatNumber: "C08",
      customerName: "David Tarimo",
      status: TicketStatus.ALREADY_ACTIVATED,
      activatedAt: new Date(now.getTime() - 5 * 60 * 1000),
    },
  });

  // Create an active session and billing event for the pre-activated ticket
  const preSession = await prisma.breakSession.create({
    data: {
      id: "session_pre_01",
      sessionToken: "pstk_demo_preactive_c08_xyz",
      ticketId: activatedTicket.id,
      screeningId: screening.id,
      phoneNumber: "+255712000003",
      startedAt: new Date(now.getTime() - 5 * 60 * 1000),
      expiresAt: new Date(now.getTime() + 10 * 60 * 1000),
      status: "ACTIVE",
      lastPositionSeconds: 420.0,
      deviceInfo: "Safari on iOS 18 (Mobile)",
    },
  });

  await prisma.usageBillingEvent.create({
    data: {
      id: "bill_pre_01",
      sessionId: preSession.id,
      cinemaId: cinema.id,
      ticketNumber: activatedTicket.ticketNumber,
      priceTzs: 500,
      qualifying: true,
      isSimulated: true,
      disclaimer: "Simulated hackathon business assumption, not an agreed Century Cinemax rate",
    },
  });

  // Cancelled/Refunded ticket
  await prisma.demonstrationTicket.create({
    data: {
      id: "ticket_can_04",
      ticketNumber: "CC-MLM-7824-D15",
      screeningId: screening.id,
      seatNumber: "D15",
      customerName: "Zainab Rashid",
      status: TicketStatus.CANCELLED_REFUNDED,
    },
  });

  // Ineligible ticket
  await prisma.demonstrationTicket.create({
    data: {
      id: "ticket_ine_05",
      ticketNumber: "CC-MLM-7825-E02",
      screeningId: screening.id,
      seatNumber: "E02",
      customerName: "Bakari Salum",
      status: TicketStatus.INELIGIBLE,
    },
  });

  // Ticket for the wrong screening
  await prisma.demonstrationTicket.create({
    data: {
      id: "ticket_wrg_06",
      ticketNumber: "CC-MLM-9999-Z99",
      screeningId: wrongScreening.id,
      seatNumber: "Z99",
      customerName: "Fatma Kassim",
      status: TicketStatus.VALID_ADMITTED,
    },
  });

  // Ticket for screening with no rights
  await prisma.demonstrationTicket.create({
    data: {
      id: "ticket_norights_07",
      ticketNumber: "OAS-MSC-1100-F01",
      screeningId: screeningNoRights.id,
      seatNumber: "F01",
      customerName: "Baraka Mwangi",
      status: TicketStatus.VALID_ADMITTED,
    },
  });

  // 7. Audit event record
  await prisma.auditEvent.create({
    data: {
      id: "audit_seed_01",
      sessionId: preSession.id,
      eventType: "SESSION_ACTIVATED",
      entityType: "SESSION",
      entityId: preSession.id,
      actor: "CUSTOMER",
      details: JSON.stringify({
        ticketNumber: activatedTicket.ticketNumber,
        phoneNumber: "+255712000003",
        seat: "C08",
      }),
    },
  });

  console.log("Database seeded successfully with simulated cinema, screening, tickets, and rights.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
