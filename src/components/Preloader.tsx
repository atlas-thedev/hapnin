"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

const WORDS = ["debates", "big matches", "concerts", "expos", "everything"];

export function Preloader() {
  const [show, setShow] = useState(false);
  const [count, setCount] = useState(0);
  const [word, setWord] = useState(0);

  useEffect(() => {
    if (sessionStorage.getItem("hapnin:loaded")) return;
    setShow(true);
    document.documentElement.style.overflow = "hidden";

    const start = performance.now();
    const duration = 1900;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setCount(Math.round(eased * 100));
      setWord(Math.min(WORDS.length - 1, Math.floor(eased * WORDS.length)));
      if (p < 1) raf = requestAnimationFrame(tick);
      else
        setTimeout(() => {
          sessionStorage.setItem("hapnin:loaded", "1");
          document.documentElement.style.overflow = "";
          setShow(false);
          window.dispatchEvent(new Event("hapnin:ready"));
        }, 250);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[90] flex flex-col justify-between bg-lime p-6 text-ink md:p-10"
          exit={{ clipPath: "inset(0 0 100% 0)" }}
          initial={{ clipPath: "inset(0 0 0% 0)" }}
          transition={{ duration: 0.9, ease: [0.85, 0, 0.15, 1] }}
        >
          <div className="flex justify-between font-mono text-xs uppercase tracking-widest">
            <span>Hapnin*</span>
            <span>School events, sorted</span>
          </div>
          <div>
            <div className="display text-[13vw] leading-none md:text-[9vw]">
              all the
              <span className="relative ml-[0.25em] inline-block h-[0.9em] overflow-hidden align-bottom">
                <AnimatePresence mode="popLayout">
                  <motion.span
                    key={word}
                    className="serif-i inline-block"
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "-100%" }}
                    transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                  >
                    {WORDS[word]}
                  </motion.span>
                </AnimatePresence>
              </span>
            </div>
          </div>
          <div className="flex items-end justify-between">
            <div className="h-px w-1/2 bg-ink/20">
              <div className="h-px bg-ink" style={{ width: `${count}%` }} />
            </div>
            <span className="display text-7xl tabular-nums md:text-9xl">{count}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
