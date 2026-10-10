import crypto from "node:crypto";
import { pool, sql } from "./db";
import type { Announcement, EventRow, LiveUpdate, Ticket } from "./types";

const EVENT_COLS = `e.id, e.slug, e.title, e.tagline, e.description, e.category, e.venue, e.organizer,
  e.starts_at, e.ends_at, e.cover, e.capacity, e.price, e.featured, e.status, e.hype,
  coalesce((select sum(r.seats) from registrations r where r.event_id = e.id), 0)::int as taken`;

type EventFilter = {
  category?: string;
  when?: "upcoming" | "past" | "live" | "all";
  q?: string;
  from?: Date;
  to?: Date;
  includeDrafts?: boolean;
  limit?: number;
  offset?: number;
};

export async function listEvents(f: EventFilter = {}) {
  const where: string[] = [];
  const params: unknown[] = [];
  const add = (clause: string, value: unknown) => {
    params.push(value);
    where.push(clause.replace("?", `$${params.length}`));
  };

  if (!f.includeDrafts) where.push(`e.status <> 'draft'`);
  if (f.category) add("e.category = ?", f.category);
  if (f.q) {
    params.push(`%${f.q}%`);
    const i = params.length;
    where.push(`(e.title ilike $${i} or e.tagline ilike $${i} or e.venue ilike $${i})`);
  }
  if (f.from) add("e.ends_at >= ?", f.from);
  if (f.to) add("e.starts_at <= ?", f.to);

  const when = f.when ?? "all";
  if (when === "upcoming") where.push("e.ends_at >= now()");
  if (when === "past") where.push("e.ends_at < now()");
  if (when === "live") where.push("e.starts_at <= now() and e.ends_at >= now()");

  const order = when === "past" ? "e.starts_at desc" : "e.starts_at asc";
  params.push(Math.min(f.limit ?? 100, 200), f.offset ?? 0);

  return sql<EventRow>(
    `select ${EVENT_COLS} from events e
     ${where.length ? "where " + where.join(" and ") : ""}
     order by ${order}
     limit $${params.length - 1} offset $${params.length}`,
    params,
  );
}

export async function getEvent(slug: string) {
  const rows = await sql<EventRow>(`select ${EVENT_COLS} from events e where e.slug = $1`, [slug]);
  return rows[0] ?? null;
}

export async function featuredEvents() {
  return sql<EventRow>(
    `select ${EVENT_COLS} from events e
     where e.status = 'published' and e.ends_at >= now()
     order by e.featured desc, e.starts_at asc limit 6`,
  );
}

export async function nextEvent() {
  const rows = await sql<EventRow>(
    `select ${EVENT_COLS} from events e where e.status = 'published' and e.starts_at > now() order by e.starts_at asc limit 1`,
  );
  return rows[0] ?? null;
}

export async function stats() {
  const [row] = await sql<{ events: number; upcoming: number; tickets: number; hype: number; live: number }>(
    `select
      (select count(*) from events where status <> 'draft')::int as events,
      (select count(*) from events where status = 'published' and ends_at >= now())::int as upcoming,
      (select coalesce(sum(seats), 0) from registrations)::int as tickets,
      (select coalesce(sum(hype), 0) from events)::int as hype,
      (select count(*) from events where status = 'published' and starts_at <= now() and ends_at >= now())::int as live`,
  );
  return row;
}

export async function listAnnouncements(limit = 50) {
  return sql<Announcement>(
    `select a.*, e.slug as event_slug, e.title as event_title
     from announcements a left join events e on e.id = a.event_id
     order by a.pinned desc, a.created_at desc limit $1`,
    [limit],
  );
}

export async function listUpdates(eventId?: number, limit = 40) {
  return sql<LiveUpdate>(
    `select u.*, e.slug as event_slug, e.title as event_title
     from updates u join events e on e.id = u.event_id
     ${eventId ? "where u.event_id = $2" : ""}
     order by u.created_at desc limit $1`,
    eventId ? [limit, eventId] : [limit],
  );
}

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export function ticketCode() {
  const bytes = crypto.randomBytes(6);
  return "HAP-" + Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}

export class RegistrationError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

type NewRegistration = {
  name: string;
  email: string;
  phone?: string;
  school?: string;
  grade?: string;
  role: string;
  seats: number;
};

/** Seat-safe registration: locks the event row so two people can't grab the last seat. */
export async function register(slug: string, input: NewRegistration) {
  const client = await pool.connect();
  try {
    await client.query("begin");
    const { rows } = await client.query(
      `select id, capacity, status, ends_at from events where slug = $1 for update`,
      [slug],
    );
    const event = rows[0];
    if (!event) throw new RegistrationError("Event not found", 404);
    if (event.status !== "published") throw new RegistrationError("Registrations are closed for this event");
    if (new Date(event.ends_at).getTime() < Date.now()) throw new RegistrationError("This event has already ended");

    const taken = await client.query(`select coalesce(sum(seats), 0)::int as n from registrations where event_id = $1`, [event.id]);
    const left = event.capacity - taken.rows[0].n;
    if (left < input.seats) {
      throw new RegistrationError(left > 0 ? `Only ${left} seat${left > 1 ? "s" : ""} left` : "Sold out — sorry!", 409);
    }

    const dupe = await client.query(`select code from registrations where event_id = $1 and lower(email) = lower($2)`, [event.id, input.email]);
    if (dupe.rows[0]) throw new RegistrationError("You're already registered with this email", 409);

    const code = ticketCode();
    await client.query(
      `insert into registrations (event_id, code, name, email, phone, school, grade, role, seats)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [event.id, code, input.name, input.email, input.phone || null, input.school || null, input.grade || null, input.role, input.seats],
    );
    await client.query("commit");
    return { code, eventId: event.id as number, taken: taken.rows[0].n + input.seats };
  } catch (err) {
    await client.query("rollback");
    throw err;
  } finally {
    client.release();
  }
}

const TICKET_COLS = `r.code, r.name, r.email, r.role, r.seats, r.checked_in_at, r.created_at,
  e.slug as event_slug, e.title as event_title, e.venue as event_venue, e.cover as event_cover,
  e.starts_at, e.ends_at, e.category`;

export async function getTicket(code: string) {
  const rows = await sql<Ticket>(
    `select ${TICKET_COLS} from registrations r join events e on e.id = r.event_id where r.code = $1`,
    [code.toUpperCase()],
  );
  return rows[0] ?? null;
}

export async function ticketsByEmail(email: string) {
  return sql<Ticket>(
    `select ${TICKET_COLS} from registrations r join events e on e.id = r.event_id
     where lower(r.email) = lower($1) order by e.starts_at asc`,
    [email],
  );
}

export async function bumpHype(slug: string, by: number) {
  const rows = await sql<{ id: number; hype: number }>(
    `update events set hype = hype + $2 where slug = $1 and status = 'published' returning id, hype`,
    [slug, by],
  );
  return rows[0] ?? null;
}
