"use client";

import { useRef } from "react";
import { gsap, reducedMotion, useGSAP } from "@/lib/gsap";

type Token = string | { img: string; alt: string } | { emoji: string };

/** Paragraph whose words brighten as you scroll through it. */
export function Manifesto({ tokens, stats }: { tokens: Token[]; stats: { label: string; value: number }[] }) {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (reducedMotion()) return;
      gsap.fromTo(
        "[data-w]",
        { opacity: 0.14 },
        { opacity: 1, stagger: 0.1, ease: "none", scrollTrigger: { trigger: "[data-para]", start: "top 78%", end: "bottom 50%", scrub: true } },
      );
      gsap.utils.toArray<HTMLElement>("[data-count]").forEach((el) => {
        const target = Number(el.dataset.count);
        const obj = { v: 0 };
        gsap.to(obj, {
          v: target,
          duration: 2,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 90%", once: true },
          onUpdate: () => (el.textContent = Math.round(obj.v).toLocaleString("en")),
        });
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} className="mx-auto max-w-[1600px] px-4 py-32 md:px-8 md:py-48">
      <p className="eyebrow mb-10">(02) Why Hapnin</p>
      <p data-para className="display max-w-[22ch] text-[clamp(2.2rem,5.4vw,5.6rem)] leading-[1.02] tracking-[-0.035em]">
        {tokens.map((t, i) => {
          if (typeof t === "string")
            return t.split(" ").map((w, j) => (
              <span key={`${i}-${j}`} data-w className="inline-block pr-[0.25em]">
                {w}
              </span>
            ));
          if ("img" in t)
            return (
              <span key={i} data-w className="relative mr-[0.25em] inline-block h-[0.8em] w-[1.5em] overflow-hidden rounded-full align-[-0.08em]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={t.img} alt={t.alt} className="h-full w-full object-cover" />
              </span>
            );
          return (
            <span key={i} data-w className="mr-[0.25em] inline-flex h-[0.85em] w-[0.85em] items-center justify-center rounded-full bg-paper/10 align-[-0.08em] text-[0.55em]">
              {t.emoji}
            </span>
          );
        })}
      </p>

      <div className="mt-24 grid grid-cols-2 gap-px overflow-hidden rounded-[28px] border border-line bg-line md:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-ink p-6 md:p-8">
            <span data-count={s.value} className="display block text-5xl md:text-7xl">
              {s.value.toLocaleString("en")}
            </span>
            <span className="eyebrow mt-3 block">{s.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
