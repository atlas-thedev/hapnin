import clsx from "clsx";
import type { ComponentProps, ReactNode } from "react";
import { TLink } from "./PageTransition";

type Variant = "lime" | "ghost" | "paper";

const styles: Record<Variant, string> = {
  lime: "bg-lime text-ink",
  paper: "bg-paper text-ink",
  ghost: "border border-line text-paper hover:border-paper/50",
};

const base =
  "group relative inline-flex shrink-0 items-center whitespace-nowrap justify-center gap-2 overflow-hidden rounded-full px-6 py-3.5 text-sm font-medium transition-[transform,border-color] duration-300 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50";

function Label({ children }: { children: ReactNode }) {
  // Text rolls up on hover: the second copy slides into place.
  return (
    <span className="relative block overflow-hidden">
      <span className="flex items-center gap-2 whitespace-nowrap transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-full">{children}</span>
      <span aria-hidden className="absolute inset-0 flex items-center gap-2 whitespace-nowrap translate-y-full transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-y-0">
        {children}
      </span>
    </span>
  );
}

export function ButtonLink({ href, variant = "lime", className, children, ...rest }: ComponentProps<typeof TLink> & { variant?: Variant }) {
  return (
    <TLink href={href} className={clsx(base, styles[variant], className)} {...rest}>
      <Label>{children}</Label>
    </TLink>
  );
}

export function Button({ variant = "lime", className, children, ...rest }: ComponentProps<"button"> & { variant?: Variant }) {
  return (
    <button className={clsx(base, styles[variant], className)} {...rest}>
      <Label>{children}</Label>
    </button>
  );
}

export const Arrow = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={clsx("h-4 w-4", className)} fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);
