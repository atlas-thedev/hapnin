import { ButtonLink, Arrow } from "@/components/Button";

export default function NotFound() {
  return (
    <section className="flex min-h-[100svh] flex-col items-start justify-end px-4 pb-20 md:px-8">
      <p className="eyebrow mb-6">404</p>
      <h1 className="display text-[clamp(4rem,16vw,16rem)] leading-[0.82]">
        Nothing&apos;s <span className="serif-i text-lime">hapnin&apos;</span> here.
      </h1>
      <ButtonLink href="/events" className="mt-10">
        Find an event <Arrow />
      </ButtonLink>
    </section>
  );
}