"use client";
import Link from 'next/link';
import './globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {/* Minimal Navigation Bar */}
        <nav className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link href="/" className="text-2xl font-bold" style={{ color: 'var(--color-primary)' }}>
                LeadGenius<span className="text-sm font-normal text-gray-500">.ai</span>
              </Link>
              <Link href="/dashboard" className="text-sm font-medium text-gray-700 hover:text-gray-900 transition">
                Dashboard
              </Link>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="pt-16">
          {children}
        </main>

        {/* Minimal Footer */}
        <footer className="bg-white border-t border-gray-200 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-sm text-gray-500">
              © {new Date().getFullYear()} Oceanic6 Solutionz ·
              <a href="https://oceanic6solutionz.com" target="_blank" rel="noopener noreferrer" className="ml-2 hover:underline" style={{ color: 'var(--color-primary)' }}>
                oceanic6solutionz.com
              </a>
            </p>
          </div>
        </footer>
      </body>
    </html>
  )
}
