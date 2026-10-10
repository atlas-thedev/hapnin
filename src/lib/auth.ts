import crypto from "node:crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "hapnin_admin";
const MAX_AGE = 60 * 60 * 12;

const secret = () => process.env.SESSION_SECRET || "dev-only-secret";
const sign = (value: string) => crypto.createHmac("sha256", secret()).update(value).digest("base64url");

export function createSession() {
  const exp = String(Date.now() + MAX_AGE * 1000);
  return { value: `${exp}.${sign(exp)}`, maxAge: MAX_AGE };
}

function verify(token?: string) {
  if (!token) return false;
  const [exp, mac] = token.split(".");
  if (!exp || !mac || Number(exp) < Date.now()) return false;
  const expected = Buffer.from(sign(exp));
  const given = Buffer.from(mac);
  return expected.length === given.length && crypto.timingSafeEqual(expected, given);
}

export function checkPassword(input: string) {
  const a = crypto.createHash("sha256").update(input).digest();
  const b = crypto.createHash("sha256").update(process.env.ADMIN_PASSWORD || "").digest();
  return Boolean(process.env.ADMIN_PASSWORD) && crypto.timingSafeEqual(a, b);
}

export async function isAdmin() {
  const jar = await cookies();
  return verify(jar.get(ADMIN_COOKIE)?.value);
}
