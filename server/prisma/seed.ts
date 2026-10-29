import { getPrisma } from "../src/prisma.js";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

// Standard bcrypt hash for "Password123!" for development seed accounts
const SEED_PASSWORD_HASH = "$2b$10$A3Qzi8YcjMMgNxPsBA7KHO69eRjBCIB8KsBx8Uv6hLB4B.pirpLWy";

const categories = [
  "Account and Access",
  "Hardware",
  "Software",
  "Network",
];

const relatedSystems = [
  "Email",
  "Campus Wi-Fi",
  "VPN",
  "LEB2 App",
  "Grade Submission App",
  "Corporate Laptop",
];

const seedUsers = [
  // Active Requesters (at least 4)
  { name: "Alice Johnson", email: "alice@toktickit.io", role: "REQUESTER" as const, isActive: true },
  { name: "Bob Smith", email: "bob@toktickit.io", role: "REQUESTER" as const, isActive: true },
  { name: "Charlie Davis", email: "charlie@toktickit.io", role: "REQUESTER" as const, isActive: true },
  { name: "Diana Prince", email: "diana@toktickit.io", role: "REQUESTER" as const, isActive: true },
  // Active Requester with no Tickets demonstrates zero requester metrics.
  { name: "Frank Miller", email: "frank@toktickit.io", role: "REQUESTER" as const, isActive: true },
  // Inactive Requester (at least 1)
  { name: "Evan Wright", email: "evan@toktickit.io", role: "REQUESTER" as const, isActive: false },

  // Active IT Staff (at least 3)
  { name: "Michael Brown", email: "michael.brown@toktickit.com", role: "IT_STAFF" as const, isActive: true },
  { name: "Sarah Johnson", email: "sarah.johnson@toktickit.com", role: "IT_STAFF" as const, isActive: true },
  { name: "David Lee", email: "david.lee@toktickit.com", role: "IT_STAFF" as const, isActive: true },
  // Inactive IT Staff (at least 1)
  { name: "Kevin Patel", email: "kevin.patel@toktickit.com", role: "IT_STAFF" as const, isActive: false },

  // Active Administrator (at least 1)
  { name: "John Smith", email: "admin@toktickit.com", role: "ADMINISTRATOR" as const, isActive: true },
];

const ticketSeedData = [
  {
    ticketNumber: "TKT-2026-000001",
    requesterEmail: "alice@toktickit.io",
    ownerEmail: "michael.brown@toktickit.com",
    categoryName: "Network",
    systemName: "VPN",
    summary: "Cannot connect to campus VPN from home",
    description: "Receiving authentication timeout error when attempting to establish VPN connection from off-campus network.",
    requestedPriority: "High",
    itPriority: "High",
    currentStatus: "In Progress",
    publicComments: [
      { authorEmail: "alice@toktickit.io", content: "I am still getting timed out on gateway 2." },
      { authorEmail: "michael.brown@toktickit.com", content: "We are inspecting the RADIUS server logs now." }
    ],
    internalNotes: [
      { authorEmail: "michael.brown@toktickit.com", content: "RADIUS session pool reached maximum concurrency limit at 09:00 AM." }
    ]
  },
  {
    ticketNumber: "TKT-2026-000002",
    requesterEmail: "bob@toktickit.io",
    ownerEmail: "sarah.johnson@toktickit.com",
    categoryName: "Hardware",
    systemName: "Corporate Laptop",
    summary: "Laptop screen flickering continuously",
    description: "Display panel flickers violently whenever graphics intensive applications or web apps are launched.",
    requestedPriority: "Medium",
    itPriority: "Medium",
    currentStatus: "Open",
    publicComments: [
      { authorEmail: "sarah.johnson@toktickit.com", content: "Please bring the device to IT Desk room 302 for hardware inspection." }
    ],
    internalNotes: [
      { authorEmail: "sarah.johnson@toktickit.com", content: "Likely loose display EDP flex cable connection." }
    ]
  },
  {
    ticketNumber: "TKT-2026-000003",
    requesterEmail: "charlie@toktickit.io",
    ownerEmail: null,
    categoryName: "Software",
    systemName: "LEB2 App",
    summary: "LEB2 assignment submission button unresponsive",
    description: "Clicking submit on assignment portal gives a 500 server error when attaching PDF files.",
    requestedPriority: "High",
    itPriority: "High",
    currentStatus: "New",
    publicComments: [],
    internalNotes: []
  },
  {
    ticketNumber: "TKT-2026-000004",
    requesterEmail: "diana@toktickit.io",
    ownerEmail: "david.lee@toktickit.com",
    categoryName: "Network",
    systemName: "Campus Wi-Fi",
    summary: "Weak Wi-Fi signal in Library 3rd floor",
    description: "Signal drops frequently near the west wing seating area during peak hours.",
    requestedPriority: "Low",
    itPriority: "Low",
    currentStatus: "Resolved",
    publicComments: [
      { authorEmail: "david.lee@toktickit.com", content: "Rebooted access point AP-LIB-3W and upgraded firmware." },
      { authorEmail: "diana@toktickit.io", content: "Signal strength is great now, thank you!" }
    ],
    internalNotes: [
      { authorEmail: "david.lee@toktickit.com", content: "Firmware v4.2.1 resolved channel interference." }
    ]
  },
  {
    ticketNumber: "TKT-2026-000005",
    requesterEmail: "alice@toktickit.io",
    ownerEmail: "sarah.johnson@toktickit.com",
    categoryName: "Account and Access",
    systemName: "Email",
    summary: "Waiting for requester to confirm mailbox access",
    description: "Mailbox permissions were repaired; requester confirmation is pending.",
    requestedPriority: "Medium",
    itPriority: "Medium",
    currentStatus: "Waiting for Requester",
    publicComments: [],
    internalNotes: [],
  },
  {
    ticketNumber: "TKT-2026-000006",
    requesterEmail: "bob@toktickit.io",
    ownerEmail: "david.lee@toktickit.com",
    categoryName: "Software",
    systemName: "Grade Submission App",
    summary: "Resolved grade submission error",
    description: "The grade form rejected valid submissions after a browser update.",
    requestedPriority: "Low",
    itPriority: "Low",
    currentStatus: "Closed",
    publicComments: [],
    internalNotes: [],
  },
  {
    ticketNumber: "TKT-2026-000007",
    requesterEmail: "charlie@toktickit.io",
    ownerEmail: "michael.brown@toktickit.com",
    categoryName: "Hardware",
    systemName: "Corporate Laptop",
    summary: "Laptop battery issue returned after resolution",
    description: "The battery drains rapidly again, so the closed work has been reopened.",
    requestedPriority: "High",
    itPriority: "Urgent",
    currentStatus: "Reopened",
    publicComments: [],
    internalNotes: [],
  },
  {
    ticketNumber: "TKT-2026-000008",
    requesterEmail: "diana@toktickit.io",
    ownerEmail: null,
    categoryName: "Network",
    systemName: "Campus Wi-Fi",
    summary: "Duplicate guest Wi-Fi request",
    description: "Request withdrawn after the requester found the existing guest network instructions.",
    requestedPriority: "Low",
    itPriority: "Low",
    currentStatus: "Cancelled",
    publicComments: [],
    internalNotes: [],
  }
];

const actionSeedData = [
  {
    ticketNumber: "TKT-2026-000001",
    performedByEmail: "sarah.johnson@toktickit.com",
    hoursAgo: 8,
    actionDescription: "Reviewed VPN authentication logs",
    result: "Found intermittent RADIUS timeout on gateway 2.",
    followUpRequired: true,
    followUpNote: "Recheck authentication after the gateway patch.",
    attachmentNotes: "See vpn-radius-check.txt",
  },
  {
    ticketNumber: "TKT-2026-000002",
    performedByEmail: "michael.brown@toktickit.com",
    hoursAgo: 30,
    actionDescription: "Inspected laptop display cable",
    result: "Cable was seated correctly; flicker remains under load.",
    followUpRequired: true,
    followUpNote: "Run the panel diagnostic after driver update.",
    attachmentNotes: null,
  },
  {
    ticketNumber: "TKT-2026-000002",
    performedByEmail: "sarah.johnson@toktickit.com",
    hoursAgo: 4,
    actionDescription: "Updated graphics driver and repeated display test",
    result: "Display remained stable during the test.",
    followUpRequired: false,
    followUpNote: null,
    attachmentNotes: "Diagnostic result recorded in display-test.txt",
  },
  {
    ticketNumber: "TKT-2026-000004",
    performedByEmail: "david.lee@toktickit.com",
    hoursAgo: 20,
    actionDescription: "Restarted library access point and checked coverage",
    result: "Requester confirmed stable Wi-Fi coverage.",
    followUpRequired: false,
    followUpNote: null,
    attachmentNotes: null,
  },
];

export async function seedDatabase(prisma = getPrisma()): Promise<void> {
  console.log("Seeding TokTickIT Lab 4 database...");

  // 1. Seed Categories
  for (const name of categories) {
    await prisma.category.upsert({
      where: { name },
      update: { isActive: true },
      create: { name, isActive: true },
    });
  }

  // 2. Seed Related Systems
  for (const name of relatedSystems) {
    await prisma.relatedSystem.upsert({
      where: { name },
      update: { isActive: true },
      create: { name, isActive: true },
    });
  }

  // 3. Seed Users (Requesters, IT Staff, Admin)
  const userMap = new Map<string, any>();

  for (const u of seedUsers) {
    const dbUser = await prisma.user.upsert({
      where: { email: u.email },
      update: {
        name: u.name,
        passwordHash: SEED_PASSWORD_HASH,
        role: u.role,
        isActive: u.isActive,
      },
      create: {
        name: u.name,
        email: u.email,
        passwordHash: SEED_PASSWORD_HASH,
        role: u.role,
        mustChangePassword: false,
        isActive: u.isActive,
      },
    });
    userMap.set(u.email, dbUser);
  }

  // 4. Seed Tickets with Public Comments & Internal Notes
  const categoryRecords = await prisma.category.findMany();
  const systemRecords = await prisma.relatedSystem.findMany();

  const categoryMap = new Map(categoryRecords.map((c) => [c.name, c.id]));
  const systemMap = new Map(systemRecords.map((s) => [s.name, s.id]));

  for (const t of ticketSeedData) {
    const requester = userMap.get(t.requesterEmail);
    const owner = t.ownerEmail ? userMap.get(t.ownerEmail) : null;
    const categoryId = categoryMap.get(t.categoryName);
    const relatedSystemId = systemMap.get(t.systemName);

    if (!requester || !categoryId || !relatedSystemId) {
      console.warn(`Skipping ticket ${t.ticketNumber} due to missing relation references.`);
      continue;
    }

    const ticket = await prisma.ticket.upsert({
      where: { ticketNumber: t.ticketNumber },
      update: {
        summary: t.summary,
        description: t.description,
        requestedPriority: t.requestedPriority,
        itPriority: t.itPriority,
        currentStatus: t.currentStatus,
        ownerId: owner ? owner.id : null,
      },
      create: {
        ticketNumber: t.ticketNumber,
        requesterId: requester.id,
        ownerId: owner ? owner.id : null,
        categoryId,
        relatedSystemId,
        summary: t.summary,
        description: t.description,
        requestedPriority: t.requestedPriority,
        itPriority: t.itPriority,
        currentStatus: t.currentStatus,
      },
    });

    // Seed Public Comments
    for (const c of t.publicComments) {
      const author = userMap.get(c.authorEmail);
      if (author) {
        const existingComment = await prisma.publicComment.findFirst({
          where: { ticketId: ticket.id, authorId: author.id, content: c.content }
        });
        if (!existingComment) {
          await prisma.publicComment.create({
            data: {
              ticketId: ticket.id,
              authorId: author.id,
              content: c.content
            }
          });
        }
      }
    }

    // Seed Internal Notes
    for (const n of t.internalNotes) {
      const author = userMap.get(n.authorEmail);
      if (author) {
        const existingNote = await prisma.internalNote.findFirst({
          where: { ticketId: ticket.id, authorId: author.id, content: n.content }
        });
        if (!existingNote) {
          await prisma.internalNote.create({
            data: {
              ticketId: ticket.id,
              authorId: author.id,
              content: n.content
            }
          });
        }
      }
    }
  }

  // 5. Seed Actions Taken by stable natural fixture key so repeated runs update
  // the same rows instead of creating duplicates. Distinct work times use the
  // seed run's current time to keep dashboard examples recent.
  for (const action of actionSeedData) {
    const ticket = await prisma.ticket.findUnique({
      where: { ticketNumber: action.ticketNumber },
      select: { id: true },
    });
    const performer = userMap.get(action.performedByEmail);

    if (!ticket || !performer) {
      console.warn(`Skipping Action Taken for ${action.ticketNumber}: missing Ticket or performer.`);
      continue;
    }

    const actionDateTime = new Date(Date.now() - action.hoursAgo * 60 * 60 * 1000);
    const existingAction = await prisma.actionTaken.findFirst({
      where: {
        ticketId: ticket.id,
        performedById: performer.id,
        actionDescription: action.actionDescription,
      },
    });
    const actionData = {
      actionDateTime,
      result: action.result,
      followUpRequired: action.followUpRequired,
      followUpNote: action.followUpNote,
      attachmentNotes: action.attachmentNotes,
    };

    if (existingAction) {
      await prisma.actionTaken.update({
        where: { id: existingAction.id },
        data: actionData,
      });
    } else {
      await prisma.actionTaken.create({
        data: {
          ticketId: ticket.id,
          performedById: performer.id,
          actionDescription: action.actionDescription,
          ...actionData,
        },
      });
    }
  }

  console.log("Database seeded successfully with Lab 4 status, assignment, priority, and Actions Taken fixtures.");
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  const prisma = getPrisma();
  seedDatabase(prisma)
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
}
