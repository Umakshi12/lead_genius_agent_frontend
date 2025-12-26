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
                console.log("Analysis Result:", result);
                setData(result);
            } catch (err: any) {
                console.error(err);
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
        <div className="min-h-screen p-6 md:p-12 pt-24 max-w-7xl mx-auto animate-fade-in bg-[#0B1120]">

            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-end mb-10 border-b border-white/10 pb-6 gap-6">
                <div>
                    <span className="text-blue-400 font-semibold tracking-wide text-xs uppercase mb-2 block">Step 1: Strategic Analysis</span>
                    <h1 className="text-4xl font-bold text-white font-outfit mb-2">{data?.company_name}</h1>
                    <p className="text-slate-400 text-lg">AI-driven analysis of your business and market position.</p>
                </div>
                <div className="flex gap-4">
                    <button onClick={() => router.push('/')} className="px-6 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 transition font-medium">
                        Start Over
                    </button>
                    <button onClick={handleSave} className="group relative px-6 py-2.5 bg-blue-600 rounded-xl text-white font-semibold shadow-lg hover:bg-blue-500 transition-all flex items-center gap-2">
                        Next: Discovery
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                    </button>
                </div>
            </div>

            <div className="space-y-8">

                {/* PART 1: Company Profile (Horizontal Full Width) */}
                <section className="glass-card p-8 rounded-3xl border border-white/5 bg-gradient-to-b from-slate-900/60 to-slate-900/40">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-blue-500/20 rounded-lg text-blue-300">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                        </div>
                        <h2 className="text-2xl font-bold text-white">Company Profile</h2>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Summary Rectangle */}
                        <div className="relative group">
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
                            <div className="relative bg-slate-950 border border-slate-800 rounded-2xl p-6 h-full flex flex-col">
                                <label className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                    Executive Summary
                                </label>
                                <textarea
                                    className="w-full bg-transparent text-lg text-slate-300 leading-relaxed outline-none border-none p-0 focus:ring-0 resize-none font-light flex-1 min-h-[150px]"
                                    value={data?.company_summary}
                                    onChange={e => setData({ ...data, company_summary: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* USP Rectangle */}
                        <div className="relative group">
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
                            <div className="relative bg-slate-950 border border-slate-800 rounded-2xl p-6 h-full flex flex-col">
                                <label className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                    Unique Selling Proposition
                                </label>
                                <div className="flex-1 flex gap-4">
                                    <div className="w-1 bg-emerald-500/30 rounded-full my-1"></div>
                                    <textarea
                                        className="w-full bg-transparent text-lg font-medium text-slate-200 leading-relaxed outline-none border-none p-0 focus:ring-0 resize-none italic min-h-[150px]"
                                        value={data?.usp}
                                        onChange={e => setData({ ...data, usp: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>


                {/* PART 2: Target Audience (Horizontal Full Width) */}
                <section className="glass-card p-8 rounded-3xl border border-white/5 bg-gradient-to-b from-slate-900/60 to-slate-900/40">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="p-2 bg-purple-500/20 rounded-lg text-purple-300">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                        </div>
                        <h2 className="text-2xl font-bold text-white">Targeting Strategy</h2>
                    </div>

                    <div className="space-y-8">
                        {/* Row 1: Ideal Customer Profiles */}
                        <div>
                            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Ideal Customer Profiles</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {data?.icp_profile?.map((item: string, idx: number) => (
                                    <div key={idx} className="group relative bg-slate-800/50 border border-slate-700/50 rounded-xl p-1 focus-within:ring-1 focus-within:ring-purple-500/50 transition-all hover:bg-slate-800">
                                        <input
                                            className="w-full bg-transparent text-white px-4 py-3 outline-none font-medium"
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
                                        }} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-red-400 p-2 opacity-0 group-hover:opacity-100 transition">
                                            ×
                                        </button>
                                    </div>
                                ))}
                                <button onClick={() => setData({ ...data, icp_profile: [...(data.icp_profile || []), "New Persona"] })} className="border border-dashed border-slate-700 rounded-xl p-4 text-slate-500 hover:text-white hover:border-slate-500 transition flex items-center justify-center gap-2 font-medium">
                                    + Add ICP
                                </button>
                            </div>
                        </div>

                        <div className="border-t border-white/5 my-8"></div>

                        {/* Row 2: Industries & Companies */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            {/* Industries */}
                            <div>
                                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Target Industries</h3>
                                <div className="flex flex-wrap gap-2">
                                    {data?.target_industries?.map((item: string, idx: number) => (
                                        <span key={idx} className="group flex items-center gap-2 bg-slate-800 border border-slate-700 px-4 py-2 rounded-lg text-slate-200 hover:border-white/20 transition cursor-default">
                                            {item}
                                            <button onClick={() => {
                                                const newArr = data.target_industries.filter((_: any, i: number) => i !== idx);
                                                setData({ ...data, target_industries: newArr });
                                            }} className="text-slate-500 hover:text-red-300">×</button>
                                        </span>
                                    ))}
                                    <button onClick={() => {
                                        const val = prompt("Enter new industry:");
                                        if (val) setData({ ...data, target_industries: [...(data.target_industries || []), val] });
                                    }} className="bg-transparent border border-dashed border-slate-600 px-4 py-2 rounded-lg text-slate-400 hover:text-white hover:border-slate-400 transition">
                                        + Add Industry
                                    </button>
                                </div>
                            </div>

                            {/* Companies */}
                            <div>
                                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Target Company Examples</h3>
                                <div className="flex flex-wrap gap-2">
                                    {data?.target_companies?.map((item: string, idx: number) => (
                                        <span key={idx} className="group flex items-center gap-2 bg-indigo-900/20 border border-indigo-500/20 px-4 py-2 rounded-lg text-indigo-200 hover:border-indigo-400/30 transition cursor-default">
                                            {item}
                                            <button onClick={() => {
                                                const newArr = data.target_companies.filter((_: any, i: number) => i !== idx);
                                                setData({ ...data, target_companies: newArr });
                                            }} className="text-indigo-400/50 hover:text-red-300">×</button>
                                        </span>
                                    ))}
                                    <button onClick={() => {
                                        const val = prompt("Enter new company example:");
                                        if (val) setData({ ...data, target_companies: [...(data.target_companies || []), val] });
                                    }} className="bg-indigo-500/5 border border-dashed border-indigo-500/30 px-4 py-2 rounded-lg text-indigo-400 hover:text-indigo-300 hover:border-indigo-400 transition">
                                        + Add Company
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
        <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-[#0B1120]">
            <div className="relative w-32 h-32 mb-8">
                <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-ping"></div>
                <div className="absolute inset-8 bg-blue-500/40 rounded-full animate-pulse"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <svg className="animate-spin h-10 w-10 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                </div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2 font-outfit">Analyzing Company DNA</h2>
            <div className="text-slate-400 flex flex-col items-center gap-2">
                <span className="animate-fade-in-up delay-100">Scanning Website content...</span>
                <span className="animate-fade-in-up delay-200 text-sm opacity-70">Identifying Products & Services...</span>
                <span className="animate-fade-in-up delay-300 text-sm opacity-50">Mapping Market Position...</span>
            </div>
        </div>
    )
}

function ErrorScreen({ msg }: { msg: string }) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-[#0B1120]">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4 border border-red-500/20">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Analysis Error</h2>
            <p className="text-slate-400 mb-6">{msg}</p>
            <a href="/" className="px-6 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition">Return Home</a>
        </div>
    )
}
