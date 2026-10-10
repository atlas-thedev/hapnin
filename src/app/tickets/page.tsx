import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { TicketLookup } from "@/components/TicketLookup";

export const metadata: Metadata = { title: "My tickets" };

export default function TicketsPage() {
  return (
    <>
      <PageHeader index="T" eyebrow="Your passes" title="My" accent="tickets.">
        Every ticket you've booked and its QR code, in one place.
      </PageHeader>
      <div className="mx-auto max-w-[1600px] px-4 pb-32 md:px-8">
        <TicketLookup />
      </div>
    </>
  );
}