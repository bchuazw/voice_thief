import type { Metadata } from "next";
import { Crimson_Pro, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const crimson = Crimson_Pro({ subsets: ["latin"], variable: "--font-crimson" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains" });

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
    <html lang="en" className={`${inter.variable} ${crimson.variable} ${jetbrains.variable}`}>
      <body>{children}</body>
    </html>
  );
}
