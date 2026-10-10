"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { AnimatePresence, motion } from "motion/react";
import { TLink } from "./PageTransition";
import { Clock } from "./Clock";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";

const LINKS = [
  { href: "/events", label: "Events" },
  { href: "/calendar", label: "Calendar" },
  { href: "/live", label: "Live" },
  { href: "/announcements", label: "News" },
];

export function Nav() {
  const pathname = usePathname();
  const bar = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(false);
  const [live, setLive] = useState(0);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    fetch("/api/events?when=live&limit=10")
      .then((r) => r.json())
      .then((d) => setLive(d.events?.length ?? 0))
      .catch(() => {});
  }, [pathname]);

  // Hide on scroll down, show on scroll up.
  useGSAP(() => {
    const st = ScrollTrigger.create({
      start: 0,
      end: "max",
      onUpdate(self) {
        if (open) return;
        const hide = self.direction === 1 && self.scroll() > 160;
        gsap.to(bar.current, { yPercent: hide ? -120 : 0, duration: 0.6, ease: "expo.out", overwrite: true });
      },
    });
    return () => st.kill();
  }, [open]);

  if (pathname.startsWith("/admin")) return null;

  return (
    <>
      <header ref={bar} className="fixed inset-x-0 top-0 z-50 px-4 pt-4 md:px-8">
        <nav className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 rounded-full border border-line bg-ink/70 py-2 pl-5 pr-2 backdrop-blur-xl">
          <TLink href="/" className="group flex items-center gap-1 text-lg font-semibold tracking-tight" aria-label="Hapnin home">
            <span className="display text-2xl">hapnin</span>
            <span className="inline-block text-lime transition-transform duration-700 group-hover:rotate-[360deg]">✱</span>
          </TLink>

          <ul className="hidden items-center gap-1 md:flex">
            {LINKS.map((l) => {
              const active = pathname.startsWith(l.href);
              return (
                <li key={l.href}>
                  <TLink
                    href={l.href}
                    className={clsx(
                      "relative flex items-center gap-2 rounded-full px-4 py-2 text-sm transition-colors",
                      active ? "text-ink" : "text-paper/70 hover:text-paper",
                    )}
                  >
                    {active && <motion.span layoutId="nav-pill" className="absolute inset-0 rounded-full bg-paper" transition={{ type: "spring", stiffness: 400, damping: 34 }} />}
                    <span className="relative">{l.label}</span>
                    {l.href === "/live" && live > 0 && <span className="live-dot relative" aria-label={`${live} live now`} />}
                  </TLink>
                </li>
              );
            })}
          </ul>

          <div className="flex items-center gap-2">
            <Clock className="eyebrow hidden lg:inline" />
            <TLink href="/tickets" className="hidden rounded-full bg-lime px-4 py-2 text-sm font-medium text-ink transition-transform hover:scale-[1.04] sm:inline-flex">
              My tickets
            </TLink>
            <button
              className="flex h-10 w-10 items-center justify-center rounded-full bg-paper text-ink md:hidden"
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
            >
              <span className="relative block h-3 w-4">
                <span className={clsx("absolute left-0 h-[1.5px] w-4 bg-ink transition-all duration-300", open ? "top-1.5 rotate-45" : "top-0")} />
                <span className={clsx("absolute left-0 h-[1.5px] w-4 bg-ink transition-all duration-300", open ? "top-1.5 -rotate-45" : "top-3")} />
              </span>
            </button>
          </div>
        </nav>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-40 flex flex-col justify-end bg-lime px-6 pb-10 text-ink md:hidden"
            initial={{ clipPath: "circle(0% at 92% 6%)" }}
            animate={{ clipPath: "circle(150% at 92% 6%)" }}
            exit={{ clipPath: "circle(0% at 92% 6%)" }}
            transition={{ duration: 0.7, ease: [0.85, 0, 0.15, 1] }}
          >
            {[{ href: "/", label: "Home" }, ...LINKS, { href: "/tickets", label: "My tickets" }].map((l, i) => (
              <div key={l.href} className="overflow-hidden">
                <motion.div initial={{ y: "110%" }} animate={{ y: 0 }} transition={{ delay: 0.25 + i * 0.06, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>
                  <TLink href={l.href} className="display block py-1 text-6xl">
                    {l.label}
                  </TLink>
                </motion.div>
              </div>
            ))}
            <p className="eyebrow mt-8 !text-ink/60">Every school event, one place.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
