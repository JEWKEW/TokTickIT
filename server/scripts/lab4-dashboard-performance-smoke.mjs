import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import os from "node:os";
import { PrismaClient } from "@prisma/client";

const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const rawDatabaseUrl = process.env.LAB4_MIGRATION_TEST_DATABASE_URL;

function safeDisposableDatabaseUrl(value) {
  if (!value) throw new Error("Set LAB4_MIGRATION_TEST_DATABASE_URL to a local disposable database whose name contains test or lab4.");
  const url = new URL(value);
  const name = decodeURIComponent(url.pathname.replace(/^\//, "")).toLowerCase();
  if (!["localhost", "127.0.0.1", "::1"].includes(url.hostname) || !/(test|lab4)/.test(name)) {
    throw new Error("Refusing to run: the performance smoke only accepts a local database whose name contains test or lab4.");
  }
  return url;
}

const baseUrl = safeDisposableDatabaseUrl(rawDatabaseUrl);
const schemaName = `lab4_perf_${process.pid}_${Date.now()}`;
const isolatedUrl = new URL(baseUrl);
isolatedUrl.searchParams.set("schema", schemaName);
const publicUrl = new URL(baseUrl);
publicUrl.searchParams.set("schema", "public");
const admin = new PrismaClient({ datasourceUrl: publicUrl.toString() });
let dataClient;
let appDisconnect;

function migrateIsolatedSchema() {
  const cliPath = path.resolve(serverRoot, "node_modules", "prisma", "build", "index.js");
  execFileSync(process.execPath, [cliPath, "migrate", "deploy", "--schema", path.join(serverRoot, "prisma", "schema.prisma")], {
    cwd: serverRoot,
    env: { ...process.env, DATABASE_URL: isolatedUrl.toString() },
    stdio: "pipe",
  });
}

async function createLargeFixture() {
  dataClient = new PrismaClient({ datasourceUrl: isolatedUrl.toString() });
  const requester = await dataClient.user.create({ data: { name: "Performance Requester", email: "perf-requester@lab4.test", role: "REQUESTER", mustChangePassword: false } });
  const staff = await dataClient.user.create({ data: { name: "Performance Staff", email: "perf-staff@lab4.test", role: "IT_STAFF", mustChangePassword: false } });
  const category = await dataClient.category.create({ data: { name: "Performance Test" } });
  const system = await dataClient.relatedSystem.create({ data: { name: "Performance Test System" } });
  const statuses = ["New", "Open", "In Progress", "Waiting for Requester", "Resolved", "Closed", "Reopened", "Cancelled"];
  await dataClient.ticket.createMany({ data: Array.from({ length: 500 }, (_, index) => ({
    ticketNumber: `TKT-PERF-${process.pid}-${index + 1}`,
    requesterId: requester.id,
    ownerId: index % 4 === 0 ? null : staff.id,
    categoryId: category.id,
    relatedSystemId: system.id,
    summary: `Performance fixture Ticket ${index + 1}`,
    description: "Isolated dashboard performance smoke fixture.",
    requestedPriority: "Medium",
    itPriority: ["Low", "Medium", "High", "Urgent"][index % 4],
    currentStatus: statuses[index % statuses.length],
  })) });
  const tickets = await dataClient.ticket.findMany({ where: { ticketNumber: { startsWith: `TKT-PERF-${process.pid}-` } }, select: { id: true }, orderBy: { id: "asc" } });
  await dataClient.actionTaken.createMany({ data: Array.from({ length: 2000 }, (_, index) => ({
    ticketId: tickets[index % tickets.length].id,
    performedById: staff.id,
    actionDateTime: new Date(Date.now() - index * 60_000),
    actionDescription: `Performance fixture action ${index + 1}`,
    result: "Recorded for the dashboard performance smoke.",
    followUpRequired: index % 5 === 0,
    followUpNote: index % 5 === 0 ? "Recheck after maintenance." : null,
  })) });
  return { requesterId: requester.id, staffId: staff.id };
}

async function measureFiveRequests(app, endpoint, userId, request) {
  const call = async () => {
    const started = performance.now();
    const response = await request(app).get(endpoint).set("x-user-id", String(userId));
    if (response.status !== 200 || !response.body.success) throw new Error(`${endpoint} returned HTTP ${response.status}`);
    return Math.round((performance.now() - started) * 100) / 100;
  };
  await call(); // Warm-up request, excluded from recorded timings.
  const timingsMs = [];
  for (let index = 0; index < 5; index++) timingsMs.push(await call());
  return timingsMs;
}

try {
  await admin.$executeRawUnsafe(`CREATE SCHEMA "${schemaName}"`);
  migrateIsolatedSchema();
  const { requesterId, staffId } = await createLargeFixture();
  process.env.DATABASE_URL = isolatedUrl.toString();
  const [{ app }, { disconnectPrisma }, supertest] = await Promise.all([
    import("../dist/src/app.js"),
    import("../dist/src/prisma.js"),
    import("supertest"),
  ]);
  appDisconnect = disconnectPrisma;
  const request = supertest.default;
  const fixture = {
    tickets: await dataClient.ticket.count(),
    actionsTaken: await dataClient.actionTaken.count(),
  };
  const results = {
    fixture,
    environment: { platform: `${os.type()} ${os.release()}`, node: process.version },
    thresholdMs: 1000,
    staffDashboardMs: await measureFiveRequests(app, "/api/dashboards/staff", staffId, request),
    requesterDashboardMs: await measureFiveRequests(app, "/api/dashboards/requester", requesterId, request),
  };
  results.allUnderThreshold = [...results.staffDashboardMs, ...results.requesterDashboardMs].every((duration) => duration <= results.thresholdMs);
  console.log(JSON.stringify(results, null, 2));
  if (!results.allUnderThreshold) process.exitCode = 1;
} finally {
  if (appDisconnect) await appDisconnect();
  if (dataClient) await dataClient.$disconnect();
  await admin.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`);
  await admin.$disconnect();
}
