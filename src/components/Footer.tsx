"use client";

import { usePathname } from "next/navigation";
import { useRef } from "react";
import { TLink } from "./PageTransition";
import { ButtonLink, Arrow } from "./Button";
import { Magnetic } from "./Magnetic";
import { gsap, reducedMotion, useGSAP } from "@/lib/gsap";

const COLS = [
  {
    title: "Explore",
    links: [
      ["/events", "All events"],
      ["/calendar", "Calendar"],
      ["/live", "Live now"],
      ["/announcements", "Announcements"],
    ],
  },
  {
    title: "You",
    links: [
      ["/tickets", "My tickets"],
      ["/admin", "Organiser login"],
    ],
  },
];

export function Footer() {
  const pathname = usePathname();
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (reducedMotion()) return;
      gsap.from("[data-letter]", {
        yPercent: 100,
        stagger: 0.04,
        ease: "none",
        scrollTrigger: { trigger: "[data-wordmark]", start: "top bottom", end: "clamp(bottom bottom)", scrub: 0.6, refreshPriority: -1 },
      });
    },
    { scope: ref, dependencies: [pathname] },
  );

  if (pathname.startsWith("/admin")) return null;

  return (
    <footer ref={ref} className="relative overflow-hidden border-t border-line bg-ink-2 px-4 pt-24 md:px-8">
      <div className="mx-auto grid max-w-[1600px] gap-16 md:grid-cols-[1.4fr_1fr]">
        <div>
          <p className="eyebrow mb-6">Stay in the loop</p>
          <h2 className="display text-[clamp(3rem,8vw,8rem)]">
            Don&apos;t miss <br />a <span className="serif-i text-lime">thing.</span>
          </h2>
          <Magnetic className="mt-10">
            <ButtonLink href="/events" data-cursor="Go">
              Browse events <Arrow />
            </ButtonLink>
          </Magnetic>
        </div>
        <div className="grid grid-cols-2 gap-8 self-end">
          {COLS.map((c) => (
            <div key={c.title}>
              <p className="eyebrow mb-4">{c.title}</p>
              <ul className="space-y-2">
                {c.links.map(([href, label]) => (
                  <li key={href}>
                    <TLink href={href} className="group inline-flex items-center gap-2 text-paper/80 transition-colors hover:text-lime">
                      <span className="h-px w-0 bg-lime transition-all duration-500 group-hover:w-4" />
                      {label}
                    </TLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <p className="col-span-2 text-sm leading-relaxed text-mute">
            Hapnin is the events hub for students, teachers and parents. Built for the BTUI&apos;26 web development challenge.
          </p>
        </div>
      </div>

      <div data-wordmark className="mx-auto mt-24 flex max-w-[1600px] select-none overflow-hidden" aria-hidden>
        {"hapnin✱".split("").map((c, i) => (
          <span key={i} data-letter className={`display inline-block text-[23.5vw] leading-[0.8] ${c === "✱" ? "text-lime" : ""}`}>
            {c}
          </span>
        ))}
      </div>
      <div className="mx-auto flex max-w-[1600px] justify-between border-t border-line py-5 text-xs text-mute">
        <span>© {new Date().getFullYear()} Hapnin</span>
        <span className="font-mono uppercase tracking-widest">Colombo, Sri Lanka</span>
      </div>
    </footer>
  );
}
