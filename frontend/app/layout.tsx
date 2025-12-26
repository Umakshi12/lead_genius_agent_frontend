import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata: Metadata = {
  title: "Lead Genius AI",
  description: "Advanced Multi-Agent Lead Generation System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${outfit.variable} font-sans min-h-screen selection:bg-blue-500/30`}>
        <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 glass border-b border-white/5">
          <a href="/" className="text-xl font-bold text-white font-outfit tracking-tight">LeadGenius<span className="text-blue-500">.ai</span></a>
          <div className="flex gap-6 text-sm font-medium text-slate-300">
            <a href="/dashboard" className="hover:text-white transition hover:underline underline-offset-4">Dashboard</a>
            <a href="/" className="hover:text-white transition hover:underline underline-offset-4">New Campaign</a>
          </div>
        </nav>
        <main className="relative z-10 pt-16">
          {children}
        </main>
      </body>
    </html>
  );
}
