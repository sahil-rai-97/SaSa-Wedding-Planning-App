import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "RSVP — Sahil & Saloni's Wedding",
  description:
    "RSVP for Sahil & Saloni's wedding on April 26, 2026 at Old Mill Park Amphitheatre.",
};

export default function RsvpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
