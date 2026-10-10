import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { TicketLookup } from "@/components/TicketLookup";

export const metadata: Metadata = { title: "My tickets" };

export default function TicketsPage() {
  return (
    <>
      <PageHeader index="T" eyebrow="Your passes" title="My" accent="tickets.">
        Enter the email you registered with to pull up every ticket and its QR code.
      </PageHeader>
      <div className="mx-auto max-w-4xl px-4 pb-32 md:px-8">
        <TicketLookup />
      </div>
    </>
  );
}