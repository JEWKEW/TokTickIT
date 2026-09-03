import { getPrisma } from "../src/prisma.js";

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

const requesters = [
  { name: "Alice Johnson", email: "alice@toktickit.io", isActive: true },
  { name: "Bob Smith", email: "bob@toktickit.io", isActive: true },
  { name: "Charlie Davis", email: "charlie@toktickit.io", isActive: true },
  { name: "Diana Prince", email: "diana@toktickit.io", isActive: true },
  { name: "Evan Wright", email: "evan@toktickit.io", isActive: false },
];

async function main() {
  const prisma = getPrisma();

  for (const name of categories) {
    await prisma.category.upsert({
      where: { name },
      update: { isActive: true },
      create: { name, isActive: true },
    });
  }

  for (const name of relatedSystems) {
    await prisma.relatedSystem.upsert({
      where: { name },
      update: { isActive: true },
      create: { name, isActive: true },
    });
  }

  for (const user of requesters) {
    await prisma.requesterUser.upsert({
      where: { email: user.email },
      update: { name: user.name, isActive: user.isActive },
      create: { name: user.name, email: user.email, isActive: user.isActive },
    });
  }

  console.log("Database seeded successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await getPrisma().$disconnect();
  });

