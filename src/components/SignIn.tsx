"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Button } from "./Button";

type Props = { onSignedIn: () => void; intro?: string };

/** Email → 6 digit code → signed in. No passwords to forget. */
export function SignIn({ onSignedIn, intro }: Props) {
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const codeInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("hapnin:profile") || "{}");
      if (saved.email) setEmail(saved.email);
    } catch {}
  }, []);

  useEffect(() => {
    if (!cooldown) return;
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  const post = async (url: string, body: object) => {
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Something went wrong");
    return data;
  };

  const sendCode = async () => {
    setBusy(true);
    setError(null);
    try {
      await post("/api/auth/start", { email });
      setStep("code");
      setCode("");
      setCooldown(30);
      setTimeout(() => codeInput.current?.focus(), 350);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const verify = async (value = code) => {
    if (value.length !== 6) return;
    setBusy(true);
    setError(null);
    try {
      await post("/api/auth/verify", { email, code: value });
      onSignedIn();
    } catch (e) {
      setError((e as Error).message);
      setCode("");
      codeInput.current?.focus();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-md rounded-[28px] border border-line bg-ink-2 p-6 md:p-8">
      <AnimatePresence mode="wait" initial={false}>
        {step === "email" ? (
          <motion.form
            key="email"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.35 }}
            onSubmit={(e) => {
              e.preventDefault();
              sendCode();
            }}
          >
            <p className="eyebrow">Sign in</p>
            <h2 className="display mt-3 text-4xl">
              Your tickets, <span className="serif-i text-lime">one tap away.</span>
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-paper/60">{intro ?? "Use the email you registered with. We'll send you a 6 digit code, no password needed."}</p>
            <label className="mt-6 block">
              <span className="eyebrow mb-2 block">Email</span>
              <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="field" />
            </label>
            <Button type="submit" disabled={busy} className="mt-4 w-full !py-4">
              {busy ? "Sending…" : "Email me a code"}
            </Button>
          </motion.form>
        ) : (
          <motion.form
            key="code"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.35 }}
            onSubmit={(e) => {
              e.preventDefault();
              verify();
            }}
          >
            <p className="eyebrow">Check your inbox</p>
            <h2 className="display mt-3 text-4xl">
              Enter the <span className="serif-i text-lime">code.</span>
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-paper/60">
              Sent to <span className="text-paper">{email}</span>. It works for 10 minutes. Can&apos;t see it? Check spam.
            </p>

            <label className="relative mt-6 block cursor-text" onClick={() => codeInput.current?.focus()}>
              <span className="sr-only">6 digit code</span>
              <input
                ref={codeInput}
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="\d{6}"
                maxLength={6}
                value={code}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, "").slice(0, 6);
                  setCode(v);
                  if (v.length === 6) verify(v);
                }}
                className="absolute inset-0 h-full w-full opacity-0"
                aria-describedby="code-help"
              />
              <span className="grid grid-cols-6 gap-2" aria-hidden>
                {Array.from({ length: 6 }, (_, i) => {
                  const active = i === Math.min(code.length, 5);
                  return (
                    <span
                      key={i}
                      className={`flex aspect-[4/5] items-center justify-center rounded-2xl border font-mono text-2xl transition-colors ${
                        code[i] ? "border-paper/40 bg-paper/5" : active ? "border-lime" : "border-line"
                      }`}
                    >
                      {code[i] ?? ""}
                    </span>
                  );
                })}
              </span>
            </label>
            <p id="code-help" className="sr-only">
              Type or paste the 6 digit code from the email
            </p>

            <Button type="submit" disabled={busy || code.length !== 6} className="mt-5 w-full !py-4">
              {busy ? "Checking…" : "Sign in"}
            </Button>
            <div className="mt-4 flex justify-between text-xs text-mute">
              <button type="button" onClick={() => setStep("email")} className="hover:text-paper">
                ← Different email
              </button>
              <button type="button" disabled={cooldown > 0 || busy} onClick={sendCode} className="hover:text-paper disabled:opacity-50">
                {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
      {error && (
        <p role="alert" className="mt-4 text-sm text-[#ff9a9a]">
          {error}
        </p>
      )}
    </div>
  );
}
