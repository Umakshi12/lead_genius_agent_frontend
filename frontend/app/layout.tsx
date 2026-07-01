"use client";
import React from 'react';

import './globals.css';
import { AuthProvider } from './context/AuthContext';
import NavBar from './components/NavBar';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <NavBar />

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
        </AuthProvider>
      </body>
    </html>
  );
}
