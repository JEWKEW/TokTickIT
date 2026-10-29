import { execFileSync } from "node:child_process";
import { cp, mkdir, mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { seedDatabase } from "../../prisma/seed.js";

const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const lab4MigrationName = "20261007000000_lab4_actions_taken";
const lab4MigrationDir = path.resolve(serverRoot, "prisma", "migrations", lab4MigrationName);
const lab4MigrationSql = path.join(lab4MigrationDir, "migration.sql");
const migrationDatabaseUrl = process.env.LAB4_MIGRATION_TEST_DATABASE_URL;

function isSafeDisposableDatabase(value: string | undefined): value is string {
  if (!value) return false;

  try {
    const parsed = new URL(value);
    const databaseName = decodeURIComponent(parsed.pathname.replace(/^\//, "")).toLowerCase();
    return ["localhost", "127.0.0.1", "::1"].includes(parsed.hostname)
      && /(test|lab4)/.test(databaseName);
  } catch {
    return false;
  }
}

function runPrisma(schemaPath: string, databaseUrl: string): void {
  const cliPath = path.resolve(serverRoot, "node_modules", "prisma", "build", "index.js");
  execFileSync(process.execPath, [cliPath, "migrate", "deploy", "--schema", schemaPath], {
    cwd: serverRoot,
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: "pipe",
  });
}

describe("Lab 4 additive database migration", () => {
  it("adds ActionTaken and query indexes without destructive DDL", async () => {
    const sql = await readFile(lab4MigrationSql, "utf8");

    expect(sql).toContain('CREATE TABLE "ActionTaken"');
    expect(sql).toContain('"actionDateTime" TIMESTAMP(3) NOT NULL');
    expect(sql).toContain('"ActionTaken_ticketId_fkey"');
    expect(sql).toContain('"ActionTaken_performedById_fkey"');
    expect(sql).toContain('CREATE INDEX "Ticket_requesterId_updatedAt_idx"');
    expect(sql).toContain('CREATE INDEX "Ticket_currentStatus_updatedAt_idx"');
    expect(sql).not.toMatch(/\bDROP\s+(TABLE|COLUMN|TYPE)\b/i);
    expect(sql).not.toMatch(/\bDELETE\s+FROM\b/i);
  });

  it.skipIf(!isSafeDisposableDatabase(migrationDatabaseUrl))(
    "preserves Lab 3 data, supports ActionTaken relationships, safe redeploy, and repeatable seed",
    async () => {
      const rawUrl = migrationDatabaseUrl as string;
      const parsedBaseUrl = new URL(rawUrl);
      const databaseName = decodeURIComponent(parsedBaseUrl.pathname.replace(/^\//, "")).toLowerCase();
      expect(["localhost", "127.0.0.1", "::1"]).toContain(parsedBaseUrl.hostname);
      expect(databaseName).toMatch(/(test|lab4)/);

      const schemaName = `lab4_migration_test_${process.pid}_${Date.now()}`;
      const isolatedUrl = new URL(rawUrl);
      isolatedUrl.searchParams.set("schema", schemaName);
      const cleanupUrl = new URL(rawUrl);
      cleanupUrl.searchParams.set("schema", "public");

      const tempRoot = await mkdtemp(path.join(os.tmpdir(), "toktickit-lab4-migration-"));
      const tempPrismaDir = path.join(tempRoot, "prisma");
      const tempMigrationsDir = path.join(tempPrismaDir, "migrations");
      const tempSchemaPath = path.join(tempPrismaDir, "schema.prisma");
      const sourceMigrationsDir = path.resolve(serverRoot, "prisma", "migrations");
      const cleanupClient = new PrismaClient({ datasourceUrl: cleanupUrl.toString() });
      let dataClient: PrismaClient | undefined;

      try {
        await cleanupClient.$executeRawUnsafe(`CREATE SCHEMA "${schemaName}"`);
        await mkdir(tempMigrationsDir, { recursive: true });
        await cp(path.join(serverRoot, "prisma", "schema.prisma"), tempSchemaPath);
        await cp(path.join(sourceMigrationsDir, "migration_lock.toml"), path.join(tempMigrationsDir, "migration_lock.toml"));

        const migrationEntries = await readdir(sourceMigrationsDir, { withFileTypes: true });
        const priorMigrations = migrationEntries
          .filter((entry) => entry.isDirectory() && entry.name !== lab4MigrationName)
          .sort((left, right) => left.name.localeCompare(right.name));

        for (const entry of priorMigrations) {
          await cp(path.join(sourceMigrationsDir, entry.name), path.join(tempMigrationsDir, entry.name), { recursive: true });
        }

        // Start with the exact repository migration history up through Lab 3.
        runPrisma(tempSchemaPath, isolatedUrl.toString());
        dataClient = new PrismaClient({ datasourceUrl: isolatedUrl.toString() });

        const requester = await dataClient.user.create({
          data: { name: "Migration Requester", email: "migration-requester@lab4.test", role: "REQUESTER", mustChangePassword: false },
        });
        const staff = await dataClient.user.create({
          data: { name: "Migration Staff", email: "migration-staff@lab4.test", role: "IT_STAFF", mustChangePassword: false },
        });
        const category = await dataClient.category.create({ data: { name: "Lab 4 Migration Test" } });
        const system = await dataClient.relatedSystem.create({ data: { name: "Lab 4 Migration Test System" } });
        const ticket = await dataClient.ticket.create({
          data: {
            ticketNumber: "TKT-LAB4-MIGRATION-001",
            requesterId: requester.id,
            categoryId: category.id,
            relatedSystemId: system.id,
            summary: "Lab 3 data survives the Lab 4 migration",
            description: "Migration regression fixture.",
            requestedPriority: "High",
            itPriority: "High",
            currentStatus: "In Progress",
          },
        });
        await dataClient.attachment.create({
          data: {
            ticketId: ticket.id,
            originalFileName: "migration.txt",
            storedFileName: "migration-fixture.txt",
            fileSize: 8,
            mimeType: "text/plain",
          },
        });
        await dataClient.publicComment.create({ data: { ticketId: ticket.id, authorId: requester.id, content: "Existing public comment" } });
        await dataClient.internalNote.create({ data: { ticketId: ticket.id, authorId: staff.id, content: "Existing internal note" } });

        const preservedBefore = {
          users: await dataClient.user.count(),
          tickets: await dataClient.ticket.count(),
          attachments: await dataClient.attachment.count(),
          comments: await dataClient.publicComment.count(),
          notes: await dataClient.internalNote.count(),
        };

        await cp(lab4MigrationDir, path.join(tempMigrationsDir, lab4MigrationName), { recursive: true });
        runPrisma(tempSchemaPath, isolatedUrl.toString());

        const preservedAfter = {
          users: await dataClient.user.count(),
          tickets: await dataClient.ticket.count(),
          attachments: await dataClient.attachment.count(),
          comments: await dataClient.publicComment.count(),
          notes: await dataClient.internalNote.count(),
        };
        expect(preservedAfter).toEqual(preservedBefore);
        expect(await dataClient.actionTaken.count()).toBe(0);
        expect(await dataClient.ticket.findUnique({ where: { id: ticket.id }, select: { ticketNumber: true } }))
          .toEqual({ ticketNumber: "TKT-LAB4-MIGRATION-001" });

        const action = await dataClient.actionTaken.create({
          data: {
            ticketId: ticket.id,
            performedById: staff.id,
            actionDateTime: new Date("2026-10-07T09:00:00.000Z"),
            actionDescription: "Verified post-migration relationship",
            result: "Action is linked to the existing Ticket and performer.",
          },
          include: { ticket: true, performedBy: true },
        });
        expect(action.ticket.id).toBe(ticket.id);
        expect(action.performedBy.id).toBe(staff.id);

        // A second deploy is the documented forward-recovery/no-op check.
        runPrisma(tempSchemaPath, isolatedUrl.toString());
        expect(await dataClient.actionTaken.count()).toBe(1);
        expect(await dataClient.ticket.count()).toBe(preservedBefore.tickets);

        // Exercise the production seed twice in the isolated disposable schema.
        for (let run = 0; run < 2; run += 1) {
          await seedDatabase(dataClient);
        }

        const zeroActionTicket = await dataClient.ticket.findUnique({
          where: { ticketNumber: "TKT-2026-000003" },
          include: { actionsTaken: true },
        });
        const oneActionTicket = await dataClient.ticket.findUnique({
          where: { ticketNumber: "TKT-2026-000001" },
          include: { actionsTaken: true },
        });
        const manyActionTicket = await dataClient.ticket.findUnique({
          where: { ticketNumber: "TKT-2026-000002" },
          include: { actionsTaken: true },
        });
        expect(zeroActionTicket?.actionsTaken).toHaveLength(0);
        expect(oneActionTicket?.actionsTaken).toHaveLength(1);
        expect(manyActionTicket?.actionsTaken).toHaveLength(2);
        expect(await dataClient.ticket.count({ where: { requester: { email: "frank@toktickit.io" } } })).toBe(0);
      } finally {
        await dataClient?.$disconnect();
        await cleanupClient.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`);
        await cleanupClient.$disconnect();
        await rm(tempRoot, { recursive: true, force: true });
      }
    },
    120_000,
  );
});
