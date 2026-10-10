"use client";

import { AnimatePresence, motion } from "motion/react";
import clsx from "clsx";
import { Children, isValidElement, useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type ReactElement, type ReactNode } from "react";
import { createPortal } from "react-dom";

type Opt = { value: string; label: ReactNode; text: string };
type Props = {
  value: string;
  onChange: (value: string) => void;
  children: ReactNode; // plain <option>s, so swapping from a native <select> is painless
  className?: string;
  placeholder?: string;
  "aria-label"?: string;
};

const textOf = (n: ReactNode): string =>
  typeof n === "string" || typeof n === "number" ? String(n) : Array.isArray(n) ? n.map(textOf).join("") : isValidElement(n) ? textOf((n.props as { children?: ReactNode }).children) : "";

/**
 * Custom dropdown. The native one can't be styled on most browsers (that bright blue list),
 * so this is a button + listbox with the same keyboard behaviour: arrows, Home/End, Enter, Esc and type-to-jump.
 * The list is portalled to <body> so it isn't clipped inside the scrollable register dialog.
 */
// native select එක style කරන්න බෑ, chrome එකේ නිල් පාටට එනවා. ඒකයි මේක හැදුවේ
export function Select({ value, onChange, children, className, placeholder = "Choose…", ...rest }: Props) {
  const options: Opt[] = Children.toArray(children)
    .filter((c): c is ReactElement<{ value?: string | number; children?: ReactNode }> => isValidElement(c))
    .map((c) => ({ value: String(c.props.value ?? ""), label: c.props.children, text: textOf(c.props.children).trim() }));

  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [pos, setPos] = useState<{ left: number; width: number; top?: number; bottom?: number; maxH: number } | null>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const typed = useRef({ s: "", t: 0 });
  const id = useId();
  const selected = options.findIndex((o) => o.value === value);

  const place = useCallback(() => {
    const r = btn.current?.getBoundingClientRect();
    if (!r) return;
    const below = window.innerHeight - r.bottom - 12;
    const above = r.top - 12;
    const up = below < 220 && above > below;
    setPos({ left: r.left, width: r.width, ...(up ? { bottom: window.innerHeight - r.top + 6 } : { top: r.bottom + 6 }), maxH: Math.min(300, up ? above : below) });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    place();
    const onMove = () => place();
    window.addEventListener("resize", onMove);
    window.addEventListener("scroll", onMove, true);
    return () => {
      window.removeEventListener("resize", onMove);
      window.removeEventListener("scroll", onMove, true);
    };
  }, [open, place]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!btn.current?.contains(t) && !list.current?.contains(t)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  useEffect(() => {
    if (open) list.current?.querySelector<HTMLElement>(`[data-i="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [open, active]);

  const show = () => {
    setActive(Math.max(0, selected));
    setOpen(true);
  };
  const pick = (i: number) => {
    const o = options[i];
    if (o) onChange(o.value);
    setOpen(false);
    btn.current?.focus();
  };

  const onKey = (e: React.KeyboardEvent) => {
    const last = options.length - 1;
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        show();
      }
      return;
    }
    if (e.key === "ArrowDown") setActive((a) => Math.min(last, a + 1));
    else if (e.key === "ArrowUp") setActive((a) => Math.max(0, a - 1));
    else if (e.key === "Home") setActive(0);
    else if (e.key === "End") setActive(last);
    else if (e.key === "Enter" || e.key === " ") pick(active);
    else if (e.key === "Escape" || e.key === "Tab") {
      if (e.key === "Escape") e.stopPropagation(); // don't close the dialog behind us
      setOpen(false);
      return;
    } else if (e.key.length === 1) {
      const now = Date.now();
      typed.current = { s: (now - typed.current.t < 600 ? typed.current.s : "") + e.key.toLowerCase(), t: now };
      const hit = options.findIndex((o) => o.text.toLowerCase().startsWith(typed.current.s));
      if (hit >= 0) setActive(hit);
      return;
    } else return;
    e.preventDefault();
  };

  return (
    <>
      <button
        ref={btn}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={id}
        aria-activedescendant={open ? `${id}-${active}` : undefined}
        aria-label={rest["aria-label"]}
        onClick={() => (open ? setOpen(false) : show())}
        onKeyDown={onKey}
        className={clsx("field flex items-center justify-between gap-3 text-left", open && "!border-lime !bg-lime/[0.04]", className)}
      >
        <span className={clsx("truncate", selected < 0 && "text-paper/35")}>{selected >= 0 ? options[selected].label : placeholder}</span>
        <svg viewBox="0 0 16 16" className={clsx("size-4 shrink-0 text-paper/50 transition-transform duration-300", open && "rotate-180 text-lime")} aria-hidden>
          <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {open && pos && (
              <motion.ul
                ref={list}
                id={id}
                role="listbox"
                data-lenis-prevent
                initial={{ opacity: 0, y: pos.top !== undefined ? -8 : 8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: pos.top !== undefined ? -6 : 6, scale: 0.98, transition: { duration: 0.15 } }}
                transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                style={{ position: "fixed", left: pos.left, width: Math.max(pos.width, 180), top: pos.top, bottom: pos.bottom, maxHeight: pos.maxH, transformOrigin: pos.top !== undefined ? "top" : "bottom" }}
                className="z-[100] overflow-y-auto rounded-2xl border border-line bg-ink-2/95 p-1.5 shadow-[0_24px_60px_-12px_rgba(0,0,0,0.7)] backdrop-blur-xl"
              >
                {options.map((o, i) => {
                  const isSel = i === selected;
                  return (
                    <li
                      key={o.value + i}
                      id={`${id}-${i}`}
                      data-i={i}
                      role="option"
                      aria-selected={isSel}
                      onPointerMove={() => setActive(i)}
                      onClick={() => pick(i)}
                      className={clsx(
                        "relative flex cursor-pointer items-center justify-between gap-3 rounded-xl px-3.5 py-2.5 text-[15px] transition-colors",
                        i === active ? "text-ink" : isSel ? "text-lime" : "text-paper/80",
                      )}
                    >
                      {i === active && <motion.span layoutId={`${id}-hl`} className="absolute inset-0 rounded-xl bg-lime" transition={{ type: "spring", stiffness: 600, damping: 40 }} />}
                      <span className="relative truncate">{o.label}</span>
                      {isSel && (
                        <svg viewBox="0 0 16 16" className="relative size-4 shrink-0" aria-hidden>
                          <path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </li>
                  );
                })}
              </motion.ul>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}
