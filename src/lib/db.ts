import { Pool, types } from "pg";

// Keep timestamps as ISO strings so they pass cleanly from server to client components.
types.setTypeParser(1184, (v) => new Date(v).toISOString());

const globalForPg = globalThis as unknown as { pgPool?: Pool };

export const pool =
  globalForPg.pgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 30_000,
  });

globalForPg.pgPool = pool;

export async function sql<T = Record<string, unknown>>(text: string, params: unknown[] = []): Promise<T[]> {
  const res = await pool.query(text, params);
  return res.rows as T[];
}
