# Hapnin

**What's hapnin' at school.** Hapnin is an events hub for a school community: one place for announcements, event pages, a shared calendar, free online tickets and live updates while an event is running.

Built for the **BTUI'26 Web Development** competition (Royal College Computer Society).

**Live:** https://ss.playnative.fun

---

## Why

School events usually live in five places at once: a WhatsApp forward, a notice board photo, a Google Form, an Instagram story and someone's memory. Students miss things, organisers count heads on paper and parents never know what time the match ends. Hapnin puts the whole lifecycle in one link:

1. **Announce** – organisers post an event and pinned announcements.
2. **Plan** – everyone sees it on the calendar with a live countdown and can add it to Google Calendar / iCal.
3. **Register** – students grab a free ticket with a QR code (capacity limits, no double bookings).
4. **Check in** – organisers scan or type the ticket code at the door.
5. **Follow live** – score updates and highlights stream to every open page in real time.

## Features

**For students & parents**
- Home page with what's next, a live feed, featured events and the latest announcements
- Events list with category filters, search and upcoming / live / past views
- Event pages: countdown, seats-left bar (updates live), venue map, related events, "hype" button
- One-click registration → QR ticket, add to Google Calendar, download `.ics`, share
- Month and agenda calendar views (multi-day events included)
- Live page – every update from every running event, pushed over Server-Sent Events
- "My tickets" – look up all your tickets by email; printable ticket page

**For organisers** (`/admin`, password protected)
- Create / edit / delete events (cover image, venue, capacity, price label, featured flag, status)
- Post, pin and remove announcements
- Push live updates to an event (instantly appears on every open page)
- Door check-in by ticket code or scanned QR link
- Registrations table with CSV export

## Tech stack

| Layer | What |
| --- | --- |
| Framework | Next.js 15 (App Router, server components, route handlers), React 19, TypeScript |
| Styling | Tailwind CSS v4, custom design tokens |
| Motion | GSAP 3 (ScrollTrigger, SplitText), Lenis smooth scroll, Motion for small UI transitions |
| Database | PostgreSQL via `pg` (plain SQL, no ORM) |
| Validation | zod |
| Realtime | Server-Sent Events (`/api/stream`) with an in-process event bus |
| Tickets | `qrcode` (SVG QR codes), canvas-confetti |
| Hosting | Ubuntu VPS, PM2, Nginx reverse proxy, Let's Encrypt SSL |

Fonts: Bricolage Grotesque, Instrument Serif, Geist and Geist Mono.

The visual direction came from studying recent award-winning sites (Awwwards Site of the Day picks) and the motion libraries they ship. Notes are in [`docs/design-research.md`](docs/design-research.md).

## Project structure

```
db/schema.sql          tables: events, registrations, announcements, updates
scripts/migrate.mjs    applies the schema
scripts/seed.mjs       demo data (dates are relative to "now")
src/app/               pages + API route handlers
src/components/        UI and motion components
src/lib/               db pool, queries, auth, validation, realtime bus
public/img/            event cover images
```

## API

All endpoints return JSON unless noted. Admin endpoints need the session cookie from `/api/admin/login`.

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/api/health` | DB health check |
| GET | `/api/events` | `?category=&q=&when=upcoming\|live\|past\|all` |
| POST | `/api/events` | admin – create event |
| GET / PATCH / DELETE | `/api/events/:slug` | PATCH/DELETE are admin only |
| POST | `/api/events/:slug/register` | `{ name, email, phone?, school?, grade?, role }` → ticket. Capacity is checked inside a row lock; duplicate emails are rejected; rate limited |
| POST | `/api/events/:slug/hype` | +1 hype |
| GET | `/api/events/:slug/ics` | calendar file (`text/calendar`) |
| GET / POST | `/api/events/:slug/updates` | live updates (POST is admin) |
| DELETE | `/api/updates/:id` | admin |
| GET / POST | `/api/announcements` | POST is admin |
| PATCH / DELETE | `/api/announcements/:id` | admin – pin / remove |
| GET | `/api/tickets?email=` | tickets for an email |
| GET | `/api/tickets/:code` | single ticket |
| GET | `/api/stream` | Server-Sent Events: `update`, `announcement`, `seats`, `hype` |
| POST | `/api/admin/login` / `logout` | password login, signed HTTP-only cookie |
| GET | `/api/admin/registrations` | `?format=csv` for export |
| POST | `/api/admin/checkin` | `{ code }` |

## Running locally

Requirements: Node 20+ and PostgreSQL 14+.

```bash
git clone <repo-url> hapnin && cd hapnin
npm install

# create a database
createdb hapnin

# configure
cp .env.example .env
#   DATABASE_URL=postgres://user:pass@localhost:5432/hapnin
#   ADMIN_PASSWORD=whatever-you-like
#   SESSION_SECRET=any-long-random-string
#   NEXT_PUBLIC_SITE_URL=http://localhost:3600

npm run db:migrate
npm run db:seed      # optional demo data

npm run dev          # http://localhost:3600
```

Production build:

```bash
npm run build
npm start            # or: pm2 start ecosystem.config.cjs
```

The organiser dashboard is at `/admin` and uses `ADMIN_PASSWORD`.

## Deployment notes

The live site runs on a single VPS:

- `next start` on `127.0.0.1:3600`, kept alive by PM2 (`ecosystem.config.cjs`, `TZ=Asia/Colombo`)
- Nginx proxies the domain to the app. The `/api/stream` location has `proxy_buffering off` so SSE messages arrive instantly
- SSL by certbot

Because the realtime bus lives in memory, run a single app instance (or swap the bus for Postgres `LISTEN/NOTIFY` / Redis if scaling out).

## Accessibility & performance

- Respects `prefers-reduced-motion` (smooth scroll and heavy animations are switched off)
- Semantic landmarks, focus states and labelled form controls
- Responsive from 360px phones up to wide desktops
- Images served as WebP with small variants for cards

---

Made by Navidu Sathsara for BTUI'26.
