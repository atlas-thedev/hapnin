import { z } from "zod";
import { CATEGORY_KEYS } from "./categories";

export const registrationSchema = z.object({
  name: z.string().trim().min(2, "Tell us your name").max(80),
  email: z.string().trim().email("That email doesn't look right").max(120),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
  school: z.string().trim().max(80).optional().or(z.literal("")),
  grade: z.string().trim().max(10).optional().or(z.literal("")),
  role: z.enum(["student", "parent", "teacher", "guest"]).default("student"),
  seats: z.coerce.number().int().min(1).max(6).default(1),
});

const isoDate = z.string().refine((v) => !Number.isNaN(Date.parse(v)), "Invalid date");

export const eventSchema = z
  .object({
    title: z.string().trim().min(3).max(100),
    slug: z
      .string()
      .trim()
      .toLowerCase()
      .regex(/^[a-z0-9-]+$/, "Slug can only use a-z, 0-9 and dashes")
      .max(60)
      .optional()
      .or(z.literal("")),
    tagline: z.string().trim().max(140).default(""),
    description: z.string().trim().max(4000).default(""),
    category: z.enum(CATEGORY_KEYS as [string, ...string[]]),
    venue: z.string().trim().min(2).max(120),
    organizer: z.string().trim().max(120).default(""),
    starts_at: isoDate,
    ends_at: isoDate,
    cover: z.string().trim().max(500).default("/img/ict.webp"),
    capacity: z.coerce.number().int().min(1).max(100000),
    price: z.coerce.number().int().min(0).max(1000000).default(0),
    featured: z.coerce.boolean().default(false),
    status: z.enum(["draft", "published", "cancelled"]).default("published"),
  })
  .refine((v) => Date.parse(v.ends_at) >= Date.parse(v.starts_at), { message: "End time must be after the start", path: ["ends_at"] });

export const announcementSchema = z.object({
  title: z.string().trim().min(3).max(120),
  body: z.string().trim().min(3).max(2000),
  priority: z.enum(["normal", "important", "urgent"]).default("normal"),
  pinned: z.coerce.boolean().default(false),
  event_id: z.coerce.number().int().positive().nullable().optional(),
});

export const updateSchema = z.object({
  kind: z.enum(["update", "score", "highlight"]).default("update"),
  body: z.string().trim().min(2).max(1000),
  image: z.string().trim().max(500).optional().or(z.literal("")),
});

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
