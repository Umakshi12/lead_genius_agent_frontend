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
        social_media: '',
        existing_customers: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Save to local storage for the next step to pick up
        if (typeof window !== 'undefined') {
            const dataToSave = {
                ...formData,
                social_urls: formData.social_media.split(',').map(s => s.trim()).filter(Boolean)
            };
            localStorage.setItem('leadGenius_company', JSON.stringify(dataToSave));
        }

        // Brief form delay
        setTimeout(() => {
            router.push('/analysis');
        }, 500);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">
                    Company Name <span className="text-red-400">*</span>
                </label>
                <input
                    type="text"
                    required
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    placeholder="e.g. Acme Corp"
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">
                    Website URL <span className="text-red-400">*</span>
                </label>
                <input
                    type="url"
                    required
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    placeholder="https://example.com"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">
                    Industry <span className="text-red-400">*</span>
                </label>
                <input
                    type="text"
                    required
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    placeholder="e.g. SaaS, Manufacturing"
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">
                    Social Media Accounts (Optional)
                </label>
                <input
                    type="text"
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    placeholder="LinkedIn, Twitter URLs (comma separated)"
                    value={formData.social_media}
                    onChange={(e) => setFormData({ ...formData, social_media: e.target.value })}
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">
                    Existing Customers (Optional)
                </label>
                <textarea
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all min-h-[80px]"
                    placeholder="e.g. Fortune 500 banks, Local dental clinics..."
                    value={formData.existing_customers}
                    onChange={(e) => setFormData({ ...formData, existing_customers: e.target.value })}
                />
            </div>

            <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-semibold py-3 rounded-lg transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
            >
                {loading ? (
                    <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Initializing Agents...
                    </span>
                ) : "Start Research Agent"}
            </button>
        </form>
    )
}
