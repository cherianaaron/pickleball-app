import type { Metadata } from "next";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { TournamentProvider } from "./context/TournamentContext";
import { AuthProvider } from "./context/AuthContext";
import { SubscriptionProvider } from "./context/SubscriptionContext";
import Navigation from "./components/Navigation";
import WinnerDisplay from "./components/WinnerDisplay";
import Footer from "./components/Footer";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "PickleBracket | Tournament Manager",
  description: "Create and manage pickleball tournaments with ease. Generate brackets, track scores, and crown champions!",
  icons: {
    icon: [
      { url: "/picklebracket-logo.svg", type: "image/svg+xml" },
    ],
    shortcut: "/picklebracket-logo.svg",
    apple: [
      { url: "/picklebracket-logo.svg", sizes: "180x180", type: "image/svg+xml" },
    ],
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <AuthProvider>
          <SubscriptionProvider>
            <TournamentProvider>
              <Navigation />
              <main className="pt-16 min-h-screen">
                {children}
              </main>
              <Footer />
              <WinnerDisplay />
            </TournamentProvider>
          </SubscriptionProvider>
        </AuthProvider>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
