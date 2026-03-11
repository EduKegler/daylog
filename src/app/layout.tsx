import type { Metadata } from "next";
import { Instrument_Serif, DM_Sans } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import { WebVitals } from "./components/web-vitals";
import { Providers } from "./providers";
import { Footer } from "./components/footer";
import { TimezoneDetector } from "./components/timezone-detector";
import "./globals.css";

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-instrument-serif",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"
  ),
  title: {
    default: "Daylog",
    template: "%s | Daylog",
  },
  description:
    "Track your daily tasks, build streaks, and stay on top of what matters.",
  openGraph: {
    title: "Daylog",
    description:
      "Track your daily tasks, build streaks, and stay on top of what matters.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Daylog",
    description:
      "Track your daily tasks, build streaks, and stay on top of what matters.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${instrumentSerif.variable} ${dmSans.variable}`}>
      <body className="flex flex-col min-h-screen">
        {process.env.NEXT_PUBLIC_GA_ID && (
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
        )}
        <WebVitals />
        <TimezoneDetector />
        <div className="flex-1">
          <Providers>{children}</Providers>
        </div>
        <Footer />
      </body>
    </html>
  );
}
