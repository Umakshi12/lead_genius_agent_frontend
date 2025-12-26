"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface KeywordCategory {
    category_name: string;
    keywords: string[];
}

export default function DiscoveryPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [analyzingStrategy, setAnalyzingStrategy] = useState(false);

    // Step 1 Data
    const [categories, setCategories] = useState<KeywordCategory[]>([]);
    const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
    const [customKeyword, setCustomKeyword] = useState("");

    // Step 2 Data
    const [strategyResult, setStrategyResult] = useState<any>(null);

    // Initial Data from previous step
    const [inputData, setInputData] = useState<any>(null);

    useEffect(() => {
        const stored = localStorage.getItem('leadGenius_analysis');
        if (!stored) {
            router.push('/');
            return;
        }
        const input = JSON.parse(stored);
        setInputData(input);

        const fetchKeywords = async () => {
            try {
                const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
                const res = await fetch(`${baseUrl}/keywords`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(input)
                });
                const result = await res.json();

                if (result.grouped_keywords) {
                    setCategories(result.grouped_keywords);
                    const all = result.grouped_keywords.flatMap((c: any) => c.keywords);
                    setSelectedKeywords(all.slice(0, 10));
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchKeywords();
    }, [router]);

    const handleKeywordToggle = (kw: string) => {
        if (selectedKeywords.includes(kw)) {
            setSelectedKeywords(selectedKeywords.filter(k => k !== kw));
        } else {
            setSelectedKeywords([...selectedKeywords, kw]);
        }
    };

    const handleAddKeyword = () => {
        if (!customKeyword.trim()) return;
        setSelectedKeywords([...selectedKeywords, customKeyword]);
        setCustomKeyword("");
    };

    const generateStrategy = async () => {
        setAnalyzingStrategy(true);
        try {
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
            const payload = {
                selected_keywords: selectedKeywords,
                company_summary: inputData.company_summary,
                target_industries: inputData.target_industries
            };
            const res = await fetch(`${baseUrl}/strategy`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await res.json();
            setStrategyResult(result);
        } catch (e) {
            console.error(e);
        } finally {
            setAnalyzingStrategy(false);
        }
    };

    if (loading) return <LoadingScreen message="Identifying High-Value Keywords..." />;

    // Step 2 View: Strategy Results
    if (strategyResult) {
        return (
            <div className="min-h-screen p-4 md:p-8 pt-24 max-w-7xl mx-auto animate-fade-in">
                <div className="mb-6">
                    <button onClick={() => setStrategyResult(null)} className="text-slate-400 hover:text-white flex items-center gap-2 mb-4">
                        &larr; Back to Keywords
                    </button>
                    <h1 className="text-4xl font-bold text-white font-outfit text-center mb-8">Lead Generation Strategy</h1>
                </div>

                <div className="flex flex-col items-center">
                    <div className="w-full max-w-5xl">
                        <div className="glass-card p-8 rounded-2xl border border-white/10 shadow-2xl relative overflow-hidden">
                            {/* Decorative Background */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2"></div>

                            <h2 className="text-2xl font-semibold text-white mb-8 border-b border-white/5 pb-4 flex items-center gap-3">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                                Recommended Channels
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                {strategyResult.channels?.map((c: any, i: number) => (
                                    <div key={i} className="group p-5 rounded-xl bg-slate-800/40 border border-slate-700 hover:border-blue-500/50 hover:bg-slate-800/80 transition-all duration-300 relative">
                                        <div className="flex justify-between items-start mb-3">
                                            <h3 className="font-bold text-lg text-white group-hover:text-blue-300 transition">{c.name}</h3>
                                            <span className="bg-blue-500/10 text-blue-400 font-bold px-2 py-1 rounded text-xs border border-blue-500/20">{c.relevance_score}%</span>
                                        </div>
                                        <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                                            <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full" style={{ width: `${c.relevance_score}%` }}></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="mt-12 flex justify-center">
                            <button onClick={() => router.push('/dashboard')} className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl text-white font-bold text-lg shadow-2xl shadow-blue-500/20 hover:scale-105 transition-all duration-300 overflow-hidden">
                                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></span>
                                <span className="flex items-center gap-3 relative z-10">
                                    Launch Campaign
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                                    </svg>
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // Step 1 View: Keyword Selection
    return (
        <div className="min-h-screen p-4 md:p-8 pt-24 max-w-7xl mx-auto animate-fade-in">
            <div className="mb-8">
                <span className="text-blue-400 font-semibold tracking-wide text-xs uppercase mb-2 block">Agent 2: Discovery</span>
                <h1 className="text-3xl font-bold text-white font-outfit">Automated Data Strategist Agent</h1>
                <p className="text-slate-400">Live Lead Generation Channel Analysis</p>
            </div>

            <div className="space-y-8">
                {/* Section 1: Categories */}
                <div className="glass-card p-6 rounded-xl">
                    <h2 className="text-lg font-semibold text-white mb-6">1. Select Target Keywords</h2>

                    <div className="space-y-6">
                        {categories.map((cat, idx) => (
                            <div key={idx}>
                                <h3 className="text-sm font-medium text-slate-400 mb-3">{cat.category_name}</h3>
                                <div className="flex flex-wrap gap-2">
                                    {cat.keywords.map((kw, kIdx) => {
                                        const isSelected = selectedKeywords.includes(kw);
                                        return (
                                            <button
                                                key={kIdx}
                                                onClick={() => handleKeywordToggle(kw)}
                                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border ${isSelected
                                                        ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20'
                                                        : 'bg-slate-800/40 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200'
                                                    }`}
                                            >
                                                {kw}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Section 2: Add Custom */}
                <div className="glass-card p-6 rounded-xl">
                    <h2 className="text-sm font-medium text-white mb-3">Add & Suggest Keywords</h2>
                    <div className="flex gap-4">
                        <input
                            type="text"
                            className="flex-1 bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 text-white outline-none focus:border-blue-500"
                            placeholder="e.g. 'Hospitality Procurement'"
                            value={customKeyword}
                            onChange={(e) => setCustomKeyword(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddKeyword()}
                        />
                        <button
                            onClick={handleAddKeyword}
                            className="px-6 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-white font-medium transition"
                        >
                            Add Keyword
                        </button>
                        <button className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition flex items-center gap-2">
                            Suggest Keywords
                        </button>
                    </div>
                </div>

                {/* Section 3: Manage Combinations */}
                <div className="glass-card p-6 rounded-xl flex items-center gap-4">
                    <div className="flex-1">
                        <h2 className="text-sm font-medium text-slate-300 mb-1">Manage Keyword Combinations</h2>
                    </div>
                    <button className="px-4 py-2 rounded-lg border border-teal-500/30 bg-teal-500/10 text-teal-400 hover:bg-teal-500/20 transition">
                        Save Current Selection
                    </button>
                    <button className="px-4 py-2 rounded-lg border border-purple-500/30 bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 transition">
                        Suggest Combinations
                    </button>
                </div>

                {/* Footer Action */}
                <div className="flex gap-4 pt-4">
                    <button
                        onClick={generateStrategy}
                        disabled={analyzingStrategy || selectedKeywords.length === 0}
                        className="flex-1 py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold text-lg shadow-xl shadow-indigo-500/20 hover:scale-[1.01] transition-transform disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                    >
                        {analyzingStrategy ? (
                            <>
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Analyzing Strategy...
                            </>
                        ) : (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
                                Find Channels & Generate Strategy
                            </>
                        )}
                    </button>
                    <button
                        onClick={() => setSelectedKeywords([])}
                        className="px-8 py-4 rounded-xl bg-slate-800 text-slate-300 font-semibold hover:bg-slate-700 transition"
                    >
                        Clear All
                    </button>
                </div>
            </div>
        </div>
    )
}

function LoadingScreen({ message }: { message: string }) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-black">
            <div className="relative w-24 h-24 mb-6">
                <div className="absolute inset-0 border-t-4 border-l-4 border-blue-500 rounded-full animate-spin"></div>
                <div className="absolute inset-2 border-r-4 border-b-4 border-purple-500 rounded-full animate-spin-slow"></div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2 font-outfit">Agent 2 Working</h2>
            <p className="text-slate-400 animate-pulse">{message}</p>
        </div>
    )
}
