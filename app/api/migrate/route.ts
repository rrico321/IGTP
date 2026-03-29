import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";
import path from "path";

// POST /api/migrate — creates tables and seeds initial data.
// Only available in development or when MIGRATE_SECRET matches.
export async function POST(request: Request) {
  const secret = process.env.MIGRATE_SECRET;
  if (process.env.NODE_ENV !== "development") {
    const { secret: provided } = await request.json().catch(() => ({}));
    if (!secret || provided !== secret) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const url = process.env.DATABASE_URL;
  if (!url) {
    return Response.json({ error: "DATABASE_URL is not set" }, { status: 500 });
  }

  const sql = neon(url);
  const schemaPath = path.join(process.cwd(), "lib", "schema.sql");
  const schema = readFileSync(schemaPath, "utf-8");

  // Strip all SQL comments, then split on semicolons
  const cleaned = schema.replace(/--[^\n]*/g, "");
  const statements = cleaned
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const results: string[] = [];
  const errors: string[] = [];
  for (const stmt of statements) {
    try {
      await sql`${sql.unsafe(stmt)}`;
      results.push(stmt.split("\n").filter(Boolean)[0]?.substring(0, 60) ?? "");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`${stmt.split("\n").filter(Boolean)[0]?.substring(0, 40)}: ${msg}`);
    }
  }

  return Response.json({ ok: true, ran: results.length, errors, statements: results });
}
