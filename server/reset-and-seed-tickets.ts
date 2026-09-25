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
  },
  {
    summary: "Two-Factor Authentication (2FA) push notification failing",
    description: "2FA push notifications are not arriving on smartphone app during login.",
  },
  {
    summary: "Projector in Room 402 no signal input",
    description: "HDMI connection to wall plate does not output signal to room projector.",
  },
  {
    summary: "Shared folder permission access denied",
    description: "Cannot open the Department Share drive folder; getting permission error.",
  },
  {
    summary: "Zoom video conference call crashing intermittently",
    description: "Zoom application closes unexpectedly during high-definition video group calls.",
  },
  {
    summary: "Printer offline in 2nd floor staff lounge",
    description: "Network printer shows offline status on all workstation print dialogs.",
  },
];

const allStatuses = [
  "New",
  "Open",
  "In Progress",
  "Waiting for Requester",
  "Resolved",
  "Closed",
  "Reopened",
  "Cancelled",
];

const priorities = ["Low", "Medium", "High", "Urgent"];

const samplePublicCommentsRequester = [
  "Hi, following up on this request as it is affecting my daily work.",
  "I've attached the error log screenshot as requested.",
  "Is there an estimated time for resolution?",
  "I tried reconnecting, but the error still occurs on my machine.",
  "Thank you, the issue seems to be resolved now!"
];

const samplePublicCommentsStaff = [
  "Hello, we are actively looking into this issue and investigating server logs.",
  "Could you please try clearing your browser cache and logging back in?",
  "We have updated your account permissions. Please test and confirm.",
  "Please bring your device to IT Support Desk (Room 302) for inspection.",
  "We have deployed a patch and resolved the underlying issue."
];

const sampleInternalNotes = [
  "Checked firewall logs. Connection was throttled due to security policy.",
  "User account was flagged for password expiration. Issued temporary token.",
  "Escalated ticket to Level 2 Systems Engineering team.",
  "Replacement hardware component ordered under warranty.",
  "Verified RADIUS authentication server response time is normal now.",
  "Customer confirmed resolution over phone call. Prepared for closing."
];

const sampleAttachments = [
  { originalFileName: "screen_error_capture.png", storedFileName: "att_01_screen_error.png", fileSize: 524288, mimeType: "image/png" },
  { originalFileName: "vpn_client_diagnostic.log", storedFileName: "att_02_vpn_diag.log", fileSize: 18432, mimeType: "text/plain" },
  { originalFileName: "leb2_network_trace.har", storedFileName: "att_03_network_trace.har", fileSize: 1048576, mimeType: "application/json" },
  { originalFileName: "laptop_display_defect.jpg", storedFileName: "att_04_display_defect.jpg", fileSize: 2097152, mimeType: "image/jpeg" },
  { originalFileName: "access_permission_request.pdf", storedFileName: "att_05_permission_request.pdf", fileSize: 419430, mimeType: "application/pdf" },
  { originalFileName: "system_info_report.txt", storedFileName: "att_06_sysinfo.txt", fileSize: 12288, mimeType: "text/plain" },
  { originalFileName: "wifi_signal_analyzer.png", storedFileName: "att_07_wifi_analyzer.png", fileSize: 819200, mimeType: "image/png" }
];

function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateStatusesList(total: number): string[] {
  // Ensure all 8 statuses are included at least once
  const list = [...allStatuses];
  while (list.length < total) {
    list.push(getRandomItem(allStatuses));
  }
  // Shuffle list
  return list.sort(() => 0.5 - Math.random());
}

async function main() {
  const prisma = getPrisma();

  console.log("1. Clearing existing tickets, comments, notes, and attachments...");
  const deletedPublicComments = await prisma.publicComment.deleteMany({});
  const deletedInternalNotes = await prisma.internalNote.deleteMany({});
  const deletedAttachments = await prisma.attachment.deleteMany({});
  const deletedTickets = await prisma.ticket.deleteMany({});
  console.log(
    `Cleared ${deletedPublicComments.count} public comments, ${deletedInternalNotes.count} internal notes, ${deletedAttachments.count} attachments, and ${deletedTickets.count} tickets.`
  );

  console.log("\n2. Fetching database entities...");
  const categories = await prisma.category.findMany({ where: { isActive: true } });
  const relatedSystems = await prisma.relatedSystem.findMany({ where: { isActive: true } });
  const requesters = await prisma.user.findMany({ where: { role: "REQUESTER", isActive: true } });
  const staffUsers = await prisma.user.findMany({
    where: { role: { in: ["IT_STAFF", "ADMINISTRATOR"] }, isActive: true },
  });

  if (categories.length === 0 || relatedSystems.length === 0 || requesters.length === 0) {
    throw new Error("Missing categories, related systems, or requesters in DB. Please run prisma seed first.");
  }

  console.log(
    `Found ${categories.length} categories, ${relatedSystems.length} systems, ${requesters.length} requesters, and ${staffUsers.length} staff members.`
  );

  const shuffledTemplates = [...ticketTemplates].sort(() => 0.5 - Math.random());
  const statuses = generateStatusesList(20);
  const year = new Date().getFullYear();

  console.log("\n3. Creating 20 randomized tickets with all statuses, public comments, internal notes, and attachments...\n");

  const createdTickets = [];

  for (let i = 0; i < 20; i++) {
    const template = shuffledTemplates[i % shuffledTemplates.length];
    const category = getRandomItem(categories);
    const system = getRandomItem(relatedSystems);
    const requester = getRandomItem(requesters);
    const requestedPriority = getRandomItem(priorities);
    const itPriority = getRandomItem(priorities);
    const status = statuses[i];

    // Assign owner for non-New tickets, or randomly
    let ownerId: number | null = null;
    if (status !== "New" && staffUsers.length > 0) {
      ownerId = getRandomItem(staffUsers).id;
    } else if (Math.random() > 0.5 && staffUsers.length > 0) {
      ownerId = getRandomItem(staffUsers).id;
    }

    const ticketNumber = `TKT-${year}-${String(i + 1).padStart(6, "0")}`;
    const isResolvedOrClosed = status === "Resolved" || status === "Closed";

    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber,
        requesterId: requester.id,
        ownerId,
        categoryId: category.id,
        relatedSystemId: system.id,
        summary: template.summary,
        description: template.description,
        requestedPriority,
        itPriority,
        currentStatus: status,
        requesterResolvedIndicated: isResolvedOrClosed ? Math.random() > 0.3 : false,
        requesterResolvedAt: isResolvedOrClosed ? new Date() : null,
      },
      include: {
        category: true,
        relatedSystem: true,
        requester: true,
        owner: true,
      },
    });

    // Seed Public Comments (0 to 3 comments)
    const numPublicComments = getRandomInt(0, 3);
    for (let c = 0; c < numPublicComments; c++) {
      const isStaffAuthor = c % 2 === 1 && staffUsers.length > 0;
      const author = isStaffAuthor ? getRandomItem(staffUsers) : requester;
      const content = isStaffAuthor
        ? getRandomItem(samplePublicCommentsStaff)
        : getRandomItem(samplePublicCommentsRequester);

      await prisma.publicComment.create({
        data: {
          ticketId: ticket.id,
          authorId: author.id,
          content,
        },
      });
    }

    // Seed Internal Notes (0 to 2 notes, authored by staff)
    const numInternalNotes = getRandomInt(0, 2);
    if (staffUsers.length > 0) {
      for (let n = 0; n < numInternalNotes; n++) {
        const staffAuthor = getRandomItem(staffUsers);
        const content = getRandomItem(sampleInternalNotes);

        await prisma.internalNote.create({
          data: {
            ticketId: ticket.id,
            authorId: staffAuthor.id,
            content,
          },
        });
      }
    }

    // Seed Attachments (0 to 2 attachments)
    const numAttachments = getRandomInt(0, 2);
    for (let a = 0; a < numAttachments; a++) {
      const att = getRandomItem(sampleAttachments);
      await prisma.attachment.create({
        data: {
          ticketId: ticket.id,
          originalFileName: att.originalFileName,
          storedFileName: `${ticket.ticketNumber}_${a + 1}_${att.storedFileName}`,
          fileSize: att.fileSize,
          mimeType: att.mimeType,
        },
      });
    }

    createdTickets.push(ticket);
    console.log(
      `[Ticket #${i + 1}] Code: ${ticket.ticketNumber} | Status: ${ticket.currentStatus} | Requester: ${ticket.requester.name} | Category: ${ticket.category.name} | Priority: ${ticket.requestedPriority} | Comments: ${numPublicComments} | Notes: ${numInternalNotes} | Attachments: ${numAttachments}`
    );
  }

  console.log("\nSuccessfully recreated database with 20 tickets covering all statuses!");
}

main()
  .catch((e) => {
    console.error("Error executing reset script:", e);
    process.exit(1);
  })
  .finally(async () => {
    await getPrisma().$disconnect();
  });

