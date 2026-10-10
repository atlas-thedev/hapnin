"use client";

import { useRef, type ReactNode } from "react";
import { gsap, reducedMotion, useGSAP } from "@/lib/gsap";
import { SplitReveal } from "./Reveal";
import { ButtonLink, Arrow } from "./Button";

/** Three tickets stacked on top of each other that fan out as you scroll. */
export function TicketFan({ tickets }: { tickets: ReactNode[] }) {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (reducedMotion()) return;
      const cards = gsap.utils.toArray<HTMLElement>("[data-ticket]");
      const mm = gsap.matchMedia();
      mm.add({ wide: "(min-width: 768px)", narrow: "(max-width: 767px)" }, (ctx) => {
        const spread = ctx.conditions?.wide ? 300 : 70;
        gsap.fromTo(
          cards,
          { x: 0, rotate: 0, y: 80 },
          {
            x: (i) => (i - 1) * spread,
            rotate: (i) => (i - 1) * 9,
            y: (i) => (i === 1 ? -20 : 30),
            ease: "power2.out",
            scrollTrigger: { trigger: "[data-fan]", start: "top 85%", end: "center 45%", scrub: 1 },
          },
        );
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} className="relative overflow-hidden bg-lime py-28 text-ink md:py-40">
      <div className="mx-auto max-w-[1600px] px-4 md:px-8">
        <p className="eyebrow !text-ink/60">(05) Tickets</p>
        <SplitReveal as="h2" by="words" className="display mt-4 max-w-[14ch] text-[clamp(3rem,8vw,8.5rem)]">
          Register in ten seconds. Flash it at the gate.
        </SplitReveal>
        <div className="mt-8 grid max-w-3xl gap-6 text-lg text-ink/75 md:grid-cols-2">
          <p>Pick an event, add your name and you get a QR ticket on the spot. No printing, no queue at the office.</p>
          <p>Lost it? Look it up with your email any time. Organisers scan you in at the door and the seat count updates live.</p>
        </div>
        <ButtonLink href="/events" variant="ghost" className="mt-10 !border-ink/30 !text-ink">
          Get a ticket <Arrow />
        </ButtonLink>
      </div>

      <div data-fan className="relative mx-auto mt-16 flex h-[34rem] max-w-5xl items-center justify-center">
        {tickets.map((t, i) => (
          <div key={i} data-ticket className="absolute w-[19rem] md:w-[22rem]" style={{ zIndex: i === 1 ? 3 : 1 }}>
            {t}
          </div>
        ))}
      </div>
    </section>
  );
}
