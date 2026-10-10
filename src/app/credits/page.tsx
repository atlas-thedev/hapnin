import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { PHOTO_CREDITS } from "@/lib/credits";

export const metadata: Metadata = { title: "Photo credits" };

export default function CreditsPage() {
  return (
    <>
      <PageHeader index="C" eyebrow="Thank you" title="Photo" accent="credits.">
        The photos are real ones from Wikimedia Commons, shared by the people below under open licences. Some are cropped and resized.
      </PageHeader>
      <ul className="mx-auto grid max-w-[1600px] gap-4 px-4 pb-32 sm:grid-cols-2 md:px-8 lg:grid-cols-3">
        {PHOTO_CREDITS.map((c) => (
          <li key={c.file} className="overflow-hidden rounded-[22px] border border-line bg-ink-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={c.file.replace(".webp", "-sm.webp")} alt="" loading="lazy" className="aspect-[4/3] w-full object-cover" />
            <div className="p-5 text-sm">
              <p className="eyebrow">{c.usedFor}</p>
              <p className="mt-2 text-paper/80">
                <a href={c.source} target="_blank" rel="noreferrer" className="underline decoration-line underline-offset-4 hover:text-lime">
                  {c.title.replace(/\.(jpe?g|png)$/i, "")}
                </a>
              </p>
              <p className="mt-1 text-mute">
                by {c.author} ·{" "}
                {c.licenseUrl ? (
                  <a href={c.licenseUrl} target="_blank" rel="noreferrer" className="hover:text-paper">
                    {c.license}
                  </a>
                ) : (
                  c.license
                )}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
