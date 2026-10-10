import { NextResponse } from "next/server";
import type { ZodError } from "zod";
import { isAdmin } from "./auth";

export const json = (data: unknown, status = 200) => NextResponse.json(data, { status });
export const fail = (message: string, status = 400) => NextResponse.json({ error: message }, { status });

export const zodFail = (err: ZodError) => fail(err.issues[0]?.message ?? "Invalid input", 422);

export async function requireAdmin() {
  return (await isAdmin()) ? null : fail("Not authorised", 401);
}

// Very small in-memory limiter — good enough for a single instance.
// server එක restart උනොත් ගණන් reset වෙනවා, ඒත් මේ project එකට ඒ ඇති
const hits = new Map<string, { n: number; reset: number }>();
export function rateLimit(key: string, limit = 10, windowMs = 60_000) {
  const now = Date.now();
  const entry = hits.get(key);
  if (!entry || entry.reset < now) {
    hits.set(key, { n: 1, reset: now + windowMs });
    return true;
  }
  entry.n++;
  return entry.n <= limit;
}

export const clientIp = (req: Request) =>
  req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
