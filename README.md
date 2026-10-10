# Hapnin

What's hapnin' at school. An events site for a school: event pages, a calendar, free tickets with QR codes, and live score updates while something is running.

I built this for the BTUI'26 web dev competition (Royal College Computer Society).

Live: https://hapnin.playnative.fun

## The problem

At school, info about an event is all over the place. Someone forwards a poster on WhatsApp, there's a Google Form for names, the time is on an Instagram story and the venue changes on the day. People miss things and organisers end up counting heads on paper.

So the idea is one link per event that covers everything from the announcement to the final score:

1. Announce it (event page + pinned announcements)
2. Put it on the calendar (countdown, Google Calendar / .ics)
3. Register (free ticket with a QR code, capacity limits, no double bookings)
4. Check people in at the door (scan the QR or type the code)
5. Follow it live (updates show up on every open page without refreshing)

## What's in it

For students and parents:

- Home page: next event countdown, what's live, featured events, latest news
- Events list with category filters, search, and upcoming / live / past
- Event page: countdown, seats left (updates live), venue map, related events, a hype button
- Register in one go and get a QR ticket, by email too
- Month and agenda calendar
- Live page with updates from every running event
- My tickets: sign in with your email (we send you a 6 digit code, no passwords) and see all your tickets, upcoming and past

For organisers (`/admin`, password protected):

- Create, edit and delete events
- Post, pin and remove announcements
- Push live updates to an event
- Check-in at the door
- See registrations and export them as CSV

A couple of small rules I added after testing with friends:

- **One hype per person.** It's tied to your account if you're signed in, otherwise to a cookie on that device. Tapping again takes it back.
- **Tickets are private.** The first version let you look up tickets by typing any email, which meant anyone could see anyone's tickets. Now you have to sign in with a code sent to that email.

## Stack

- Next.js 15 (App Router) + React 19 + TypeScript
- Tailwind CSS v4
- GSAP (ScrollTrigger, SplitText), Lenis for smooth scroll, Motion for small UI bits
- PostgreSQL with plain SQL through `pg` (no ORM)
- zod for validating input
- Server-Sent Events for the live stuff (`/api/stream`)
- Resend for emails (sign-in codes and tickets)
- `qrcode` for the QR codes
- Hosted on a VPS with PM2 + Nginx, behind Cloudflare, SSL from Let's Encrypt

Fonts: Bricolage Grotesque, Instrument Serif, Geist, Geist Mono.

Before designing anything I went through a bunch of recent Awwwards Site of the Day winners to see what they do with type and motion. My notes are in [docs/design-research.md](docs/design-research.md).

Photos are real ones from Wikimedia Commons under open licences. Who took what is listed on the [/credits](https://hapnin.playnative.fun/credits) page (and in `src/lib/credits.ts`).

## Folders

```
db/schema.sql        all the tables
scripts/migrate.mjs  runs schema.sql
scripts/seed.mjs     demo events (dates are relative to today so the demo never goes stale)
src/app/             pages and API routes
src/components/      UI + animation components
src/lib/             db, queries, sessions, email, validation, realtime bus
public/img/          event photos (webp, with -sm versions for cards)
```

Tables: `events`, `registrations`, `announcements`, `updates`, `hypes`, `users`, `login_codes`, `sessions`.

## API

Everything returns JSON unless it says otherwise. Admin routes need the admin cookie from `/api/admin/login`.

| Method | Path | What it does |
| --- | --- | --- |
| GET | `/api/health` | checks the DB |
| GET | `/api/events` | list, `?category=&q=&when=upcoming\|live\|past\|all` |
| POST | `/api/events` | admin, create |
| GET / PATCH / DELETE | `/api/events/:slug` | PATCH and DELETE are admin |
| POST | `/api/events/:slug/register` | get a ticket. Seats are checked inside a row lock so two people can't grab the last seat. Same email twice is rejected. Rate limited |
| GET / POST | `/api/events/:slug/hype` | GET = count + whether you hyped, POST = toggle |
| GET | `/api/events/:slug/ics` | calendar file |
| GET / POST | `/api/events/:slug/updates` | live updates (POST is admin) |
| DELETE | `/api/updates/:id` | admin |
| GET / POST | `/api/announcements` | POST is admin |
| PATCH / DELETE | `/api/announcements/:id` | admin, pin / remove |
| POST | `/api/auth/start` | `{ email }`, emails a 6 digit code |
| POST | `/api/auth/verify` | `{ email, code }`, sets the session cookie |
| GET | `/api/auth/me` | who's signed in (or `null`) |
| POST | `/api/auth/logout` | |
| GET | `/api/tickets` | your tickets, needs sign-in |
| GET | `/api/tickets/:code` | one ticket |
| GET | `/api/tickets/:code/qr` | QR code as PNG (used in the email) |
| GET | `/api/stream` | SSE: `update`, `announcement`, `seats`, `hype` |
| POST | `/api/admin/login`, `/api/admin/logout` | admin password login |
| GET | `/api/admin/registrations` | add `?format=csv` to download |
| POST | `/api/admin/checkin` | `{ code }` |

About the sign-in codes: they're stored hashed, expire after 10 minutes and die after 5 wrong tries. Sessions last 30 days in an http-only cookie.

## Running it yourself

You need Node 20+ and PostgreSQL 14+.

```bash
git clone https://github.com/<you>/hapnin.git
cd hapnin
npm install
createdb hapnin
cp .env.example .env
```

Fill in `.env`:

```
DATABASE_URL=postgres://user:pass@localhost:5432/hapnin
ADMIN_PASSWORD=pick-something
SESSION_SECRET=any-long-random-string
NEXT_PUBLIC_SITE_URL=http://localhost:3600
RESEND_API_KEY=re_...            # from resend.com, needs a verified domain
MAIL_FROM=Hapnin <tickets@yourdomain.com>
```

Then:

```bash
npm run db:migrate
npm run db:seed    # optional, adds demo events
npm run dev        # http://localhost:3600
```

If you leave `RESEND_API_KEY` empty, the sign-in code gets printed in the server console instead of emailed, which is handy for local dev.

For production: `npm run build` then `npm start` (or `pm2 start ecosystem.config.cjs`).

## Deploy notes

- The app runs on `127.0.0.1:3600` with PM2 (`TZ=Asia/Colombo` so times are right)
- Nginx sits in front. `/api/stream` has `proxy_buffering off` or the live updates get stuck in a buffer
- Static files and images get long cache headers, gzip is on

The live update bus is in memory, so it only works with one app instance. If this ever needed to scale I'd move it to Postgres `LISTEN/NOTIFY` or Redis.

## Accessibility and speed

- Turns off smooth scroll and the heavy animations if you have `prefers-reduced-motion` on
- Proper landmarks, labels and visible focus states
- Tested from 360px phones up to big desktops
- Images are WebP, lazy loaded below the fold, with smaller versions for cards

## Things I'd add next

- Proper QR scanning with the camera on the admin check-in page
- Paid tickets
- Organiser accounts per club instead of one admin password
