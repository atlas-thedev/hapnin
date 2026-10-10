"use client";

import { useEffect, useState } from "react";
import type { EventRow } from "@/lib/types";
import { fmtDay } from "@/lib/time";
import { api } from "./api";

type Row = { code: string; name: string; email: string; role: string; seats: number; school: string | null; grade: string | null; checked_in_at: string | null; created_at: string; event_title: string };

export function RegistrationsAdmin({ events }: { events: EventRow[] }) {
  const [slug, setSlug] = useState("");
  const [rows, setRows] = useState<Row[] | null>(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    setRows(null);
    api<{ registrations: Row[] }>("GET", `/api/admin/registrations${slug ? `?event=${slug}` : ""}`)
      .then((d) => setRows(d.registrations))
      .catch(() => setRows([]));
  }, [slug]);

  const shown = (rows ?? []).filter((r) => !q || `${r.name} ${r.email} ${r.code}`.toLowerCase().includes(q.toLowerCase()));
  const seats = shown.reduce((n, r) => n + r.seats, 0);
  const inCount = shown.filter((r) => r.checked_in_at).length;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <select className="field !w-auto" value={slug} onChange={(e) => setSlug(e.target.value)}>
          <option value="">All events</option>
          {events.map((e) => (
            <option key={e.id} value={e.slug}>
              {e.title}
            </option>
          ))}
        </select>
        <input className="field !w-auto flex-1" placeholder="Search name, email or code" value={q} onChange={(e) => setQ(e.target.value)} />
        <a href={`/api/admin/registrations?format=csv${slug ? `&event=${slug}` : ""}`} className="rounded-full bg-lime px-5 py-3 text-sm font-medium text-ink">
          Export CSV
        </a>
      </div>
      <p className="eyebrow mb-4">
        {shown.length} registrations · {seats} seats · {inCount} checked in
      </p>
      <div className="overflow-x-auto rounded-[22px] border border-line" data-lenis-prevent>
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-ink-2">
            <tr className="eyebrow">
              {["Name", "Email", "Event", "Role", "Seats", "Code", "Status", "Booked"].map((h) => (
                <th key={h} className="px-4 py-3 font-normal">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows === null && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-mute">
                  Loading…
                </td>
              </tr>
            )}
            {shown.map((r) => (
              <tr key={r.code} className="border-t border-line">
                <td className="px-4 py-3">{r.name}</td>
                <td className="px-4 py-3 text-paper/70">{r.email}</td>
                <td className="px-4 py-3 text-paper/70">{r.event_title}</td>
                <td className="px-4 py-3 capitalize">{r.role}</td>
                <td className="px-4 py-3">{r.seats}</td>
                <td className="px-4 py-3 font-mono text-xs">{r.code}</td>
                <td className="px-4 py-3">{r.checked_in_at ? <span className="text-lime">In</span> : <span className="text-mute">—</span>}</td>
                <td className="px-4 py-3 text-paper/60">{fmtDay(r.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}