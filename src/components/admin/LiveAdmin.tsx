"use client";

import { useState } from "react";
import type { EventRow, LiveUpdate } from "@/lib/types";
import { phaseOf, relative } from "@/lib/time";
import { COVERS, thumb } from "@/lib/categories";
import { Button } from "../Button";
import { Field } from "./EventsAdmin";
import { api } from "./api";
import { Select } from "../Select";

export function LiveAdmin({ updates, events, onChange }: { updates: LiveUpdate[]; events: EventRow[]; onChange: () => void }) {
  const sorted = [...events].sort((a, b) => {
    const rank = (e: EventRow) => ({ live: 0, upcoming: 1, past: 2 })[phaseOf(e)];
    return rank(a) - rank(b);
  });
  const [slug, setSlug] = useState(sorted[0]?.slug ?? "");
  const [kind, setKind] = useState("update");
  const [body, setBody] = useState("");
  const [image, setImage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const post = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api("POST", `/api/events/${slug}/updates`, { kind, body, image });
      setBody("");
      setImage("");
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
        <p className="eyebrow">Post a live update</p>
        <p className="text-sm text-mute">Goes out instantly to everyone watching the event page and the live feed.</p>
        <Field label="Event">
          <Select value={slug} onChange={(v) => setSlug(v)}>
            {sorted.map((e) => (
              <option key={e.id} value={e.slug}>
                {phaseOf(e) === "live" ? "● " : ""}
                {e.title}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Type">
          <Select value={kind} onChange={(v) => setKind(v)}>
            <option value="update">Update</option>
            <option value="score">Score</option>
            <option value="highlight">Highlight</option>
          </Select>
        </Field>
        <Field label="Message">
          <textarea required rows={4} className="field" value={body} onChange={(e) => setBody(e.target.value)} placeholder="Blue house takes the 4×100 relay!" />
        </Field>
        <Field label="Photo (optional)">
          <Select value={image} onChange={(v) => setImage(v)}>
            <option value="">No photo</option>
            {COVERS.map((c) => (
              <option key={c} value={thumb(c)}>
                {c.split("/").pop()}
              </option>
            ))}
          </Select>
        </Field>
        {error && <p className="text-sm text-[#ff9a9a]">{error}</p>}
        <Button type="submit" disabled={busy || !slug} className="w-full">
          {busy ? "Sending…" : "Send live"}
        </Button>
      </form>

      <ul className="space-y-3">
        {updates.map((u) => (
          <li key={u.id} className="flex items-start gap-4 rounded-[22px] border border-line p-4">
            <div className="min-w-0 flex-1">
              <p className="font-mono text-[11px] uppercase tracking-widest text-mute">
                {u.kind} · {u.event_title} · {relative(u.created_at)}
              </p>
              <p className="mt-2 text-sm">{u.body}</p>
            </div>
            <button
              onClick={async () => {
                await api("DELETE", `/api/updates/${u.id}`);
                onChange();
              }}
              className="shrink-0 rounded-full border border-line px-3 py-1 text-xs text-[#ff9a9a]"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}