"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);
  gsap.defaults({ ease: "expo.out", duration: 1 });
}

export const reducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Runs the callback once the preloader has finished (or right away if it already has). */
export function onReady(cb: () => void) {
  if (typeof window === "undefined") return () => {};
  if (sessionStorage.getItem("hapnin:loaded")) {
    cb();
    return () => {};
  }
  window.addEventListener("hapnin:ready", cb, { once: true });
  return () => window.removeEventListener("hapnin:ready", cb);
}

export { gsap, ScrollTrigger, SplitText, useGSAP };
