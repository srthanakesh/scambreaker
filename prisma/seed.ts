import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Start seeding Phase 3...')

  // Clear existing data
  await prisma.followUpTask.deleteMany({});
  await prisma.authorityTicket.deleteMany({});
  await prisma.evidence.deleteMany({});
  await prisma.message.deleteMany({});
  await prisma.case.deleteMany({});
  await prisma.user.deleteMany({});

  const passwordHash = await bcrypt.hash('password123', 10);

  const authority = await prisma.user.create({
    data: {
      email: 'admin@scambreaker.gov',
      password: passwordHash,
      role: 'AUTHORITY',
      fullName: 'Inspector Admin',
    }
  });
  console.log(`Created Authority: ${authority.email}`);

  const victim = await prisma.user.create({
    data: {
      email: 'victim@example.com',
      password: passwordHash,
      role: 'VICTIM',
      fullName: 'John Doe',
      icNumber: '900101-14-1234',
      phoneNumber: '012-3456789'
    }
  });
  console.log(`Created Victim: ${victim.email}`);

  const scenarios = [
    {
      rawDescription: 'Received a WhatsApp message about a RM 50 delivery fee for a parcel from PosLaju. Clicked link and entered bank info. RM 4500 stolen.',
      scamType: 'Parcel Delivery Scam',
      amountLost: 4500,
      urgency: 'HIGH',
      priority: 'HIGH',
      suggestedRouting: 'PDRM + MCMC',
      assignedAgency: 'MCMC',
      workflowStatus: 'ROUTED',
      missingInfo: ['Bank statement', 'Screenshot of WhatsApp message']
    },
    {
      rawDescription: 'Someone called from LHDN saying I have RM 10,000 unpaid tax. Threatened arrest. I transferred RM 2000 to a personal account to settle it.',
      scamType: 'Bank Impersonation',
      amountLost: 2000,
      urgency: 'HIGH',
      priority: 'HIGH',
      suggestedRouting: 'Bank Fraud Desk + NSRC',
      assignedAgency: 'Bank Negara Malaysia / NSRC',
      workflowStatus: 'NEEDS_INFO',
      missingInfo: ['Suspect account number', 'Call logs']
    },
    {
      rawDescription: 'Found a job on Facebook to like YouTube videos. Earned RM 50 first day. Then they asked RM 500 for "VIP status". After pay, they blocked me.',
      scamType: 'Job Scam',
      amountLost: 500,
      urgency: 'MEDIUM',
      priority: 'NORMAL',
      suggestedRouting: 'PDRM + MCMC',
      assignedAgency: 'MCMC',
      workflowStatus: 'ROUTED',
      missingInfo: []
    },
    {
      rawDescription: 'Joined a Telegram group for crypto investment. "Master Lee" promised 300% profit in 2 hours. Invested RM 10,000. Now group deleted.',
      scamType: 'Investment Scam',
      amountLost: 10000,
      urgency: 'HIGH',
      priority: 'HIGH',
      suggestedRouting: 'Bank + PDRM (CCID)',
      assignedAgency: 'PDRM CCID',
      workflowStatus: 'ROUTED',
      missingInfo: ['Telegram handle', 'Crypto wallet address used']
    },
    {
      rawDescription: 'Bought a iPhone 15 on Shopee for RM 2500 but seller asked to pay outside Shopee via bank transfer. After pay, no item received.',
      scamType: 'E-commerce Impersonation',
      amountLost: 2500,
      urgency: 'MEDIUM',
      priority: 'NORMAL',
      suggestedRouting: 'KPDN + PDRM',
      assignedAgency: 'KPDN Malaysia',
      workflowStatus: 'NEEDS_INFO',
      missingInfo: ['Seller bank account', 'Conversation history']
    }
  ];

  for (const s of scenarios) {
    const caseRecord = await prisma.case.create({
      data: {
        ...s,
        userId: victim.id,
        detectedLanguage: 'English',
        summary: `Automated analysis for ${s.scamType}. Case involves RM ${s.amountLost}.`,
        suggestedStep: 'Call 997 immediately.',
        documents: [
          { title: 'Draft Police Report', content: `DRAFT CONTENT FOR ${s.scamType.toUpperCase()}...` },
          { title: 'Bank Dispute Letter', content: `DRAFT BANK LETTER FOR RM ${s.amountLost}...` }
        ],
        followUpTasks: {
          create: [
            { title: 'Contact NSRC', description: 'Call 997 to report the incident.', status: 'PENDING' },
            { title: 'Gather Evidence', description: 'Collect all screenshots and bank slips.', status: 'PENDING' }
          ]
        },
        ticket: {
          create: {
            priority: s.priority,
            assignedAgency: s.assignedAgency,
            status: 'OPEN'
          }
        }
      }
    });
    console.log(`Created Phase 3 scenario: ${caseRecord.scamType}`);
  }

  console.log('Seeding Phase 3 finished.');
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
