import "./env.mjs";
import pg from "pg";

const H = 3600_000;
const D = 24 * H;
const now = Date.now();
// Anchor future events to 8:00 AM Colombo on a given day offset.
const day = (offset, hour = 8, minute = 0) => {
  const d = new Date(now + offset * D);
  const base = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), hour - 5, minute - 30);
  return new Date(base);
};

const events = [
  {
    slug: "science-expo-26",
    title: "Royal Science Expo",
    tagline: "Fifty projects. One hall. Zero boring.",
    category: "science",
    venue: "Royal College Gymnasium",
    organizer: "Science Society",
    starts_at: new Date(now - 2 * H),
    ends_at: new Date(now + 6 * H),
    cover: "/img/science.webp",
    capacity: 600,
    featured: true,
    hype: 214,
    description:
      "Robotics, renewable energy, chemistry magic and the odd volcano. Students from Grade 6 to 13 show off a year of tinkering, and the judges pick the best three for the national round.\n\nWalk in any time — the hall stays open all day and every stall has a live demo.",
  },
  {
    slug: "btui-ict-day",
    title: "BTUI ICT Day",
    tagline: "Sri Lanka's leading school ICT day is back.",
    category: "tech",
    venue: "Royal College Main Hall",
    organizer: "Royal College Computer Society",
    starts_at: day(3, 8),
    ends_at: day(3, 17),
    cover: "/img/ict.webp",
    capacity: 400,
    featured: true,
    hype: 389,
    description:
      "Algorithms, web development, UI/UX, robotics and the inter-school quiz — all in one day. Competitors arrive by 7:30 AM for check-in. Spectators are welcome after 9:00 AM.\n\nBring your student ID. Laptops are allowed for competitors only.",
  },
  {
    slug: "inter-house-athletics",
    title: "Inter-House Athletics Meet",
    tagline: "Four houses. One trophy. Bragging rights for a year.",
    category: "sports",
    venue: "Royal College Sports Complex",
    organizer: "Physical Education Dept.",
    starts_at: day(6, 7, 30),
    ends_at: day(7, 18),
    cover: "/img/track.webp",
    capacity: 1500,
    featured: true,
    hype: 512,
    description:
      "Two days of track and field across all age groups. Day one is heats and field events, day two is finals and the march past.\n\nParents get reserved seating in the east stand — register to get your pass.",
  },
  {
    slug: "senior-debate-championship",
    title: "Senior Debate Championship",
    tagline: "Motion: this house would ban homework.",
    category: "debate",
    venue: "Navarangahala",
    organizer: "English Debating Society",
    starts_at: day(9, 14),
    ends_at: day(9, 18),
    cover: "/img/debate.webp",
    capacity: 250,
    hype: 133,
    description:
      "The top eight school teams in the province face off in a knockout tournament. Expect sharp rebuttals and some very serious points of information.\n\nSeats are limited, so grab yours early.",
  },
  {
    slug: "western-music-night",
    title: "Western Music Night",
    tagline: "Strings, brass and a drum solo you'll talk about.",
    category: "music",
    venue: "Royal College Auditorium",
    organizer: "Western Music Society",
    starts_at: day(13, 18, 30),
    ends_at: day(13, 21, 30),
    cover: "/img/concert.webp",
    capacity: 450,
    price: 500,
    hype: 301,
    description:
      "The school orchestra, the jazz band and the senior choir share the stage for one night. Proceeds go to new instruments for the junior section.\n\nDoors open at 6:00 PM.",
  },
  {
    slug: "big-match-26",
    title: "The Big Match",
    tagline: "Three days. Two schools. One rivalry.",
    category: "sports",
    venue: "SSC Grounds, Colombo 07",
    organizer: "Cricket Club",
    starts_at: day(20, 9, 30),
    ends_at: day(22, 17),
    cover: "/img/cricket.webp",
    capacity: 3000,
    price: 1000,
    featured: true,
    hype: 977,
    description:
      "The oldest school cricket rivalry in the country. Tent tickets, stand tickets and a lot of noise.\n\nTickets are per person, per day. Old boys can collect passes from the OBA office.",
  },
  {
    slug: "art-exhibition",
    title: "Colour Theory — Art Exhibition",
    tagline: "120 student works. Some of them are for sale.",
    category: "arts",
    venue: "Art Gallery, Block C",
    organizer: "Art Circle",
    starts_at: day(16, 9),
    ends_at: day(18, 16),
    cover: "/img/art.webp",
    capacity: 800,
    hype: 88,
    description:
      "Paintings, sculpture and digital art from across the school. Visitors can vote for the People's Choice award at the gallery entrance.",
  },
  {
    slug: "drama-festival",
    title: "Inter-Class Drama Festival",
    tagline: "Eight plays. Eight classes. One standing ovation.",
    category: "drama",
    venue: "Royal College Auditorium",
    organizer: "Drama Society",
    starts_at: day(27, 15),
    ends_at: day(27, 20),
    cover: "/img/drama.webp",
    capacity: 450,
    price: 300,
    hype: 156,
    description:
      "Every senior class writes, directs and performs a 20-minute play. A panel of guest judges picks the winners on the night.",
  },
  {
    slug: "junior-quiz-night",
    title: "Junior Quiz Night",
    tagline: "Grades 6 to 9 only. Teachers not allowed to help.",
    category: "tech",
    venue: "Library Hall",
    organizer: "Quiz Club",
    starts_at: day(-12, 15),
    ends_at: day(-12, 18),
    cover: "/img/ict.webp",
    capacity: 120,
    hype: 64,
    description: "Six rounds of general knowledge, science and pop culture. Teams of three.",
  },
  {
    slug: "swimming-gala",
    title: "Swimming Gala",
    tagline: "Splash first, ask questions later.",
    category: "sports",
    venue: "School Pool",
    organizer: "Aquatics Club",
    starts_at: day(-25, 8),
    ends_at: day(-25, 14),
    cover: "/img/track.webp",
    capacity: 300,
    hype: 120,
    description: "Annual inter-house swimming gala with relays, freestyle and the famous teachers' race.",
  },
];

const announcements = [
  {
    title: "Science Expo is live right now",
    body: "Doors stay open all day. Follow the live feed for stall highlights and judging results.",
    priority: "urgent",
    pinned: true,
    slug: "science-expo-26",
  },
  {
    title: "ICT Day competitor check-in moves to 7:15 AM",
    body: "Competitors, please arrive 15 minutes earlier than planned. Bring your registration QR code to the main hall entrance.",
    priority: "important",
    pinned: true,
    slug: "btui-ict-day",
  },
  {
    title: "Athletics meet: parent seating",
    body: "Parents with a Hapnin pass get reserved seating in the east stand. Please show your QR code at Gate 2.",
    priority: "normal",
    slug: "inter-house-athletics",
  },
  {
    title: "Big Match tickets on sale",
    body: "Stand tickets are now available online. Tent bookings close two weeks before the match.",
    priority: "important",
    slug: "big-match-26",
  },
  {
    title: "Lost & found",
    body: "A blue water bottle and a calculator were left in the library after Quiz Night. Collect them from the front office.",
    priority: "normal",
  },
];

const updates = [
  { kind: "update", body: "Doors are open! 50 projects are set up across three rows. Start at the robotics corner.", ago: 115 },
  { kind: "highlight", body: "Grade 9 built a solar-powered water purifier from a bucket and old fans. Crowd favourite so far.", image: "/img/science-sm.webp", ago: 80 },
  { kind: "update", body: "Judges have started round one. Results expected around 2:00 PM.", ago: 45 },
  { kind: "score", body: "People's Choice leaderboard: Hydro Bot 142 votes · Wind Farm 98 · Bio Plastic 77", ago: 12 },
];

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
await client.query("begin");
await client.query("truncate updates, announcements, registrations, events restart identity cascade");

const ids = {};
for (const e of events) {
  const { rows } = await client.query(
    `insert into events (slug, title, tagline, description, category, venue, organizer, starts_at, ends_at, cover, capacity, price, featured, hype)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) returning id`,
    [e.slug, e.title, e.tagline, e.description, e.category, e.venue, e.organizer, e.starts_at, e.ends_at, e.cover, e.capacity, e.price ?? 0, e.featured ?? false, e.hype ?? 0],
  );
  ids[e.slug] = rows[0].id;
}

for (const [i, a] of announcements.entries()) {
  await client.query(
    `insert into announcements (title, body, priority, pinned, event_id, created_at) values ($1,$2,$3,$4,$5,$6)`,
    [a.title, a.body, a.priority, a.pinned ?? false, a.slug ? ids[a.slug] : null, new Date(now - (i * 7 + 1) * H)],
  );
}

for (const u of updates) {
  await client.query(`insert into updates (event_id, kind, body, image, created_at) values ($1,$2,$3,$4,$5)`, [
    ids["science-expo-26"], u.kind, u.body, u.image ?? null, new Date(now - u.ago * 60_000),
  ]);
}

// A handful of registrations so the dashboard isn't empty.
const people = ["Kavindu Perera", "Sahan Jayasuriya", "Nethmi Fernando", "Dinuka Silva", "Ravindu Bandara", "Tharushi Wijesinghe"];
let n = 0;
for (const slug of ["btui-ict-day", "inter-house-athletics", "western-music-night", "big-match-26"]) {
  for (const name of people) {
    n++;
    await client.query(
      `insert into registrations (event_id, code, name, email, school, grade, role, seats) values ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [ids[slug], `HAP-${(100000 + n * 7919).toString(36).toUpperCase()}`, name, `${name.split(" ")[0].toLowerCase()}@example.com`, "Royal College", String(8 + (n % 5)), n % 4 === 0 ? "parent" : "student", 1 + (n % 3)],
    );
  }
}

await client.query("commit");
await client.end();
console.log(`seeded ${events.length} events, ${announcements.length} announcements, ${n} registrations`);
