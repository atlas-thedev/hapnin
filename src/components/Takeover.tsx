"use client";

import { useRef } from "react";
import { gsap, reducedMotion, useGSAP } from "@/lib/gsap";

/** A framed photo that grows to full-bleed while the section is pinned. */
export function Takeover({ src, lines }: { src: string; lines: string[] }) {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (reducedMotion()) return;
      const mm = gsap.matchMedia();
      mm.add({ wide: "(min-width: 768px)", narrow: "(max-width: 767px)" }, (ctx) => {
        const inset = ctx.conditions?.wide ? "28% 33% 28% 33%" : "30% 12% 30% 12%";
        const tl = gsap.timeline({
          scrollTrigger: { trigger: root.current, start: "top top", end: "+=160%", scrub: 1, pin: true },
        });
        tl.fromTo("[data-frame]", { clipPath: `inset(${inset} round 32px)` }, { clipPath: "inset(0% 0% 0% 0% round 0px)", ease: "power2.inOut", duration: 1 })
          .fromTo("[data-img]", { scale: 1.45 }, { scale: 1, ease: "power2.inOut", duration: 1 }, 0)
          .fromTo("[data-shade]", { opacity: 0 }, { opacity: 1, duration: 0.4 }, 0.55)
          .from("[data-line]", { yPercent: 110, stagger: 0.12, duration: 0.5, ease: "expo.out" }, 0.65)
          .to({}, { duration: 0.3 });
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} className="relative h-[100svh] overflow-hidden">
      <div data-frame className="absolute inset-0 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img data-img src={src} alt="" className="h-full w-full object-cover" />
        <div data-shade className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />
      </div>
      <div className="absolute inset-x-0 bottom-0 mx-auto max-w-[1600px] px-4 pb-14 md:px-8">
        {lines.map((l, i) => (
          <span key={i} className="-mb-[0.2em] block overflow-hidden pb-[0.2em] pr-[0.12em]">
            <span data-line className={`display block text-[clamp(3rem,9vw,9.5rem)] leading-[0.94] ${i === lines.length - 1 ? "serif-i text-lime" : ""}`}>
              {l}
            </span>
          </span>
        ))}
      </div>
    </section>
  );
}
