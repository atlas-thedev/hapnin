"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ComponentProps, type ReactNode } from "react";
import { gsap } from "@/lib/gsap";

const NavigateCtx = createContext<(href: string) => void>(() => {});
export const usePageTransition = () => useContext(NavigateCtx);

const LABELS: [RegExp, string][] = [
  [/^\/$/, "Home"],
  [/^\/events\/.+/, "Event"],
  [/^\/events/, "Events"],
  [/^\/calendar/, "Calendar"],
  [/^\/live/, "Live"],
  [/^\/announcements/, "News"],
  [/^\/tickets/, "Tickets"],
  [/^\/admin/, "Admin"],
];

export function TransitionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const curtain = useRef<HTMLDivElement>(null);
  const busy = useRef(false);
  const [label, setLabel] = useState("");

  const reveal = useCallback(() => {
    const el = curtain.current;
    if (!el) return;
    gsap.to(el, {
      yPercent: -100,
      duration: 0.8,
      ease: "power4.inOut",
      delay: 0.05,
      onComplete: () => {
        gsap.set(el, { display: "none" });
        busy.current = false;
      },
    });
    gsap.to(el.querySelector("[data-label]"), { yPercent: -60, opacity: 0, duration: 0.5, ease: "power2.in" });
  }, []);

  const navigate = useCallback(
    (href: string) => {
      const url = new URL(href, window.location.href);
      if (url.origin !== window.location.origin) {
        window.location.href = href;
        return;
      }
      if (url.pathname === window.location.pathname) {
        router.push(href);
        return;
      }
      if (busy.current) return;
      busy.current = true;
      setLabel(LABELS.find(([re]) => re.test(url.pathname))?.[1] ?? "");

      const el = curtain.current!;
      gsap
        .timeline()
        .set(el, { display: "flex", yPercent: 100 })
        .set(el.querySelector("[data-label]"), { yPercent: 60, opacity: 0 })
        .to(el, { yPercent: 0, duration: 0.65, ease: "power4.inOut" })
        .to(el.querySelector("[data-label]"), { yPercent: 0, opacity: 1, duration: 0.5 }, "-=0.25")
        .add(() => router.push(href));

      // Never leave the curtain stuck if a navigation fails.
      setTimeout(() => busy.current && reveal(), 6000);
    },
    [router, reveal],
  );

  useEffect(() => {
    if (busy.current) reveal();
  }, [pathname, reveal]);

  return (
    <NavigateCtx.Provider value={navigate}>
      {children}
      <div
        ref={curtain}
        aria-hidden
        className="fixed inset-0 z-[80] hidden items-end justify-start bg-lime p-6 text-ink md:p-10"
      >
        <span data-label className="display text-[18vw] leading-none md:text-[12vw]">
          {label}
          <span className="serif-i">.</span>
        </span>
      </div>
    </NavigateCtx.Provider>
  );
}

export function TLink({ href, onClick, ...rest }: ComponentProps<typeof Link>) {
  const navigate = usePageTransition();
  return (
    <Link
      href={href}
      {...rest}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0 || rest.target === "_blank") return;
        e.preventDefault();
        navigate(typeof href === "string" ? href : href.pathname ?? "/");
      }}
    />
  );
}
