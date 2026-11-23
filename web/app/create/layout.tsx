import type { Metadata } from "next";

// Route-segment layout so this client-component page gets its own <title> and
// description (issue #73). It renders its children unchanged.
export const metadata: Metadata = {
  title: "New invoice",
  description: "Create a USDC invoice for a client and share a payment link.",
};

export default function CreateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
