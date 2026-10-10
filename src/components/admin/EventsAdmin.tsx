"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import clsx from "clsx";
import type { EventRow } from "@/lib/types";
import { CATEGORIES, CATEGORY_KEYS, COVERS, thumb } from "@/lib/categories";
import { fmtRange, phaseOf } from "@/lib/time";
import { Button } from "../Button";
import { api, fromLocalInput, toLocalInput } from "./api";

type Draft = {
  title: string;
  slug: string;
  tagline: string;
  description: string;
  category: string;
  venue: string;
  organizer: string;
  starts_at: string;
  ends_at: string;
  cover: string;
  capacity: number;
  price: number;
  featured: boolean;
  status: string;
};

const blank = (): Draft => {
  const start = new Date(Date.now() + 7 * 864e5);
  start.setUTCHours(3, 30, 0, 0);
  return {
    title: "",
    slug: "",
    tagline: "",
    description: "",
    category: "sports",
    venue: "",
    organizer: "",
    starts_at: toLocalInput(start.toISOString()),
    ends_at: toLocalInput(new Date(start.getTime() + 3 * 3600e3).toISOString()),
    cover: COVERS[0],
    capacity: 200,
    price: 0,
    featured: false,
    status: "published",
  };
};

const fromEvent = (e: EventRow): Draft => ({
  ...e,
  starts_at: toLocalInput(e.starts_at),
  ends_at: toLocalInput(e.ends_at),
});

export function EventsAdmin({ events, onChange }: { events: EventRow[]; onChange: () => void }) {
  const [editing, setEditing] = useState<{ slug: string | null; draft: Draft } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!editing) return;
    setBusy(true);
    setError(null);
    const d = editing.draft;
    const body = { ...d, starts_at: fromLocalInput(d.starts_at), ends_at: fromLocalInput(d.ends_at) };
    try {
      if (editing.slug) await api("PATCH", `/api/events/${editing.slug}`, body);
      else await api("POST", "/api/events", body);
      setEditing(null);
      onChange();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (slug: string) => {
    if (!confirm("Delete this event and all its registrations?")) return;
    await api("DELETE", `/api/events/${slug}`);
    onChange();
  };

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setEditing((s) => (s ? { ...s, draft: { ...s.draft, [k]: v } } : s));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <p className="eyebrow">{events.length} events</p>
        <Button onClick={() => setEditing({ slug: null, draft: blank() })}>+ New event</Button>
      </div>

      <div className="overflow-hidden rounded-[22px] border border-line">
        {events.map((e) => {
          const phase = phaseOf(e);
          return (
            <div key={e.id} className="flex items-center gap-4 border-b border-line p-3 last:border-b-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={thumb(e.cover)} alt="" className="h-14 w-20 shrink-0 rounded-lg object-cover" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate font-medium">{e.title}</p>
                  {e.status !== "published" && <span className="rounded-full bg-paper/10 px-2 py-0.5 font-mono text-[10px] uppercase">{e.status}</span>}
                  {e.featured && <span className="rounded-full bg-lime/20 px-2 py-0.5 font-mono text-[10px] uppercase text-lime">Featured</span>}
                  {phase === "live" && <span className="rounded-full bg-[#ff4d4d] px-2 py-0.5 font-mono text-[10px] uppercase">Live</span>}
                </div>
                <p className="truncate font-mono text-[11px] text-mute">
                  {fmtRange(e.starts_at, e.ends_at)} · {e.venue} · {e.taken}/{e.capacity} seats
                </p>
              </div>
              <span className="hidden h-2 w-2 shrink-0 rounded-full md:block" style={{ background: CATEGORIES[e.category].color }} />
              <button onClick={() => setEditing({ slug: e.slug, draft: fromEvent(e) })} className="rounded-full border border-line px-3 py-1.5 text-xs hover:border-paper/50">
                Edit
              </button>
              <button onClick={() => remove(e.slug)} className="rounded-full border border-line px-3 py-1.5 text-xs text-[#ff9a9a] hover:border-[#ff9a9a]">
                Delete
              </button>
            </div>
          );
        })}
      </div>

      <AnimatePresence>
        {editing && (
          <motion.div className="fixed inset-0 z-[70] flex justify-end" initial={{ opacity: 1 }} exit={{ opacity: 1 }}>
            <motion.div className="absolute inset-0 bg-ink/70 backdrop-blur" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEditing(null)} />
            <motion.form
              data-lenis-prevent
              onSubmit={(e) => {
                e.preventDefault();
                save();
              }}
              className="relative h-full w-full max-w-2xl overflow-y-auto border-l border-line bg-ink-2 p-6 md:p-8"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 34 }}
            >
              <div className="mb-8 flex items-center justify-between">
                <h2 className="display text-4xl">{editing.slug ? "Edit event" : "New event"}</h2>
                <button type="button" onClick={() => setEditing(null)} className="h-10 w-10 rounded-full border border-line" aria-label="Close">
                  ✕
                </button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Title" className="sm:col-span-2">
                  <input required className="field" value={editing.draft.title} onChange={(e) => set("title", e.target.value)} />
                </Field>
                {!editing.slug && (
                  <Field label="URL slug (optional)" className="sm:col-span-2">
                    <input className="field" value={editing.draft.slug} onChange={(e) => set("slug", e.target.value)} placeholder="auto from title" />
                  </Field>
                )}
                <Field label="Tagline" className="sm:col-span-2">
                  <input className="field" value={editing.draft.tagline} onChange={(e) => set("tagline", e.target.value)} />
                </Field>
                <Field label="Description" className="sm:col-span-2">
                  <textarea rows={5} className="field" value={editing.draft.description} onChange={(e) => set("description", e.target.value)} />
                </Field>
                <Field label="Category">
                  <select className="field" value={editing.draft.category} onChange={(e) => set("category", e.target.value)}>
                    {CATEGORY_KEYS.map((k) => (
                      <option key={k} value={k}>
                        {CATEGORIES[k].label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Status">
                  <select className="field" value={editing.draft.status} onChange={(e) => set("status", e.target.value)}>
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </Field>
                <Field label="Venue">
                  <input required className="field" value={editing.draft.venue} onChange={(e) => set("venue", e.target.value)} />
                </Field>
                <Field label="Organiser">
                  <input className="field" value={editing.draft.organizer} onChange={(e) => set("organizer", e.target.value)} />
                </Field>
                <Field label="Starts">
                  <input required type="datetime-local" className="field" value={editing.draft.starts_at} onChange={(e) => set("starts_at", e.target.value)} />
                </Field>
                <Field label="Ends">
                  <input required type="datetime-local" className="field" value={editing.draft.ends_at} onChange={(e) => set("ends_at", e.target.value)} />
                </Field>
                <Field label="Capacity">
                  <input required type="number" min={1} className="field" value={editing.draft.capacity} onChange={(e) => set("capacity", Number(e.target.value))} />
                </Field>
                <Field label="Price (LKR, 0 = free)">
                  <input type="number" min={0} className="field" value={editing.draft.price} onChange={(e) => set("price", Number(e.target.value))} />
                </Field>
                <Field label="Cover" className="sm:col-span-2">
                  <div className="grid grid-cols-4 gap-2">
                    {COVERS.map((c) => (
                      <button key={c} type="button" onClick={() => set("cover", c)} className={clsx("overflow-hidden rounded-xl ring-2 transition", editing.draft.cover === c ? "ring-lime" : "ring-transparent opacity-60 hover:opacity-100")}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={thumb(c)} alt="" className="aspect-video w-full object-cover" />
                      </button>
                    ))}
                  </div>
                  <input className="field mt-2" value={editing.draft.cover} onChange={(e) => set("cover", e.target.value)} placeholder="…or paste an image URL" />
                </Field>
                <label className="flex items-center gap-3 sm:col-span-2">
                  <input type="checkbox" checked={editing.draft.featured} onChange={(e) => set("featured", e.target.checked)} className="h-5 w-5 accent-[#d7ff3d]" />
                  <span className="text-sm">Feature on the home page</span>
                </label>
              </div>

              {error && <p className="mt-6 rounded-xl bg-[#ff4d4d]/15 px-4 py-3 text-sm text-[#ff9a9a]">{error}</p>}
              <Button type="submit" disabled={busy} className="mt-8 w-full">
                {busy ? "Saving…" : editing.slug ? "Save changes" : "Create event"}
              </Button>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Field({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <label className={clsx("block", className)}>
      <span className="eyebrow mb-2 block">{label}</span>
      {children}
    </label>
  );
}