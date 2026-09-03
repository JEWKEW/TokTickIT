import { getPrisma } from "./src/prisma.js";

const ticketTemplates = [
  {
    summary: "Cannot connect to campus VPN from home",
    description: "Receiving authentication timeout error when attempting to establish VPN connection from off-campus network.",
  },
  {
    summary: "Laptop screen flickering continuously",
    description: "Display panel flickers violently whenever graphics intensive applications or web apps are launched.",
  },
  {
    summary: "LEB2 assignment submission button unresponsive",
    description: "Clicking submit on assignment portal gives a 500 server error when attaching PDF files.",
  },
  {
    summary: "Weak Wi-Fi signal in Library 3rd floor",
    description: "Signal drops frequently near the west wing seating area during peak hours.",
  },
  {
    summary: "Password reset link not arriving in inbox",
    description: "Requested password reset twice but confirmation email has not been delivered to campus inbox.",
  },
  {
    summary: "Grade calculation mismatch in final report",
    description: "Weighted total calculation differs from column sum in the gradebook grid export.",
  },
  {
    summary: "Keyboard spacebar key sticking",
    description: "Mechanical resistance when pressing spacebar key on assigned corporate laptop keyboard.",
  },
  {
    summary: "Intermittent connection drops on VPN gateway 2",
    description: "VPN session drops every 15 minutes while connected to gateway 2 server.",
  },
  {
    summary: "Requesting TA role permissions for CS101",
    description: "Need teaching assistant access added to CS101 course roster on LEB2 app.",
  },
  {
    summary: "Outlook inbox syncing slowly",
    description: "Syncing emails takes over 10 minutes when receiving attachments larger than 2MB.",
  },
  {
    summary: "Unable to access Grade Submission Portal",
    description: "Access denied message appears when trying to open the grade submission system.",
  },
  {
    summary: "Wi-Fi authentication fails on mobile device",
    description: "Campus Wi-Fi keeps prompting for credentials repeatedly on Android/iOS.",
  },
  {
    summary: "Software license expired for CAD tool",
    description: "Engineering software shows license expired alert upon launching application.",
  },
  {
    summary: "Corporate laptop battery draining fast",
    description: "Battery discharges from 100% to 10% in less than one hour of standard usage.",
  },
  {
    summary: "Email attachment limit error",
    description: "Unable to send email with 4MB attachment even though limit is supposed to be 10MB.",
  }
];

const priorities = ["Low", "Medium", "High", "Urgent"];
const statuses = ["New", "In Progress", "Resolved", "Closed"];

function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function main() {
  const prisma = getPrisma();

  console.log("1. Clearing all existing tickets and attachments...");
  const deletedAttachments = await prisma.attachment.deleteMany({});
  const deletedTickets = await prisma.ticket.deleteMany({});
  console.log(`Deleted ${deletedAttachments.count} attachments and ${deletedTickets.count} tickets.`);

  console.log("\n2. Fetching database entities...");
  const categories = await prisma.category.findMany({ where: { isActive: true } });
  const relatedSystems = await prisma.relatedSystem.findMany({ where: { isActive: true } });
  const requesters = await prisma.requesterUser.findMany({ where: { isActive: true } });

  if (categories.length === 0 || relatedSystems.length === 0 || requesters.length === 0) {
    throw new Error("Missing categories, related systems, or requesters in DB. Please run prisma seed first.");
  }

  console.log(`Found ${categories.length} categories, ${relatedSystems.length} systems, ${requesters.length} requesters.`);

  // Shuffle or pick random templates
  const shuffledTemplates = [...ticketTemplates].sort(() => 0.5 - Math.random());
  const year = new Date().getFullYear();

  console.log("\n3. Creating 10 new tickets with random category, priority, status, system, and requester...\n");

  const createdTickets = [];

  for (let i = 0; i < 10; i++) {
    const template = shuffledTemplates[i % shuffledTemplates.length];
    const category = getRandomItem(categories);
    const system = getRandomItem(relatedSystems);
    const requester = getRandomItem(requesters);
    const priority = getRandomItem(priorities);
    const status = getRandomItem(statuses);

    const ticketNumber = `TKT-${year}-${String(i + 1).padStart(6, "0")}`;

    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber,
        requesterId: requester.id,
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

  console.log("\nSuccessfully created 10 tickets!");
}

main()
  .catch((e) => {
    console.error("Error executing reset script:", e);
    process.exit(1);
  })
  .finally(async () => {
    await getPrisma().$disconnect();
  });
