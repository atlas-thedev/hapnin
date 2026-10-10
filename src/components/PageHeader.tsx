import type { ReactNode } from "react";
import { SplitReveal } from "./Reveal";

export function PageHeader({ index, eyebrow, title, accent, children }: { index: string; eyebrow: string; title: string; accent?: string; children?: ReactNode }) {
  return (
    <header className="mx-auto max-w-[1600px] px-4 pb-12 pt-36 md:px-8 md:pt-44">
      <p className="eyebrow mb-6">
        ({index}) {eyebrow}
      </p>
      <h1 className="display text-[clamp(3.6rem,12vw,13rem)] leading-[0.84]">
        <SplitReveal as="span" by="chars" trigger="load" className="block">
          {title}
        </SplitReveal>
        {accent && (
          <SplitReveal as="span" by="chars" trigger="load" delay={0.25} className="serif-i block text-lime">
            {accent}
          </SplitReveal>
        )}
      </h1>
      {children && <div className="mt-8 max-w-xl text-lg text-paper/70">{children}</div>}
    </header>
  );
}
