"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AnalysisPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        const stored = localStorage.getItem('leadGenius_company');
        if (!stored) {
            router.push('/');
            return;
        }
        const input = JSON.parse(stored);

        const fetchData = async () => {
            try {
                const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
                const res = await fetch(`${baseUrl}/analyze`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(input)
                });

                if (!res.ok) throw new Error('Analysis request failed');

                const result = await res.json();
                setData(result);
            } catch (err: any) {
                setError(err.message || 'Failed to analyze company.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [router]);

    const handleSave = () => {
        localStorage.setItem('leadGenius_analysis', JSON.stringify(data));
        router.push('/discovery');
    };

    if (loading) return <LoadingScreen />;
    if (error) return <ErrorScreen msg={error} />;

    return (
        <div className="min-h-screen p-6 md:p-12 max-w-7xl mx-auto bg-gray-50">

            {/* Header */}
            <div className="flex justify-between items-center mb-8 pb-6 border-b border-gray-200">
                <div>
                    <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--color-secondary)' }}>{data?.company_name}</h1>
                    <p className="text-gray-600">Strategic Analysis Results</p>
                </div>
                <button onClick={handleSave} className="oceanic-btn oceanic-btn-primary">
                    Continue to Discovery →
                </button>
            </div>

            <div className="space-y-6">

                {/* Company Profile */}
                <section className="oceanic-card p-8">
                    <h2 className="text-xl font-bold mb-6" style={{ color: 'var(--color-secondary)' }}>Company Profile</h2>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-semibold mb-3" style={{ color: 'var(--color-primary)' }}>
                                Executive Summary
                            </label>
                            <textarea
                                className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:border-[var(--color-primary)] transition-colors min-h-[150px]"
                                value={data?.company_summary}
                                onChange={e => setData({ ...data, company_summary: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold mb-3" style={{ color: 'var(--color-primary)' }}>
                                Unique Selling Proposition
                            </label>
                            <textarea
                                className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:border-[var(--color-primary)] transition-colors min-h-[150px]"
                                value={data?.usp}
                                onChange={e => setData({ ...data, usp: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Social Media Section */}
                    <div className="mt-8 pt-8 border-t border-gray-200">
                        <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--color-secondary)' }}>Social Media Profiles</h3>
                        <p className="text-xs text-gray-600 mb-4 italic">Auto-fetched from website. Edit or add missing profiles below.</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold mb-2 text-gray-700">LinkedIn</label>
                                <input
                                    type="url"
                                    className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                                    placeholder="https://linkedin.com/company/..."
                                    value={data?.linkedin_url || ''}
                                    onChange={e => setData({ ...data, linkedin_url: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold mb-2 text-gray-700">Twitter / X</label>
                                <input
                                    type="url"
                                    className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                                    placeholder="https://twitter.com/..."
                                    value={data?.twitter_url || ''}
                                    onChange={e => setData({ ...data, twitter_url: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold mb-2 text-gray-700">Facebook</label>
                                <input
                                    type="url"
                                    className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                                    placeholder="https://facebook.com/..."
                                    value={data?.facebook_url || ''}
                                    onChange={e => setData({ ...data, facebook_url: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold mb-2 text-gray-700">Instagram</label>
                                <input
                                    type="url"
                                    className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                                    placeholder="https://instagram.com/..."
                                    value={data?.instagram_url || ''}
                                    onChange={e => setData({ ...data, instagram_url: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold mb-2 text-gray-700">YouTube</label>
                                <input
                                    type="url"
                                    className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                                    placeholder="https://youtube.com/..."
                                    value={data?.youtube_url || ''}
                                    onChange={e => setData({ ...data, youtube_url: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold mb-2 text-gray-700">GitHub</label>
                                <input
                                    type="url"
                                    className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                                    placeholder="https://github.com/..."
                                    value={data?.github_url || ''}
                                    onChange={e => setData({ ...data, github_url: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                </section>


                {/* Targeting Strategy */}
                <section className="oceanic-card p-8">
                    <h2 className="text-xl font-bold mb-6" style={{ color: 'var(--color-secondary)' }}>Targeting Strategy</h2>

                    <div className="space-y-6">
                        {/* ICPs */}
                        <div>
                            <label className="block text-sm font-semibold mb-3" style={{ color: 'var(--color-primary)' }}>
                                Ideal Customer Profiles
                            </label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {data?.icp_profile?.map((item: string, idx: number) => (
                                    <div key={idx} className="relative">
                                        <input
                                            className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 pr-10 focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                                            value={item}
                                            onChange={(e) => {
                                                const newArr = [...data.icp_profile];
                                                newArr[idx] = e.target.value;
                                                setData({ ...data, icp_profile: newArr });
                                            }}
                                        />
                                        <button onClick={() => {
                                            const newArr = data.icp_profile.filter((_: any, i: number) => i !== idx);
                                            setData({ ...data, icp_profile: newArr });
                                        }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500">
                                            ×
                                        </button>
                                    </div>
                                ))}
                                <button onClick={() => setData({ ...data, icp_profile: [...(data.icp_profile || []), "New Profile"] })}
                                    className="border-2 border-dashed border-gray-300 rounded-lg p-3 text-gray-500 hover:border-gray-400 hover:text-gray-700 transition">
                                    + Add Profile
                                </button>
                            </div>
                        </div>

                        {/* Industries & Companies */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold mb-3" style={{ color: 'var(--color-primary)' }}>
                                    Target Industries
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {data?.target_industries?.map((item: string, idx: number) => (
                                        <span key={idx} className="inline-flex items-center gap-2 bg-gray-100 border border-gray-300 px-3 py-1.5 rounded-lg text-sm">
                                            {item}
                                            <button onClick={() => {
                                                const newArr = data.target_industries.filter((_: any, i: number) => i !== idx);
                                                setData({ ...data, target_industries: newArr });
                                            }} className="text-gray-500 hover:text-red-500">×</button>
                                        </span>
                                    ))}
                                    <button onClick={() => {
                                        const val = prompt("Enter industry:");
                                        if (val) setData({ ...data, target_industries: [...(data.target_industries || []), val] });
                                    }} className="px-3 py-1.5 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-gray-400">
                                        + Add
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold mb-3" style={{ color: 'var(--color-primary)' }}>
                                    Similar Companies
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {data?.target_companies?.map((item: string, idx: number) => (
                                        <span key={idx} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm"
                                            style={{ backgroundColor: 'rgba(184, 148, 111, 0.1)', border: '1px solid var(--color-primary)', color: 'var(--color-primary-dark)' }}>
                                            {item}
                                            <button onClick={() => {
                                                const newArr = data.target_companies.filter((_: any, i: number) => i !== idx);
                                                setData({ ...data, target_companies: newArr });
                                            }} className="hover:text-red-500">×</button>
                                        </span>
                                    ))}
                                    <button onClick={() => {
                                        const val = prompt("Enter company:");
                                        if (val) setData({ ...data, target_companies: [...(data.target_companies || []), val] });
                                    }} className="px-3 py-1.5 border-2 border-dashed rounded-lg text-sm hover:border-gray-400"
                                        style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}>
                                        + Add
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    )
}

function LoadingScreen() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
            <div className="w-16 h-16 border-4 rounded-full animate-spin mb-4"
                style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }}></div>
            <p className="text-gray-600">Analyzing company data...</p>
        </div>
    )
}

function ErrorScreen({ msg }: { msg: string }) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-center p-8">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-secondary)' }}>Analysis Error</h2>
            <p className="text-gray-600 mb-6">{msg}</p>
            <a href="/" className="oceanic-btn oceanic-btn-primary">Return Home</a>
        </div>
    )
}
