import type { Metadata } from "next";

// Route-segment layout so this client-component page gets its own <title> and
// description (issue #73). It renders its children unchanged.
export const metadata: Metadata = {
  title: "Withdraw",
  description: "Cash out your USDC balance to local currency.",
};

export default function WithdrawLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
