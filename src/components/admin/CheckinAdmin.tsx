"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { Ticket } from "@/lib/types";
import { fmtDay, fmtTime } from "@/lib/time";
import { Button } from "../Button";
import { api } from "./api";

type Result = { ok: true; ticket: Ticket; already: boolean } | { ok: false; error: string };

export function CheckinAdmin() {
  const [code, setCode] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [log, setLog] = useState<Ticket[]>([]);
  const input = useRef<HTMLInputElement>(null);

  const check = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    try {
      const data = await api<{ ticket: Ticket; already: boolean }>("POST", "/api/admin/checkin", { code });
      setResult({ ok: true, ...data });
      if (!data.already) setLog((l) => [data.ticket, ...l].slice(0, 20));
    } catch (err) {
      setResult({ ok: false, error: (err as Error).message });
    }
    setCode("");
    input.current?.focus();
  };

  const tone = !result ? "" : !result.ok ? "border-[#ff4d4d] bg-[#ff4d4d]/10" : result.already ? "border-[#ffc93d] bg-[#ffc93d]/10" : "border-lime bg-lime/10";

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div>
        <form onSubmit={check} className="flex gap-3">
          <input
            ref={input}
            autoFocus
            className="field !rounded-full !px-6 font-mono uppercase tracking-widest"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="HAP-XXXXXX or scan QR"
            aria-label="Ticket code"
          />
          <Button type="submit">Check in</Button>
        </form>
        <p className="mt-3 text-sm text-mute">USB and phone QR scanners type the ticket link straight into this box. Pasting the full link works too.</p>

        <AnimatePresence mode="wait">
          {result && (
            <motion.div key={JSON.stringify(result)} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className={`mt-8 rounded-[24px] border-2 p-6 ${tone}`}>
              {result.ok ? (
                <>
                  <p className="display text-4xl">{result.already ? "Already in" : "Welcome in ✓"}</p>
                  <p className="mt-3 text-lg">{result.ticket.name}</p>
                  <p className="text-sm text-paper/70">
                    {result.ticket.event_title} · admit {result.ticket.seats} · {result.ticket.role}
                  </p>
                  {result.already && result.ticket.checked_in_at && (
                    <p className="mt-2 font-mono text-xs text-[#ffc93d]">
                      First scanned {fmtDay(result.ticket.checked_in_at)} {fmtTime(result.ticket.checked_in_at)}
                    </p>
                  )}
                </>
              ) : (
                <p className="display text-3xl text-[#ff9a9a]">{result.error}</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div>
        <p className="eyebrow mb-4">This session</p>
        {log.length === 0 && <p className="text-sm text-mute">No check-ins yet.</p>}
        <ul className="space-y-2">
          {log.map((t) => (
            <li key={t.code} className="flex justify-between rounded-xl border border-line px-4 py-3 text-sm">
              <span>{t.name}</span>
              <span className="font-mono text-xs text-mute">{t.code}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}