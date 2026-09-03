import { getPrisma } from "./src/prisma.js";

const ticketTemplates = [
  {
    summary: "VPN connection drops every 30 minutes",
    description: "While working remotely, the campus VPN drops active session automatically every 30 minutes.",
  },
  {
    summary: "Monitor display resolution locked at 1024x768",
    description: "External monitor connected via HDMI cannot change resolution setting beyond 1024x768.",
  },
  {
    summary: "LEB2 video lectures buffer slowly",
    description: "Streaming lecture recordings on LEB2 app frequently pauses to buffer even on high-speed connection.",
  },
  {
    summary: "Requesting MATLAB license activation key",
    description: "Need renewed license activation key for MATLAB 2026 workstation install.",
  },
  {
    summary: "Printer spooler service hanging on print job",
    description: "Sending documents to 2nd floor library printer results in stuck queue and printer error.",
  },
  {
    summary: "Email notification alerts not sounding",
    description: "Outlook desktop client fails to play notification chime when new messages arrive.",
  },
  {
    summary: "Gradebook Excel export corrupted",
    description: "Exporting grades to CSV format results in garbled character encoding for student names.",
  },
  {
    summary: "Wi-Fi connection drops in SCB building",
    description: "Wireless network disconnects when walking between classrooms on 4th floor.",
  },
  {
    summary: "Mouse left-click double clicking randomly",
    description: "Hardware issue with assigned wireless mouse where single click registers as double click.",
  },
  {
    summary: "Two-Factor authentication code SMS delayed",
    description: "2FA authentication SMS takes up to 15 minutes to arrive during login attempt.",
  },
  {
    summary: "Cannot upload PDF assignment file",
    description: "Uploading assignment attachments larger than 3MB fails with unknown network error.",
  },
  {
    summary: "Software update stuck at 99%",
    description: "System updates downloader gets stuck indefinitely near completion.",
  }
];

const priorities = ["Low", "Medium", "High", "Urgent"];
const statuses = ["New", "In Progress", "Resolved", "Closed"];

function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function main() {
  const prisma = getPrisma();

  console.log("1. Finding user 'Alice Johnson'...");
  const alice = await prisma.requesterUser.findFirst({
    where: {
      OR: [
        { name: { contains: "Alice Johnson", mode: "insensitive" } },
        { email: { equals: "alice@toktickit.io", mode: "insensitive" } },
      ],
    },
  });

  if (!alice) {
    throw new Error("Requester 'Alice Johnson' not found in database.");
  }

  console.log(`Found user: ${alice.name} (ID: ${alice.id}, Email: ${alice.email})`);

  console.log("\n2. Fetching active categories and related systems...");
  const categories = await prisma.category.findMany({ where: { isActive: true } });
  const relatedSystems = await prisma.relatedSystem.findMany({ where: { isActive: true } });

  if (categories.length === 0 || relatedSystems.length === 0) {
    throw new Error("Missing active categories or related systems in database.");
  }

  console.log(`Found ${categories.length} categories and ${relatedSystems.length} systems.`);

  const shuffledTemplates = [...ticketTemplates].sort(() => 0.5 - Math.random());
  const year = new Date().getFullYear();

  console.log("\n3. Creating 10 additional tickets for Alice Johnson with random category, priority, status, and system...\n");

  const createdTickets = [];

  for (let i = 0; i < 10; i++) {
    const template = shuffledTemplates[i % shuffledTemplates.length];
    const category = getRandomItem(categories);
    const system = getRandomItem(relatedSystems);
    const priority = getRandomItem(priorities);
    const status = getRandomItem(statuses);

    // Calculate unique ticket number
    const count = await prisma.ticket.count();
    let nextNum = count + 1;
    let ticketNumber = `TKT-${year}-${String(nextNum).padStart(6, "0")}`;
    while (await prisma.ticket.findUnique({ where: { ticketNumber } })) {
      nextNum++;
      ticketNumber = `TKT-${year}-${String(nextNum).padStart(6, "0")}`;
    }

    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber,
        requesterId: alice.id,
        categoryId: category.id,
        relatedSystemId: system.id,
        summary: template.summary,
        description: template.description,
        requestedPriority: priority,
        currentStatus: status,
      },
      include: {
        category: true,
        relatedSystem: true,
        requester: true,
      },
    });

    createdTickets.push(ticket);
    console.log(
      `[Ticket #${i + 1}] ID: ${ticket.id} | No: ${ticket.ticketNumber} | Requester: ${ticket.requester.name} | Category: ${ticket.category.name} | Priority: ${ticket.requestedPriority} | Status: ${ticket.currentStatus} | Summary: "${ticket.summary}"`
    );
  }

  console.log("\nSuccessfully created 10 additional tickets for Alice Johnson!");
}

main()
  .catch((e) => {
    console.error("Error creating tickets for Alice Johnson:", e);
    process.exit(1);
  })
  .finally(async () => {
    await getPrisma().$disconnect();
  });
