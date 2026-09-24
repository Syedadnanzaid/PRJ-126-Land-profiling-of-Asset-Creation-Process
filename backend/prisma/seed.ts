import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed for DEVELOPMENT ONLY government accounts...');

  const password = process.env.DEV_GOV_PASSWORD || 'GovDev@123!';
  console.log(`Using password from environment or fallback for development accounts.`);

  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  // 1. Verification Officer
  const verificationOfficer = await prisma.user.upsert({
    where: { email: 'officer@gov.test' },
    update: {
      password_hash: passwordHash,
      role: Role.VERIFICATION_OFFICER,
      name: 'Test Verification Officer',
    },
    create: {
      email: 'officer@gov.test',
      name: 'Test Verification Officer',
      password_hash: passwordHash,
      role: Role.VERIFICATION_OFFICER,
    },
  });
  console.log(`Upserted Verification Officer: ${verificationOfficer.email}`);

  // 2. Approving Authority
  const approvingAuthority = await prisma.user.upsert({
    where: { email: 'approver@gov.test' },
    update: {
      password_hash: passwordHash,
      role: Role.APPROVING_AUTHORITY,
      name: 'Test Approving Authority',
    },
    create: {
      email: 'approver@gov.test',
      name: 'Test Approving Authority',
      password_hash: passwordHash,
      role: Role.APPROVING_AUTHORITY,
    },
  });
  console.log(`Upserted Approving Authority: ${approvingAuthority.email}`);

  console.log('Seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
