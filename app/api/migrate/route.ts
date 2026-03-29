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

  // Split on semicolons, strip comment-only lines, run each statement
  const statements = schema
    .split(";")
    .map((s) =>
      s
        .split("\n")
        .filter((line) => !line.trimStart().startsWith("--"))
        .join("\n")
        .trim()
    )
    .filter((s) => s.length > 0);

  const results: string[] = [];
  for (const stmt of statements) {
    await sql.unsafe(stmt);
    results.push(stmt.split("\n")[0].substring(0, 60));
  }

  return Response.json({ ok: true, ran: results.length, statements: results });
}
