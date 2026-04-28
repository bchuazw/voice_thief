import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Voice Thief",
  description:
    "A noir heist puzzle. You have no voice. Steal theirs. Built with ElevenLabs.",
  openGraph: {
    title: "Voice Thief",
    description:
      "A noir heist where the only weapon is the voices of the people you've recorded.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Crimson+Pro:ital,wght@0,400;0,600;1,400&family=Inter:wght@400;600;800&family=JetBrains+Mono:wght@400;600&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
