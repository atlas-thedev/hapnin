export type Category = "sports" | "debate" | "tech" | "music" | "arts" | "science" | "drama";

export type EventRow = {
  id: number;
  slug: string;
  title: string;
  tagline: string;
  description: string;
  category: Category;
  venue: string;
  organizer: string;
  starts_at: string;
  ends_at: string;
  cover: string;
  capacity: number;
  price: number;
  featured: boolean;
  status: "draft" | "published" | "cancelled";
  hype: number;
  taken: number;
};

export type Announcement = {
  id: number;
  title: string;
  body: string;
  priority: "normal" | "important" | "urgent";
  pinned: boolean;
  event_id: number | null;
  event_slug: string | null;
  event_title: string | null;
  created_at: string;
};

export type LiveUpdate = {
  id: number;
  event_id: number;
  event_slug?: string;
  event_title?: string;
  kind: "update" | "score" | "highlight";
  body: string;
  image: string | null;
  created_at: string;
};

export type Ticket = {
  code: string;
  name: string;
  email: string;
  role: string;
  seats: number;
  checked_in_at: string | null;
  created_at: string;
  event_slug: string;
  event_title: string;
  event_venue: string;
  event_cover: string;
  starts_at: string;
  ends_at: string;
  category: Category;
};
