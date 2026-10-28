import {
  PrismaClient,
  AdminRole,
  CinemaStatus,
  ScreeningStatus,
  TicketStatus,
  PricingStatus,
  OperatorRole,
} from "@prisma/client";
import { hashPassword } from "../src/lib/crypto";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding PottyPlay production-ready database...");

  // 1. Purge all existing demo data while preserving schema integrity
  await prisma.auditEvent.deleteMany();
  await prisma.usageBillingEvent.deleteMany();
  await prisma.smsDeliveryAttempt.deleteMany();
  await prisma.breakSession.deleteMany();
  await prisma.demonstrationTicket.deleteMany();
  await prisma.otpChallenge.deleteMany();
  await prisma.screeningReminder.deleteMany();
  await prisma.rightsAuthorization.deleteMany();
  await prisma.screening.deleteMany();
  await prisma.screen.deleteMany();
  await prisma.contentAsset.deleteMany();
  await prisma.cinemaPricingRule.deleteMany();
  await prisma.operatorUser.deleteMany();
  await prisma.cinema.deleteMany();

  // 2. Provision Initial Platform Administrator
  const adminPassword = process.env.ADMIN_INITIAL_PASSWORD || "AdminPottyPlay2026!";
  const passwordHash = hashPassword(adminPassword);

  const admin = await prisma.adminUser.upsert({
    where: { username: "admin" },
    update: {
      passwordHash,
      isActive: true,
    },
    create: {
      username: "admin",
      email: "admin@pottyplay.internal",
      passwordHash,
      role: AdminRole.SUPERADMIN,
      isActive: true,
    },
  });

  console.log(`Platform superadmin provisioned: ${admin.username} (${admin.email})`);

  // 3. Provision Demo Cinema Circuit Venue
  const cinema = await prisma.cinema.create({
    data: {
      id: "cinema_demo_01",
      name: "Century Cinemax Mlimani City",
      location: "Mlimani City Mall, Sam Nujoma Rd, Dar es Salaam",
      timezone: "Africa/Dar_es_Salaam",
      status: CinemaStatus.APPROVED,
      ticketingSystem: "Vista",
      screeningSystem: "Dolby TMS",
    },
  });

  // 4. Provision Operator Account for Cinema
  const operatorPassword = hashPassword("Operator2026!");
  const operator = await prisma.operatorUser.create({
    data: {
      cinemaId: cinema.id,
      email: "operator@cinemax.co.tz",
      name: "Juma Hamisi (Chief Projectionist)",
      passwordHash: operatorPassword,
      role: OperatorRole.MANAGER,
      isActive: true,
    },
  });

  console.log(`Cinema operator provisioned: ${operator.email} for ${cinema.name}`);

  // 5. Provision Auditorium Screen
  const screen = await prisma.screen.create({
    data: {
      id: "screen_demo_atmos",
      cinemaId: cinema.id,
      name: "Auditorium 1 - Dolby Atmos 4K",
      totalSeats: 180,
    },
  });

  // 6. Provision Active Commercial Pricing Rule
  await prisma.cinemaPricingRule.create({
    data: {
      cinemaId: cinema.id,
      pricePerSession: 500,
      currency: "TZS",
      status: PricingStatus.ACTIVE,
      notes: "Commercial evaluation pilot pricing model for Century Cinemax",
      effectiveFrom: new Date(),
    },
  });

  // 7. Provision Demo Content Asset
  const asset = await prisma.contentAsset.create({
    data: {
      id: "asset_serengeti_demo",
      title: "Serengeti Symphony - 4K Companion Cut",
      durationSeconds: 7200,
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      thumbnailUrl: null,
      licenseType: "COMMERCIAL_EXHIBITION_RIGHTS",
      licenseSource: "Synthesized Studio Rights License",
    },
  });

  // 8. Provision Content Rights Authorization
  await prisma.rightsAuthorization.create({
    data: {
      cinemaId: cinema.id,
      contentAssetId: asset.id,
      isAuthorized: true,
      validFrom: new Date(Date.now() - 30 * 24 * 3600 * 1000),
      validUntil: new Date(Date.now() + 365 * 24 * 3600 * 1000),
      maxSessionDurationSeconds: 900,
      notes: "Territory rights granted for East Africa theater network",
    },
  });

  // 9. Provision Demo Screening
  const screening = await prisma.screening.create({
    data: {
      id: "screening_prime_01",
      cinemaId: cinema.id,
      screenId: screen.id,
      contentAssetId: asset.id,
      title: "Serengeti Symphony - 4K Feature Presentation",
      scheduledStart: new Date(Date.now() - 30 * 60 * 1000),
      actualStart: new Date(Date.now() - 30 * 60 * 1000),
      status: ScreeningStatus.PLAYING,
      playbackPositionSeconds: 1800.0,
      lastPositionUpdatedAt: new Date(),
      isPaused: false,
    },
  });

  // 10. Provision Demonstration Tickets
  const ticket1 = await prisma.demonstrationTicket.create({
    data: {
      ticketNumber: "DEMO-TK-7821",
      claimToken: "DEMO-CLM-8821",
      screeningId: screening.id,
      seatNumber: "D14",
      customerName: "Amani Mwamba",
      status: TicketStatus.VALID_ADMITTED,
      maxBreaks: 2,
    },
  });

  const ticket2 = await prisma.demonstrationTicket.create({
    data: {
      ticketNumber: "DEMO-TK-7822",
      claimToken: "DEMO-CLM-8822",
      screeningId: screening.id,
      seatNumber: "F08",
      customerName: "Neema Juma",
      status: TicketStatus.VALID_ADMITTED,
      maxBreaks: 2,
    },
  });

  console.log(`Demo fixtures seeded successfully:`);
  console.log(`- Screening: ${screening.id} ("${screening.title}")`);
  console.log(`- Tickets: ${ticket1.ticketNumber} (Token: ${ticket1.claimToken}), ${ticket2.ticketNumber} (Token: ${ticket2.claimToken})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
