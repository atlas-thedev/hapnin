"use client";

import { useRef, type ElementType, type ReactNode } from "react";
import { gsap, onReady, reducedMotion, SplitText, useGSAP } from "@/lib/gsap";

type Props = {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  delay?: number;
  /** "scroll" waits for the element to enter the viewport, "load" plays after the preloader. */
  trigger?: "scroll" | "load";
  by?: "lines" | "words" | "chars";
};

/** Masked text reveal powered by GSAP SplitText. Re-splits on resize and font load. */
export function SplitReveal({ children, as: Tag = "div", className, delay = 0, trigger = "scroll", by = "lines" }: Props) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || reducedMotion()) return;
      gsap.set(el, { visibility: "visible" });
      let cleanup = () => {};

      const split = SplitText.create(el, {
        type: by === "chars" ? "lines,words,chars" : by === "words" ? "lines,words" : "lines",
        mask: "lines",
        autoSplit: true,
        onSplit(self) {
          const targets = by === "chars" ? self.chars : by === "words" ? self.words : self.lines;
          const tween = gsap.from(targets, {
            yPercent: 115,
            rotate: by === "lines" ? 0 : 6,
            duration: by === "chars" ? 1.1 : 1.2,
            stagger: by === "chars" ? 0.025 : by === "words" ? 0.05 : 0.09,
            delay,
            paused: trigger === "load",
            scrollTrigger: trigger === "scroll" ? { trigger: el, start: "top 88%", once: true } : undefined,
          });
          if (trigger === "load") cleanup = onReady(() => tween.play());
          return tween;
        },
      });
      return () => {
        cleanup();
        split.revert();
      };
    },
    { scope: ref },
  );

  return (
    <Tag ref={ref} className={className} style={{ visibility: "hidden" }}>
      {children}
    </Tag>
  );
}

/** Fade + lift for blocks. */
export function FadeUp({ children, className, delay = 0, y = 40 }: { children: ReactNode; className?: string; delay?: number; y?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      if (reducedMotion()) return;
      gsap.from(ref.current, {
        y,
        opacity: 0,
        duration: 1.2,
        delay,
        scrollTrigger: { trigger: ref.current, start: "top 90%", once: true },
      });
    },
    { scope: ref },
  );
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
