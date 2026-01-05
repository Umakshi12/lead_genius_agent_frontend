"use client";
import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function OnboardingForm() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [lookupLoading, setLookupLoading] = useState(false);
    const [lookupError, setLookupError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        company_name: '',
        website: '',
        industry: '',
        sub_product:'',
        existing_customers: ''
    });

    // Auto-fetch company URL and industry
    const fetchCompanyInfo = useCallback(async (companyName: string) => {
        if (!companyName || companyName.trim().length < 2) {
            return;
        }

        setLookupLoading(true);
        setLookupError(null);

        try {
            const response = await fetch(`${API_URL}/api/lookup-company`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ company_name: companyName.trim() }),
            });

            if (!response.ok) {
                throw new Error('Failed to lookup company');
            }

            const data = await response.json();

            // Update form fields with fetched data
            setFormData(prev => ({
                ...prev,
                website: data.website || prev.website,
                industry: data.industry || prev.industry,
            }));

            if (data.error && !data.website && !data.industry) {
                setLookupError(data.error);
            }
        } catch (error) {
            console.error('Company lookup failed:', error);
            setLookupError('Could not auto-fetch company info. Please enter manually.');
        } finally {
            setLookupLoading(false);
        }
    }, []);

    // Handle when user leaves the company name field
    const handleCompanyNameBlur = useCallback(() => {
        if (formData.company_name.trim() && !formData.website && !formData.industry) {
            fetchCompanyInfo(formData.company_name);
        }
    }, [formData.company_name, formData.website, formData.industry, fetchCompanyInfo]);

    // Handle Enter key in company name field
    const handleCompanyNameKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (formData.company_name.trim() && !formData.website && !formData.industry) {
                fetchCompanyInfo(formData.company_name);
            }
            // Move focus to website field
            const websiteInput = document.getElementById('website-input');
            websiteInput?.focus();
        }
    }, [formData.company_name, formData.website, formData.industry, fetchCompanyInfo]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Save to local storage for the next step to pick up
        if (typeof window !== 'undefined') {
            localStorage.setItem('Oceanic6_company', JSON.stringify(formData));
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
                <div className="relative">
                    <input
                        type="text"
                        required
                        className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                        placeholder="e.g. Oceanic6 Solutionz"
                        value={formData.company_name}
                        onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                        onBlur={handleCompanyNameBlur}
                        onKeyDown={handleCompanyNameKeyDown}
                    />
                    {lookupLoading && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <svg className="animate-spin h-5 w-5" style={{ color: 'var(--color-primary)' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        </div>
                    )}
                </div>
                {lookupLoading && (
                    <p className="text-xs mt-1 flex items-center gap-1" style={{ color: 'var(--color-primary)' }}>
                        <span className="animate-pulse">●</span> Auto-fetching company details...
                    </p>
                )}
                {lookupError && (
                    <p className="text-xs text-amber-600 mt-1">{lookupError}</p>
                )}
            </div>

            <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
                    Website URL <span style={{ color: 'var(--color-primary)' }}>*</span>
                    {lookupLoading && <span className="ml-2 text-xs font-normal text-gray-400">(auto-detecting...)</span>}
                </label>
                <input
                    id="website-input"
                    type="url"
                    required
                    disabled={lookupLoading}
                    className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:border-[var(--color-primary)] transition-colors disabled:bg-gray-50 disabled:cursor-wait"
                    placeholder={lookupLoading ? "Detecting..." : "https://example.com"}
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                />
            </div>

            <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
                    Industry <span style={{ color: 'var(--color-primary)' }}>*</span>
                    {lookupLoading && <span className="ml-2 text-xs font-normal text-gray-400">(auto-detecting...)</span>}
                </label>
                <input
                    type="text"
                    required
                    disabled={lookupLoading}
                    className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:border-[var(--color-primary)] transition-colors disabled:bg-gray-50 disabled:cursor-wait"
                    placeholder={lookupLoading ? "Detecting..." : "e.g. SaaS, Construction, Fashion..."}
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                />
            </div>

            <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
                    Sub Product <span className="text-sm font-normal text-gray-500">(Optional)</span>
                </label>
                <input
                    type="text"
                    className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                    placeholder="e.g. Flooring, CRM Software, Athletic Wear..."
                    value={formData.sub_product}
                    onChange={(e) => setFormData({ ...formData, sub_product: e.target.value })}
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
                disabled={loading || lookupLoading}
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

