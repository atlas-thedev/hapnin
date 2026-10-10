import type { Metadata } from "next";
import { isAdmin } from "@/lib/auth";
import { listAnnouncements, listEvents, listUpdates, stats } from "@/lib/queries";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { AdminDashboard } from "@/components/admin/AdminDashboard";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Organiser dashboard", robots: { index: false } };

export default async function AdminPage() {
  if (!(await isAdmin())) return <AdminLogin />;
  const [events, announcements, updates, s] = await Promise.all([
    listEvents({ includeDrafts: true, limit: 200 }),
    listAnnouncements(100),
    listUpdates(undefined, 50),
    stats(),
  ]);
  return <AdminDashboard events={events} announcements={announcements} updates={updates} stats={s} />;
}
