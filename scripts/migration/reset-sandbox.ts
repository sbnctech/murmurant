#!/usr/bin/env npx tsx
/**
 * Murmurant Sandbox Reset Tool
 * ⚠️ DANGER: Deletes all migration data from database
 *
 * Usage:
 *   npx tsx scripts/migration/reset-sandbox.ts                    # Dry run
 *   npx tsx scripts/migration/reset-sandbox.ts --confirm "I understand this deletes data"
 */

import { PrismaClient } from '@prisma/client';

const args = process.argv.slice(2);
let dryRun = true;
let confirmed = false;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--dry-run') {
    dryRun = true;
  }
  if (args[i] === '--confirm' && args[i + 1] === 'I understand this deletes data') {
    confirmed = true;
    dryRun = false;
    i++;
  }
  if (args[i] === '--help') {
    console.log(`
Reset Sandbox - ⚠️ Deletes data!

Usage: npx tsx scripts/migration/reset-sandbox.ts [OPTIONS]

Options:
  --dry-run                     Preview what would be deleted (default)
  --confirm "I understand..."   Actually delete data

What gets deleted:
  - Payment intents
  - Event registrations
  - Transition assignments and plans
  - Member service history
  - Role assignments
  - Events
  - User accounts
  - Members

What is preserved:
  - Membership statuses
  - Committees
  - Terms
`);
    process.exit(0);
  }
}

async function main() {
  const prisma = new PrismaClient();
  const dbUrl = process.env.DATABASE_URL || '';

  // Safety check: refuse to run on production
  if (dbUrl.includes('prod')) {
    console.error('❌ Cannot run on production database!');
    process.exit(1);
  }

  console.log(`\n${'='.repeat(40)}`);
  console.log(`Reset Sandbox${dryRun ? ' (DRY RUN)' : ''}`);
  console.log(`${'='.repeat(40)}`);

  if (!dryRun && !confirmed) {
    console.error('Use: --confirm "I understand this deletes data"');
    process.exit(1);
  }

  try {
    // Count current records
    const counts = {
      payments: await prisma.paymentIntent.count(),
      registrations: await prisma.eventRegistration.count(),
      events: await prisma.event.count(),
      roleAssignments: await prisma.roleAssignment.count(),
      serviceHistory: await prisma.memberServiceHistory.count(),
      users: await prisma.userAccount.count(),
      members: await prisma.member.count(),
    };

    console.log('\nCurrent counts:');
    for (const [key, count] of Object.entries(counts)) {
      console.log(`  ${key}: ${count}`);
    }

    if (dryRun) {
      console.log('\nDry run complete. Use --confirm "I understand this deletes data" to delete.');
      return;
    }

    console.log('\nDeleting data...');

    // Delete in dependency order (children first)
    await prisma.paymentIntent.deleteMany();
    console.log('  ✓ Payment intents');

    await prisma.eventRegistration.deleteMany();
    console.log('  ✓ Event registrations');

    await prisma.transitionAssignment.deleteMany();
    console.log('  ✓ Transition assignments');

    await prisma.memberServiceHistory.deleteMany();
    console.log('  ✓ Member service history');

    await prisma.transitionPlan.deleteMany();
    console.log('  ✓ Transition plans');

    await prisma.roleAssignment.deleteMany();
    console.log('  ✓ Role assignments');

    await prisma.event.deleteMany();
    console.log('  ✓ Events');

    await prisma.userAccount.deleteMany();
    console.log('  ✓ User accounts');

    await prisma.member.deleteMany();
    console.log('  ✓ Members');

    console.log('\n✅ Reset complete');
  } finally {
    await prisma.$disconnect();
  }
}

main();
