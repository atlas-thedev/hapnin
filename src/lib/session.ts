import crypto from "node:crypto";
import { cookies } from "next/headers";
import { sql } from "./db";

export const SESSION_COOKIE = "hapnin_session";
const SESSION_DAYS = 30;
const CODE_MINUTES = 10;
const MAX_ATTEMPTS = 5; // වැරදි කෝඩ් 5ක් ගැහුවොත් ඒ කෝඩ් එක මැරෙනවා, අලුත් එකක් ඉල්ලන්න ඕන

export type User = { id: number; email: string; name: string | null };

// DB එකේ කෝඩ් එක plain විදිහට තියන්නේ නෑ, hash එක විතරයි
const sha = (s: string) => crypto.createHash("sha256").update(s).digest("hex");

/** Six digits, no leading-zero surprises when people type it. */
const sixDigits = () => String(crypto.randomInt(100000, 1000000));

export async function createLoginCode(email: string) {
  // Recent codes for this address die as soon as a new one is issued.
  await sql(`update login_codes set used_at = now() where lower(email) = lower($1) and used_at is null`, [email]);
  const code = sixDigits();
  await sql(`insert into login_codes (email, code_hash, expires_at) values ($1, $2, now() + make_interval(mins => $3))`, [
    email,
    sha(`${email.toLowerCase()}:${code}`),
    CODE_MINUTES,
  ]);
  return code;
}

export async function codesSentRecently(email: string) {
  const rows = await sql<{ n: number }>(
    `select count(*)::int as n from login_codes where lower(email) = lower($1) and created_at > now() - interval '15 minutes'`,
    [email],
  );
  return rows[0].n;
}

type Check = { ok: true; user: User } | { ok: false; reason: string };

export async function verifyLoginCode(email: string, code: string): Promise<Check> {
  const rows = await sql<{ id: number; code_hash: string; attempts: number; expired: boolean }>(
    `select id, code_hash, attempts, expires_at < now() as expired from login_codes
     where lower(email) = lower($1) and used_at is null order by created_at desc limit 1`,
    [email],
  );
  const row = rows[0];
  if (!row) return { ok: false, reason: "Ask for a new code first." };
  if (row.expired) return { ok: false, reason: "That code has expired. Send a new one." };
  if (row.attempts >= MAX_ATTEMPTS) return { ok: false, reason: "Too many tries. Send a new code." };

  const given = Buffer.from(sha(`${email.toLowerCase()}:${code.trim()}`));
  const match = given.length === row.code_hash.length && crypto.timingSafeEqual(given, Buffer.from(row.code_hash));
  if (!match) {
    await sql(`update login_codes set attempts = attempts + 1 where id = $1`, [row.id]);
    const left = MAX_ATTEMPTS - row.attempts - 1;
    return { ok: false, reason: left > 0 ? `Wrong code. ${left} ${left === 1 ? "try" : "tries"} left.` : "Too many tries. Send a new code." };
  }

  await sql(`update login_codes set used_at = now() where id = $1`, [row.id]);
  const users = await sql<User>(
    `insert into users (email) values ($1)
     on conflict (lower(email)) do update set email = users.email
     returning id, email, name`,
    [email.toLowerCase()],
  );
  return { ok: true, user: users[0] };
}

export async function startSession(userId: number) {
  const token = crypto.randomBytes(32).toString("base64url");
  await sql(`insert into sessions (token_hash, user_id, expires_at) values ($1, $2, now() + make_interval(days => $3))`, [sha(token), userId, SESSION_DAYS]);
  // Housekeeping: old sessions and codes don't need to hang around.
  sql(`delete from sessions where expires_at < now()`).catch(() => {});
  sql(`delete from login_codes where created_at < now() - interval '1 day'`).catch(() => {});

  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DAYS * 86400,
  });
}

export async function currentUser(): Promise<User | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const rows = await sql<User>(
    `select u.id, u.email, u.name from sessions s join users u on u.id = s.user_id
     where s.token_hash = $1 and s.expires_at > now()`,
    [sha(token)],
  );
  return rows[0] ?? null;
}

export async function endSession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await sql(`delete from sessions where token_hash = $1`, [sha(token)]);
  jar.delete(SESSION_COOKIE);
}
