"use client";

import { useRef } from "react";
import type { EventRow } from "@/lib/types";
import { gsap, reducedMotion, useGSAP } from "@/lib/gsap";
import { EventCard } from "./EventCard";
import { SplitReveal } from "./Reveal";
import { ButtonLink, Arrow } from "./Button";

/** Pinned section whose cards scroll sideways as you scroll down (desktop). */
export function FeaturedRail({ events }: { events: EventRow[] }) {
  const root = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (reducedMotion()) return;
      const mm = gsap.matchMedia();
      mm.add("(min-width: 768px)", () => {
        const distance = () => track.current!.scrollWidth - window.innerWidth + 64;
        const tween = gsap.to(track.current, {
          x: () => -distance(),
          ease: "none",
          scrollTrigger: {
            trigger: root.current,
            start: "top top",
            end: () => `+=${distance()}`,
            pin: true,
            scrub: 1,
            invalidateOnRefresh: true,
          },
        });
        gsap.utils.toArray<HTMLElement>("[data-parallax]", track.current).forEach((img) => {
          gsap.fromTo(img, { xPercent: -8 }, {
            xPercent: 8,
            ease: "none",
            scrollTrigger: { trigger: img, containerAnimation: tween, start: "left right", end: "right left", scrub: true },
          });
        });
        gsap.from("[data-card]", { y: 120, rotate: 4, opacity: 0, stagger: 0.08, duration: 1.4, scrollTrigger: { trigger: root.current, start: "top 70%", once: true } });
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} className="relative flex min-h-[100svh] flex-col justify-center overflow-hidden py-16">
      <div className="mx-auto mb-10 flex w-full max-w-[1600px] items-end justify-between gap-6 px-4 md:px-8">
        <div>
          <p className="eyebrow mb-4">(03) Featured</p>
          <SplitReveal as="h2" by="words" className="display text-[clamp(2.8rem,7vw,7rem)]">
            The big ones this season
          </SplitReveal>
        </div>
        <ButtonLink href="/events" variant="ghost" className="hidden md:inline-flex">
          All events <Arrow />
        </ButtonLink>
      </div>
      <div ref={track} className="no-scrollbar flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 md:snap-none md:overflow-visible md:px-8">
        {events.map((e) => (
          <div key={e.id} data-card className="w-[82vw] shrink-0 snap-start md:w-[min(34rem,38vw)]">
            <EventCard event={e} size="lg" />
          </div>
        ))}
      </div>
    </section>
  );
}
