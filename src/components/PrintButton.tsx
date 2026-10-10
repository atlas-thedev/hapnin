"use client";

export function PrintButton() {
  return (
    <button onClick={() => window.print()} className="rounded-full bg-lime px-5 py-3 text-sm font-medium text-ink">
      Save / print
    </button>
  );
}