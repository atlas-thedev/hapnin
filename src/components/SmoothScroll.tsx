"use client";

import { ReactLenis, useLenis, type LenisRef } from "lenis/react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";

function Sync() {
  const pathname = usePathname();
  const lenis = useLenis(ScrollTrigger.update);

  useEffect(() => {
    lenis?.scrollTo(0, { immediate: true, force: true });
    const id = setTimeout(() => ScrollTrigger.refresh(), 120);
    return () => clearTimeout(id);
  }, [pathname, lenis]);
  return null;
}

export function SmoothScroll({ children }: { children: ReactNode }) {
  const ref = useRef<LenisRef>(null);

  // Drive Lenis from GSAP's ticker so ScrollTrigger and smooth scroll share one clock.
  useEffect(() => {
    const raf = (time: number) => ref.current?.lenis?.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);
    return () => gsap.ticker.remove(raf);
  }, []);

  return (
    <ReactLenis root ref={ref} options={{ autoRaf: false, lerp: 0.085, wheelMultiplier: 1 }}>
      <Sync />
      {children}
    </ReactLenis>
  );
}
