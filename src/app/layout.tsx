import type { Metadata } from "next";
import { Inter, Playfair_Display, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/Navigation";
import { MobileNav } from "@/components/MobileNav";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Nomi Brief | Your Personal AI News Platform",
  description: "Premium personal news and article delivery platform powered by AI agents",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${playfair.variable} ${jetbrainsMono.variable} font-sans antialiased bg-[#09090b] text-zinc-100 min-h-screen`}
      >
        {/* Desktop sidebar */}
        <div className="hidden md:block">
          <div className="hidden md:flex min-h-screen">
            <Navigation />
            <main className="flex-1 ml-64">
              <div className="max-w-5xl mx-auto px-6 lg:px-8 py-10">
                {children}
              </div>
            </main>
          </div>
        </div>

        {/* Mobile layout */}
        <div className="md:hidden">
          <MobileNav />
          <main className="pt-16">
            <div className="px-4 py-6 max-w-5xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
