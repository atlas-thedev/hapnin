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
