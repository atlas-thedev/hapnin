create table if not exists events (
  id          serial primary key,
  slug        text not null unique,
  title       text not null,
  tagline     text not null default '',
  description text not null default '',
  category    text not null,
  venue       text not null,
  organizer   text not null default '',
  starts_at   timestamptz not null,
  ends_at     timestamptz not null,
  cover       text not null default '/img/ict.webp',
  capacity    integer not null default 200 check (capacity > 0),
  price       integer not null default 0 check (price >= 0),
  featured    boolean not null default false,
  status      text not null default 'published' check (status in ('draft', 'published', 'cancelled')),
  hype        integer not null default 0,
  created_at  timestamptz not null default now(),
  check (ends_at >= starts_at)
);

create index if not exists events_starts_at_idx on events (starts_at);
create index if not exists events_category_idx on events (category);

create table if not exists registrations (
  id            serial primary key,
  event_id      integer not null references events (id) on delete cascade,
  code          text not null unique,
  name          text not null,
  email         text not null,
  phone         text,
  school        text,
  grade         text,
  role          text not null default 'student' check (role in ('student', 'parent', 'teacher', 'guest')),
  seats         integer not null default 1 check (seats between 1 and 6),
  checked_in_at timestamptz,
  created_at    timestamptz not null default now()
);

create index if not exists registrations_event_idx on registrations (event_id);
create index if not exists registrations_email_idx on registrations (lower(email));
create unique index if not exists registrations_unique_email on registrations (event_id, lower(email));

create table if not exists announcements (
  id         serial primary key,
  title      text not null,
  body       text not null,
  priority   text not null default 'normal' check (priority in ('normal', 'important', 'urgent')),
  pinned     boolean not null default false,
  event_id   integer references events (id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists updates (
  id         serial primary key,
  event_id   integer not null references events (id) on delete cascade,
  kind       text not null default 'update' check (kind in ('update', 'score', 'highlight')),
  body       text not null,
  image      text,
  created_at timestamptz not null default now()
);

create index if not exists updates_event_idx on updates (event_id, created_at desc);

-- One hype per device per event. The device id lives in a long-lived cookie.
create table if not exists hypes (
  event_id   integer not null references events(id) on delete cascade,
  device_id  text not null,
  created_at timestamptz not null default now(),
  primary key (event_id, device_id)
);

-- Accounts are just a verified email. No passwords: you sign in with a code we email you.
create table if not exists users (
  id         serial primary key,
  email      text not null,
  name       text,
  created_at timestamptz not null default now()
);
create unique index if not exists users_email_key on users (lower(email));

create table if not exists login_codes (
  id         serial primary key,
  email      text not null,
  code_hash  text not null,
  attempts   integer not null default 0,
  expires_at timestamptz not null,
  used_at    timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists login_codes_email_idx on login_codes (lower(email), created_at desc);

create table if not exists sessions (
  token_hash text primary key,
  user_id    integer not null references users (id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
