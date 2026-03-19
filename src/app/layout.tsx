import type { Metadata } from "next";
import { Inter, Playfair_Display, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/Navigation";

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
      <body className={`${inter.variable} ${playfair.variable} ${jetbrainsMono.variable} font-sans antialiased bg-[#09090b] text-zinc-100 min-h-screen`}>
        <div className="flex min-h-screen">
          <Navigation />
          <main className="flex-1 ml-64">
            <div className="max-w-5xl mx-auto px-8 py-12">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
