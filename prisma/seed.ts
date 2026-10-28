import { PrismaClient, AdminRole } from "@prisma/client";
import { hashPassword } from "../src/lib/crypto";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding PottyPlay production-ready database...");

  // 1. Purge all synthetic demo data while preserving schema integrity
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

  // 2. Provision Initial Platform Administrator for setapart administration
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
  console.log("Database initialized with 0 cinema circuits. Truthful empty states active across all partner surfaces.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
