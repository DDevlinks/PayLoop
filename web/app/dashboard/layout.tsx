import type { Metadata } from "next";

// Route-segment layout so this client-component page gets its own <title> and
// description (issue #73). It renders its children unchanged.
export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your PayLoop balance, pending invoices and payment reminders.",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
