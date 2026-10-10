"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../Button";
import { TLink } from "../PageTransition";

export function AdminLogin() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <section className="grid min-h-[100svh] md:grid-cols-2">
      <div className="relative hidden overflow-hidden md:block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/img/concert.webp" alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink to-transparent" />
        <p className="display absolute bottom-10 left-10 text-7xl">
          Run the <span className="serif-i text-lime">show.</span>
        </p>
      </div>
      <div className="flex flex-col justify-center px-6 py-20 md:px-16">
        <TLink href="/" className="display mb-16 text-3xl">
          hapnin<span className="text-lime">✱</span>
        </TLink>
        <p className="eyebrow">Organisers only</p>
        <h1 className="display mt-3 text-5xl">Sign in</h1>
        <form
          className="mt-10 max-w-sm space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError(null);
            const res = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
            setBusy(false);
            if (res.ok) router.refresh();
            else setError((await res.json()).error ?? "Couldn't sign in");
          }}
        >
          <label className="block">
            <span className="eyebrow mb-2 block">Password</span>
            <input type="password" required autoComplete="current-password" className="field" value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
          {error && <p className="text-sm text-[#ff9a9a]">{error}</p>}
          <Button type="submit" disabled={busy} className="w-full">
            {busy ? "Checking…" : "Open dashboard"}
          </Button>
        </form>
      </div>
    </section>
  );
}
