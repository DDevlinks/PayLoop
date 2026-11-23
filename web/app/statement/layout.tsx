import type { Metadata } from "next";

// Route-segment layout so this client-component page gets its own <title> and
// description (issue #73). It renders its children unchanged.
export const metadata: Metadata = {
  title: "Income statement",
  description: "A printable on-chain income statement with a date range filter.",
};

export default function StatementLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
