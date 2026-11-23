import type { Metadata } from "next";

// Route-segment layout so this client-component page gets its own <title> and
// description (issue #73). It renders its children unchanged.
export const metadata: Metadata = {
  title: "Pitch",
  description: "What PayLoop is and why African freelancers use it.",
};

export default function PitchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
