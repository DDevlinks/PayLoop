import type { Metadata } from "next";

// Route-segment layout so this client-component page gets its own <title> and
// description (issue #73). It renders its children unchanged.
export const metadata: Metadata = {
  title: "On-chain activity",
  description: "Public, verifiable activity on the PayLoop contract.",
};

export default function ActivityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
