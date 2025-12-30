"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function OnboardingForm() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        company_name: '',
        website: '',
        industry: '',
        existing_customers: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Save to local storage for the next step to pick up
        if (typeof window !== 'undefined') {
            localStorage.setItem('leadGenius_company', JSON.stringify(formData));
        }

        // Brief form delay
        setTimeout(() => {
            router.push('/analysis');
        }, 500);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
                    Company Name <span style={{ color: 'var(--color-primary)' }}>*</span>
                </label>
                <input
                    type="text"
                    required
                    className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                    placeholder="e.g. Acme Corp"
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                />
            </div>

            <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
                    Website URL <span style={{ color: 'var(--color-primary)' }}>*</span>
                </label>
                <input
                    type="url"
                    required
                    className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                    placeholder="https://example.com"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                />
            </div>

            <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
                    Industry <span style={{ color: 'var(--color-primary)' }}>*</span>
                </label>
                <input
                    type="text"
                    required
                    className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                    placeholder="e.g. SaaS, Manufacturing, Consulting"
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                />
            </div>

            <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
                    Existing Customers <span className="text-sm font-normal text-gray-500">(Optional)</span>
                </label>
                <textarea
                    className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:border-[var(--color-primary)] transition-colors min-h-[100px]"
                    placeholder="e.g. Fortune 500 banks, Local dental clinics, Enterprise SaaS companies..."
                    value={formData.existing_customers}
                    onChange={(e) => setFormData({ ...formData, existing_customers: e.target.value })}
                />
                <p className="text-xs text-gray-500 mt-2">
                    Our AI will analyze similar companies to help you find new prospects
                </p>
            </div>

            <button
                type="submit"
                disabled={loading}
                className="oceanic-btn oceanic-btn-primary w-full py-4 text-base disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading ? (
                    <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Initializing AI Agents...
                    </span>
                ) : "BEGIN ANALYSIS"}
            </button>
        </form>
    )
}
