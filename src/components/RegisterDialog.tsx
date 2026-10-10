"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import confetti from "canvas-confetti";
import { useLenis } from "lenis/react";
import type { EventRow } from "@/lib/types";
import { fmtDay, fmtTime } from "@/lib/time";
import { thumb } from "@/lib/categories";
import { TicketStub } from "./TicketStub";
import { Button } from "./Button";
import { TLink } from "./PageTransition";
import { priceLabel } from "./EventCard";

type Form = { name: string; email: string; phone: string; school: string; grade: string; role: string; seats: number };
const EMPTY: Form = { name: "", email: "", phone: "", school: "", grade: "", role: "student", seats: 1 };

export function saveLocalTicket(code: string) {
  try {
    const list: string[] = JSON.parse(localStorage.getItem("hapnin:tickets") || "[]");
    if (!list.includes(code)) localStorage.setItem("hapnin:tickets", JSON.stringify([code, ...list].slice(0, 50)));
  } catch {}
}

export function RegisterDialog({ event, open, onClose, seatsLeft }: { event: EventRow; open: boolean; onClose: () => void; seatsLeft: number }) {
  const [form, setForm] = useState<Form>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [ticket, setTicket] = useState<{ code: string; qr: string } | null>(null);
  const lenis = useLenis();
  const first = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    lenis?.stop();
    const saved = localStorage.getItem("hapnin:profile");
    if (saved) setForm((f) => ({ ...f, ...JSON.parse(saved), seats: 1 }));
    setTimeout(() => first.current?.focus(), 350);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => {
      lenis?.start();
      window.removeEventListener("keydown", esc);
    };
  }, [open, lenis, onClose]);

  useEffect(() => {
    if (!open) {
      const id = setTimeout(() => {
        setTicket(null);
        setError(null);
      }, 500);
      return () => clearTimeout(id);
    }
  }, [open]);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/events/${event.slug}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");

      const url = `${window.location.origin}/tickets/${data.code}`;
      const qr = await QRCode.toDataURL(url, { margin: 0, width: 240, color: { dark: "#0f0e0c", light: "#f3eee3" } });
      saveLocalTicket(data.code);
      localStorage.setItem("hapnin:profile", JSON.stringify({ name: form.name, email: form.email, phone: form.phone, school: form.school, grade: form.grade, role: form.role }));
      setTicket({ code: data.code, qr });
      confetti({ particleCount: 140, spread: 100, origin: { y: 0.6 }, colors: ["#d7ff3d", "#ff5ca8", "#4de1ff", "#f3eee3"], disableForReducedMotion: true });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[70] flex items-end justify-center md:items-center" initial={{ opacity: 1 }} exit={{ opacity: 1 }}>
          <motion.div
            className="absolute inset-0 bg-ink/70 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={`Register for ${event.title}`}
            data-lenis-prevent
            className="relative max-h-[92svh] w-full max-w-xl overflow-y-auto rounded-t-[32px] border border-line bg-ink-2 p-6 md:rounded-[32px] md:p-8"
            initial={{ y: "100%", opacity: 0.6 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 30 }}
          >
            <button onClick={onClose} className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full border border-line text-lg hover:border-paper/50" aria-label="Close">
              ✕
            </button>

            <AnimatePresence mode="wait">
              {ticket ? (
                <motion.div key="done" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center text-center">
                  <p className="eyebrow">You&apos;re in</p>
                  <h2 className="display mt-3 text-5xl">
                    See you <span className="serif-i text-lime">there.</span>
                  </h2>
                  <motion.div initial={{ rotate: -8, y: 60, opacity: 0 }} animate={{ rotate: -2, y: 0, opacity: 1 }} transition={{ type: "spring", stiffness: 120, damping: 14, delay: 0.15 }} className="my-8">
                    <TicketStub
                      title={event.title}
                      date={fmtDay(event.starts_at)}
                      time={fmtTime(event.starts_at)}
                      venue={event.venue}
                      code={ticket.code}
                      name={form.name}
                      seats={form.seats}
                      category={event.category}
                      cover={thumb(event.cover)}
                      qr={ticket.qr}
                      notch="bg-ink-2"
                    />
                  </motion.div>
                  <p className="max-w-sm text-sm text-paper/60">Saved to this device. You can also find it any time under My tickets using {form.email}.</p>
                  <div className="mt-6 flex gap-3">
                    <TLink href={`/tickets/${ticket.code}`} className="rounded-full bg-lime px-5 py-3 text-sm font-medium text-ink">
                      Open ticket
                    </TLink>
                    <button onClick={onClose} className="rounded-full border border-line px-5 py-3 text-sm">
                      Done
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.form key="form" onSubmit={submit} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -10 }}>
                  <p className="eyebrow">Register · {priceLabel(event.price)}</p>
                  <h2 className="display mt-3 pr-12 text-4xl leading-[0.95] md:text-5xl">{event.title}</h2>
                  <p className="mt-2 text-sm text-paper/60">
                    {fmtDay(event.starts_at)} · {fmtTime(event.starts_at)} · {event.venue}
                  </p>

                  <div className="mt-8 grid gap-3 sm:grid-cols-2">
                    <label className="sm:col-span-2">
                      <span className="eyebrow mb-2 block">Full name</span>
                      <input ref={first} required minLength={2} className="field" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Kavindu Perera" autoComplete="name" />
                    </label>
                    <label className="sm:col-span-2">
                      <span className="eyebrow mb-2 block">Email</span>
                      <input required type="email" className="field" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="you@example.com" autoComplete="email" />
                    </label>
                    <label>
                      <span className="eyebrow mb-2 block">I&apos;m a</span>
                      <select className="field" value={form.role} onChange={(e) => set("role", e.target.value)}>
                        <option value="student">Student</option>
                        <option value="parent">Parent</option>
                        <option value="teacher">Teacher</option>
                        <option value="guest">Guest</option>
                      </select>
                    </label>
                    <label>
                      <span className="eyebrow mb-2 block">Phone (optional)</span>
                      <input className="field" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="07X XXX XXXX" autoComplete="tel" />
                    </label>
                    {form.role === "student" && (
                      <>
                        <label>
                          <span className="eyebrow mb-2 block">School</span>
                          <input className="field" value={form.school} onChange={(e) => set("school", e.target.value)} placeholder="Royal College" />
                        </label>
                        <label>
                          <span className="eyebrow mb-2 block">Grade</span>
                          <input className="field" value={form.grade} onChange={(e) => set("grade", e.target.value)} placeholder="11" inputMode="numeric" />
                        </label>
                      </>
                    )}
                  </div>

                  <div className="mt-6 flex items-center justify-between rounded-2xl border border-line p-4">
                    <div>
                      <p className="text-sm">Seats</p>
                      <p className="text-xs text-mute">{seatsLeft} left · max 6</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button type="button" onClick={() => set("seats", Math.max(1, form.seats - 1))} className="h-9 w-9 rounded-full border border-line" aria-label="Fewer seats">
                        −
                      </button>
                      <span className="display w-6 text-center text-2xl tabular-nums">{form.seats}</span>
                      <button type="button" onClick={() => set("seats", Math.min(6, seatsLeft, form.seats + 1))} className="h-9 w-9 rounded-full border border-line" aria-label="More seats">
                        +
                      </button>
                    </div>
                  </div>

                  <AnimatePresence>
                    {error && (
                      <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-4 rounded-xl bg-[#ff4d4d]/15 px-4 py-3 text-sm text-[#ff9a9a]" role="alert">
                        {error}
                      </motion.p>
                    )}
                  </AnimatePresence>

                  <Button type="submit" disabled={busy} className="mt-6 w-full !py-4 text-base">
                    {busy ? "Getting your ticket…" : event.price ? `Reserve · ${priceLabel(event.price * form.seats)} at the gate` : "Get my free ticket"}
                  </Button>
                  <p className="mt-3 text-center text-xs text-mute">One registration per email. Paid events are settled at the entrance.</p>
                </motion.form>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
