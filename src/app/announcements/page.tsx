import type { Metadata } from "next";
import { listAnnouncements } from "@/lib/queries";
import { PageHeader } from "@/components/PageHeader";
import { AnnouncementList } from "@/components/AnnouncementList";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Announcements" };

export default async function AnnouncementsPage() {
  const items = await listAnnouncements(100);
  return (
    <>
      <PageHeader index="N" eyebrow="Noticeboard" title="The" accent="news.">
        Schedule changes, reminders and the occasional lost water bottle. Urgent notices are pinned to the top.
      </PageHeader>
      <div className="mx-auto max-w-4xl px-4 pb-32 md:px-8">
        <AnnouncementList initial={items} filterable />
      </div>
    </>
  );
}