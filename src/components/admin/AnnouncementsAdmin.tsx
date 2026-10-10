"use client";

import { useState } from "react";
import clsx from "clsx";
import type { Announcement, EventRow } from "@/lib/types";
import { relative } from "@/lib/time";
import { PRIORITY } from "../AnnouncementList";
import { Button } from "../Button";
import { Field } from "./EventsAdmin";
import { api } from "./api";
import { Select } from "../Select";

export function AnnouncementsAdmin({ items, events, onChange }: { items: Announcement[]; events: EventRow[]; onChange: () => void }) {
  const [form, setForm] = useState({ title: "", body: "", priority: "normal", pinned: false, event_id: "" });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const post = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api("POST", "/api/announcements", { ...form, event_id: form.event_id ? Number(form.event_id) : null });
      setForm({ title: "", body: "", priority: "normal", pinned: false, event_id: "" });
      onChange();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[24rem_1fr]">
      <form onSubmit={post} className="space-y-4 rounded-[22px] border border-line p-5 lg:self-start">
        <p className="eyebrow">Post an announcement</p>
        <Field label="Title">
          <input required className="field" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </Field>
        <Field label="Message">
          <textarea required rows={4} className="field" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Priority">
            <Select value={form.priority} onChange={(v) => setForm({ ...form, priority: v })}>
              <option value="normal">Notice</option>
              <option value="important">Important</option>
              <option value="urgent">Urgent</option>
            </Select>
          </Field>
          <Field label="Event">
            <Select value={form.event_id} onChange={(v) => setForm({ ...form, event_id: v })}>
              <option value="">None</option>
              {events.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.title}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <label className="flex items-center gap-3 text-sm">
          <input type="checkbox" checked={form.pinned} onChange={(e) => setForm({ ...form, pinned: e.target.checked })} className="h-5 w-5 accent-[#d7ff3d]" /> Pin to top
        </label>
        {error && <p className="text-sm text-[#ff9a9a]">{error}</p>}
        <Button type="submit" disabled={busy} className="w-full">
          {busy ? "Posting…" : "Post now"}
        </Button>
      </form>

      <ul className="space-y-3">
        {items.map((a) => (
          <li key={a.id} className="rounded-[22px] border border-line p-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className={clsx("rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest", PRIORITY[a.priority].cls)}>{PRIORITY[a.priority].label}</span>
              {a.pinned && <span className="font-mono text-[10px] uppercase text-mute">📌 Pinned</span>}
              <span className="font-mono text-[11px] text-mute">{relative(a.created_at)}</span>
              <div className="ml-auto flex gap-2">
                <button
                  onClick={async () => {
                    await api("PATCH", `/api/announcements/${a.id}`, { pinned: !a.pinned });
                    onChange();
                  }}
                  className="rounded-full border border-line px-3 py-1 text-xs"
                >
                  {a.pinned ? "Unpin" : "Pin"}
                </button>
                <button
                  onClick={async () => {
                    if (!confirm("Delete this announcement?")) return;
                    await api("DELETE", `/api/announcements/${a.id}`);
                    onChange();
                  }}
                  className="rounded-full border border-line px-3 py-1 text-xs text-[#ff9a9a]"
                >
                  Delete
                </button>
              </div>
            </div>
            <p className="mt-3 font-medium">{a.title}</p>
            <p className="mt-1 text-sm text-paper/60">{a.body}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}