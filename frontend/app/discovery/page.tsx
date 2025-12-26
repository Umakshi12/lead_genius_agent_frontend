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

        // Prevent refetch if we already have local state (unless explicitly desired)
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
                    // Pre-select first 3 keywords from the first category to get them started
                    if (result.grouped_keywords.length > 0) {
                        setSelectedKeywords(result.grouped_keywords[0].keywords.slice(0, 3));
                    }
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

    if (loading) return <LoadingScreen message="Initialising Keyword Discovery Agent..." />;

    // Step 2 View: Strategy Results
    if (strategyResult) {
        return (
            <div className="min-h-screen p-6 md:p-12 pt-24 max-w-7xl mx-auto animate-fade-in bg-[#0B1120]">
                {/* Header */}
                <div className="mb-12 text-center">
                    <button onClick={() => setStrategyResult(null)} className="text-slate-500 hover:text-white flex items-center gap-2 mb-6 mx-auto transition-colors">
                        &larr; Back to Keyword Selection
                    </button>
                    <span className="text-blue-500 font-bold tracking-widest text-xs uppercase mb-3 block animate-fade-in-up">Strategy Generated</span>
                    <h1 className="text-4xl md:text-5xl font-bold text-white font-outfit mb-4 animate-fade-in-up delay-100">Your Lead Sourcing Channels</h1>
                    <p className="text-slate-400 max-w-2xl mx-auto text-lg animate-fade-in-up delay-200">
                        We've identified the most effective platforms to target your {selectedKeywords.length} selected keywords.
                    </p>
                </div>

                <div className="flex flex-col items-center">
                    <div className="w-full max-w-6xl">
                        {/* Channels Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {strategyResult.channels?.map((c: any, i: number) => (
                                <div key={i}
                                    className="group p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-blue-500/50 hover:bg-slate-800/80 transition-all duration-500 relative overflow-hidden animate-fade-in-up"
                                    style={{ animationDelay: `${i * 100}ms` }}
                                >
                                    {/* Glass sheen effect */}
                                    <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition duration-700 pointer-events-none"></div>

                                    <div className="flex justify-between items-start mb-6 relative z-10">
                                        <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20 group-hover:scale-110 transition-transform">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                        </div>
                                        <span className={`font-bold px-3 py-1 rounded-full text-xs border ${c.relevance_score > 90 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
                                            {c.relevance_score}% Match
                                        </span>
                                    </div>

                                    <h3 className="font-bold text-xl text-white mb-2 group-hover:text-blue-300 transition-colors relative z-10">{c.name}</h3>

                                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-4 relative z-10">
                                        <div
                                            className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all duration-1000 ease-out"
                                            style={{ width: `${c.relevance_score}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-16 flex justify-center animate-fade-in-up delay-500">
                            <button onClick={() => router.push('/dashboard')} className="group relative px-10 py-5 bg-blue-600 rounded-full text-white font-bold text-lg shadow-2xl shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-105 transition-all duration-300 overflow-hidden">
                                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></span>
                                <span className="flex items-center gap-3 relative z-10">
                                    Launch Campaign
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
        <div className="min-h-screen p-6 md:p-12 pt-24 max-w-7xl mx-auto animate-fade-in bg-[#0B1120]">
            {/* Header */}
            <div className="text-center mb-16">
                <span className="text-blue-500 font-bold tracking-widest text-xs uppercase mb-3 block animate-fade-in-down">Step 2: Keyword Discovery</span>
                <h1 className="text-4xl md:text-5xl font-bold text-white font-outfit mb-6 animate-fade-in-down delay-100">
                    Target High-Intent Keywords
                </h1>
                <p className="text-slate-400 max-w-2xl mx-auto text-lg animate-fade-in-down delay-200">
                    We've curated specific search terms that your ideal customers are using. Select the ones that align best with your goals.
                </p>
            </div>

            <div className="max-w-5xl mx-auto space-y-10">
                {/* Categories Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {categories.map((cat, idx) => (
                        <div key={idx} className="glass-card p-0 rounded-2xl bg-slate-900/50 border border-white/5 overflow-hidden hover:border-blue-500/30 transition-colors duration-300 animate-fade-in-up" style={{ animationDelay: `${idx * 150}ms` }}>
                            <div className="px-6 py-4 bg-slate-900 border-b border-white/5 flex justify-between items-center">
                                <h3 className="font-semibold text-white tracking-wide">{cat.category_name}</h3>
                                <span className="text-xs font-mono text-slate-500 bg-slate-800 px-2 py-1 rounded">{cat.keywords.length} KEYWORDS</span>
                            </div>
                            <div className="p-6 flex flex-wrap gap-2">
                                {cat.keywords.map((kw, kIdx) => {
                                    const isSelected = selectedKeywords.includes(kw);
                                    return (
                                        <button
                                            key={kIdx}
                                            onClick={() => handleKeywordToggle(kw)}
                                            className={`relative px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 border backdrop-blur-sm ${isSelected
                                                    ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/25 scale-105'
                                                    : 'bg-slate-800/40 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-white hover:bg-slate-700/50'
                                                }`}
                                        >
                                            {kw}
                                            {isSelected && (
                                                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                                                </span>
                                            )}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Manual Add Bar */}
                <div className="relative max-w-2xl mx-auto animate-fade-in-up delay-500">
                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl blur opacity-25"></div>
                    <div className="relative bg-slate-900 rounded-xl p-2 flex items-center shadow-2xl border border-white/10">
                        <div className="pl-4 text-slate-500">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                        </div>
                        <input
                            type="text"
                            className="flex-1 bg-transparent border-none text-white px-4 py-3 focus:ring-0 placeholder-slate-500 outline-none w-full"
                            placeholder="Add a custom keyword..."
                            value={customKeyword}
                            onChange={(e) => setCustomKeyword(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddKeyword()}
                        />
                        <button
                            onClick={handleAddKeyword}
                            className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors"
                        >
                            Add
                        </button>
                    </div>
                </div>

                {/* Footer Action */}
                <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#0B1120] via-[#0B1120] to-transparent z-20 flex justify-center pointer-events-none">
                    <div className="pointer-events-auto flex items-center gap-4 bg-slate-900/90 backdrop-blur-xl p-2 pr-2 pl-6 rounded-full border border-white/10 shadow-2xl animate-fade-in-up delay-700">
                        <div className="text-sm font-medium text-slate-400">
                            <span className="text-white font-bold">{selectedKeywords.length}</span> keywords specific
                        </div>
                        <div className="w-px h-6 bg-white/10"></div>
                        <button
                            onClick={generateStrategy}
                            disabled={analyzingStrategy || selectedKeywords.length === 0}
                            className="px-8 py-3 rounded-full bg-white text-slate-900 font-bold hover:bg-blue-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {analyzingStrategy ? (
                                <>
                                    <svg className="animate-spin h-5 w-5 text-slate-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Analyzing...
                                </>
                            ) : (
                                <>
                                    Next Step
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                                </>
                            )}
                        </button>
                    </div>
                </div>
                {/* Spacer for fixed footer */}
                <div className="h-24"></div>
            </div>
        </div>
    )
}

function LoadingScreen({ message }: { message: string }) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-[#0B1120]">
            <div className="relative w-24 h-24 mb-6">
                <div className="absolute inset-0 border-t-2 border-blue-500 rounded-full animate-spin"></div>
                <div className="absolute inset-2 border-r-2 border-purple-500 rounded-full animate-spin-slow"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                </div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2 font-outfit tracking-tight">Agent 2: Discovery</h2>
            <p className="text-slate-400 animate-pulse text-sm uppercase tracking-widest">{message}</p>
        </div>
    )
}
