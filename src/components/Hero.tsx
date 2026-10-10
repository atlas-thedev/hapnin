"use client";

import { useRef } from "react";
import type { EventRow } from "@/lib/types";
import { fmtDay, fmtTime } from "@/lib/time";
import { gsap, onReady, reducedMotion, loosenMasks, SplitText, useGSAP } from "@/lib/gsap";
import { ButtonLink, Arrow } from "./Button";
import { Magnetic } from "./Magnetic";
import { Countdown } from "./Countdown";
import { TLink } from "./PageTransition";

export function Hero({ next, covers, liveCount }: { next: EventRow | null; covers: string[]; liveCount: number }) {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const images = q("[data-pill-img]");

      // Pill slideshow: each image wipes in from the bottom over the previous one.
      gsap.set(images.slice(1), { clipPath: "inset(100% 0 0 0)" });
      let i = 0;
      const cycle = gsap.delayedCall(2.2, function step() {
        const prev = images[i];
        i = (i + 1) % images.length;
        gsap.set(images[i], { zIndex: 2 });
        gsap.set(prev, { zIndex: 1 });
        gsap.fromTo(images[i], { clipPath: "inset(100% 0 0 0)", scale: 1.3 }, { clipPath: "inset(0% 0 0 0)", scale: 1, duration: 1.1, ease: "expo.inOut" });
        cycle.restart(true);
      });

      gsap.set(root.current, { visibility: "visible" });
      if (reducedMotion()) return;

      const split = SplitText.create(q("[data-split]"), { type: "chars", mask: "chars" });
      loosenMasks(split.masks);
      const tl = gsap.timeline({ paused: true });
      tl.from(split.chars, { yPercent: 120, duration: 1.4, stagger: 0.035, ease: "expo.out" })
        .from(q("[data-pill]"), { width: 0, duration: 1.4, ease: "expo.inOut" }, 0.2)
        .from(q("[data-fade]"), { y: 30, opacity: 0, stagger: 0.08, duration: 1.2 }, 0.6);
      const off = onReady(() => tl.play());

      // Headline drifts up and dims as you scroll away.
      gsap.to(q("[data-headline]"), {
        yPercent: -18,
        opacity: 0.25,
        ease: "none",
        scrollTrigger: { trigger: root.current, start: "top top", end: "bottom top", scrub: true },
      });

      return () => {
        off();
        split.revert();
      };
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      className="relative flex min-h-[100svh] flex-col justify-between overflow-hidden px-4 pb-8 pt-28 md:px-8 md:pt-32"
      style={{ visibility: "hidden" }}
    >
      <div className="pointer-events-none absolute -right-40 top-10 h-[40rem] w-[40rem] rounded-full bg-lime/10 blur-[140px]" />
      <div className="pointer-events-none absolute -left-40 bottom-0 h-[30rem] w-[30rem] rounded-full bg-pink/10 blur-[140px]" />

      <div data-fade className="mx-auto flex w-full max-w-[1600px] justify-between eyebrow">
        <span>(01) School events, sorted</span>
        <span className="hidden md:inline">Royal College · Colombo 07</span>
        <span>Season 2026</span>
      </div>

      <h1 data-headline className="display mx-auto w-full max-w-[1600px] relative text-[20vw] leading-[0.84] md:text-[clamp(4.2rem,14.5vw,16rem)] md:leading-[0.82]">
        <span data-split className="block">What&apos;s</span>
        <SpinBadge />
        <span className="flex items-center gap-[0.12em]">
          <span data-pill className="relative inline-block h-[0.66em] w-[1.2em] shrink-0 md:h-[0.72em] md:w-[1.75em] overflow-hidden rounded-full" data-cursor="Look">
            {covers.map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={src} data-pill-img src={src} alt="" fetchPriority={i === 0 ? "high" : "low"} decoding="async" className="absolute inset-0 h-full w-full object-cover" style={{ zIndex: i === 0 ? 2 : 0 }} />
            ))}
          </span>
          <span data-split className="serif-i text-lime">hapnin&apos;</span>
        </span>
        <span data-split className="block text-right">
          at school<span className="text-lime">.</span>
        </span>
      </h1>

      <div className="mx-auto grid w-full max-w-[1600px] items-end gap-8 md:grid-cols-[1fr_auto]">
        <div data-fade className="max-w-md">
          <p className="text-base leading-relaxed text-paper/75 md:text-lg">
            Debates, sports meets, exhibitions and concerts in one place. Find what&apos;s on, grab a ticket and follow along live.
          </p>
          <div className="mt-6 flex flex-wrap gap-3 md:mt-7">
            <Magnetic>
              <ButtonLink href="/events" data-cursor="Go">
                Explore events <Arrow />
              </ButtonLink>
            </Magnetic>
            <Magnetic>
              <ButtonLink href={liveCount ? "/live" : "/calendar"} variant="ghost">
                {liveCount ? (
                  <>
                    <span className="live-dot" /> {liveCount} live now
                  </>
                ) : (
                  "Open calendar"
                )}
              </ButtonLink>
            </Magnetic>
          </div>
        </div>

        {next && (
          <TLink
            data-fade
            href={`/events/${next.slug}`}
            data-cursor="View"
            className="group relative block w-full overflow-hidden rounded-[28px] border border-line bg-ink-2/80 p-5 backdrop-blur md:w-[26rem]"
          >
            <div className="flex items-center justify-between">
              <span className="eyebrow">Next up</span>
              <span className="eyebrow">{fmtDay(next.starts_at)} · {fmtTime(next.starts_at)}</span>
            </div>
            <p className="display mt-4 text-3xl leading-none transition-colors group-hover:text-lime">{next.title}</p>
            <Countdown to={next.starts_at} size="sm" className="mt-5" />
          </TLink>
        )}
      </div>
    </section>
  );
}

/** Slowly spinning sticker that sits beside the first headline line. */
function SpinBadge() {
  const text = "Tickets ✱ Calendar ✱ Live updates ✱ ";
  return (
    <span data-fade aria-hidden className="absolute right-0 top-[0.04em] block h-[0.82em] w-[0.82em] md:right-[4%] md:top-[0.1em] md:h-[0.8em] md:w-[0.8em]">
      <svg viewBox="0 0 100 100" className="h-full w-full animate-[spin_14s_linear_infinite] motion-reduce:animate-none">
        <defs>
          <path id="badge-circle" d="M50 50m-38 0a38 38 0 1 1 76 0a38 38 0 1 1-76 0" />
        </defs>
        <text className="fill-paper/70 font-mono uppercase" style={{ fontSize: 9.4, letterSpacing: "0.12em" }}>
          <textPath href="#badge-circle" textLength="238" lengthAdjust="spacing">{text}</textPath>
        </text>
      </svg>
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
        <circle cx="50" cy="50" r="19" className="fill-lime" />
        <g transform="translate(50 50)" className="stroke-ink" strokeWidth="5.5" strokeLinecap="round">
          <path d="M0-10V10" />
          <path d="M0-10V10" transform="rotate(60)" />
          <path d="M0-10V10" transform="rotate(120)" />
        </g>
      </svg>
    </span>
  );
}
