"use client";

import { useRef } from "react";
import { gsap, reducedMotion, useGSAP } from "@/lib/gsap";

export function ParallaxCover({ src }: { src: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      if (reducedMotion()) return;
      gsap.fromTo("img", { scale: 1.25, clipPath: "inset(8% 6% 8% 6% round 32px)" }, { scale: 1.08, clipPath: "inset(0% 0% 0% 0% round 0px)", duration: 1.8, ease: "expo.inOut" });
      gsap.to("img", { yPercent: 18, ease: "none", scrollTrigger: { trigger: ref.current, start: "top top", end: "bottom top", scrub: true } });
    },
    { scope: ref },
  );
  return (
    <div ref={ref} className="absolute inset-0 overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" className="h-full w-full object-cover" />
    </div>
  );
}
