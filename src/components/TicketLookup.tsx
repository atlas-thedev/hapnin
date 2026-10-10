"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import type { Ticket } from "@/lib/types";
import { fmtDay, fmtTime, phaseOf } from "@/lib/time";
import { thumb } from "@/lib/categories";
import { TLink } from "./PageTransition";
import { Button } from "./Button";

export function TicketLookup() {
  const [email, setEmail] = useState("");
  const [tickets, setTickets] = useState<Ticket[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const lookup = async (value: string) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/tickets?email=${encodeURIComponent(value)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTickets(data.tickets);
    } catch (e) {
      setError((e as Error).message || "Couldn't look that up");
    } finally {
      setBusy(false);
    }
  };

  // Returning visitors see their tickets straight away.
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("hapnin:profile") || "{}");
      if (saved.email) {
        setEmail(saved.email);
        lookup(saved.email);
      }
    } catch {}
  }, []);

  return (
    <div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          lookup(email);
        }}
        className="flex flex-col gap-3 sm:flex-row"
      >
        <label className="flex-1">
          <span className="sr-only">Email</span>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="The email you registered with" className="field !rounded-full !px-6 !py-4" />
        </label>
        <Button type="submit" disabled={busy} className="!py-4">
          {busy ? "Looking…" : "Find my tickets"}
        </Button>
      </form>
      {error && <p className="mt-4 text-sm text-[#ff9a9a]">{error}</p>}

      {tickets && (
        <div className="mt-12">
          <p className="eyebrow mb-5">{tickets.length ? `${tickets.length} ticket${tickets.length > 1 ? "s" : ""}` : "No tickets for that email yet"}</p>
          <ul className="grid gap-4 sm:grid-cols-2">
            {tickets.map((t, i) => {
              const phase = phaseOf(t);
              return (
                <motion.li key={t.code} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}>
                  <TLink href={`/tickets/${t.code}`} data-cursor="Open" className="group flex overflow-hidden rounded-[22px] border border-line bg-ink-2 transition-colors hover:border-lime/60">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={thumb(t.event_cover)} alt="" className="w-28 object-cover" />
                    <div className="min-w-0 flex-1 p-4">
                      <p className="font-mono text-[11px] uppercase tracking-widest text-mute">
                        {fmtDay(t.starts_at)} · {fmtTime(t.starts_at)}
                      </p>
                      <p className="display mt-1 truncate text-2xl group-hover:text-lime">{t.event_title}</p>
                      <p className="mt-2 font-mono text-xs tracking-wider">{t.code}</p>
                      <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-mute">
                        {t.checked_in_at ? "✓ Checked in" : phase === "past" ? "Past event" : phase === "live" ? "Live now" : `Admit ${t.seats}`}
                      </p>
                    </div>
                  </TLink>
                </motion.li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}