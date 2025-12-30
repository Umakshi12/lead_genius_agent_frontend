"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import OnboardingForm from '@/components/OnboardingForm';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="oceanic-hero min-h-[500px]">
        <div className="max-w-4xl mx-auto text-center z-10 relative px-4">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 animate-fade-in-up">
            LeadGenius
            <span className="block mt-2 text-3xl md:text-4xl font-normal" style={{ color: 'var(--color-accent)' }}>
              AI-Powered Lead Generation
            </span>
          </h1>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto animate-fade-in-up delay-100">
            Discover high-intent prospects and the perfect channels to reach them
          </p>
        </div>
      </section>

      {/* Main Form Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 -mt-20 relative z-10">
        <div className="max-w-2xl mx-auto">
          <div className="oceanic-card p-8 md:p-12 animate-fade-in-up delay-200">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-secondary)' }}>
                Start Your Campaign
              </h2>
              <p className="text-gray-600">
                Enter your company details to begin
              </p>
            </div>
            <OnboardingForm />
          </div>
        </div>
      </section>

      {/* Simple Features Grid */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
                style={{ backgroundColor: 'rgba(184, 148, 111, 0.1)' }}>
                <svg className="w-8 h-8" style={{ color: 'var(--color-primary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="font-bold text-lg mb-2" style={{ color: 'var(--color-secondary)' }}>Strategic Analysis</h3>
              <p className="text-sm text-gray-600">AI-powered market insights</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
                style={{ backgroundColor: 'rgba(184, 148, 111, 0.1)' }}>
                <svg className="w-8 h-8" style={{ color: 'var(--color-primary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="font-bold text-lg mb-2" style={{ color: 'var(--color-secondary)' }}>Keyword Discovery</h3>
              <p className="text-sm text-gray-600">High-intent search terms</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
                style={{ backgroundColor: 'rgba(184, 148, 111, 0.1)' }}>
                <svg className="w-8 h-8" style={{ color: 'var(--color-primary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="font-bold text-lg mb-2" style={{ color: 'var(--color-secondary)' }}>Channel Targeting</h3>
              <p className="text-sm text-gray-600">Optimized platform recommendations</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
