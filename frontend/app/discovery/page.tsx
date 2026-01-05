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

    const [categories, setCategories] = useState<KeywordCategory[]>([]);
    const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
    const [strategyResult, setStrategyResult] = useState<any>(null);
    const [inputData, setInputData] = useState<any>(null);

    useEffect(() => {
        const stored = localStorage.getItem('Oceanic6_analysis');
        if (!stored) {
            router.push('/');
            return;
        }
        const input = JSON.parse(stored);
        setInputData(input);

        const fetchKeywords = async () => {
            try {
                const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                const res = await fetch(`${baseUrl}/api/keywords`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(input)
                });
                const result = await res.json();

                if (result.grouped_keywords) {
                    setCategories(result.grouped_keywords);
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

    const generateStrategy = async () => {
        setAnalyzingStrategy(true);
        try {
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            const payload = {
                selected_keywords: selectedKeywords,
                company_summary: inputData.company_summary,
                target_industries: inputData.target_industries
            };
            const res = await fetch(`${baseUrl}/api/strategy`, {
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

    if (loading) return <LoadingScreen />;

    if (strategyResult) {
        return (
            <div className="min-h-screen p-6 md:p-12 max-w-7xl mx-auto bg-gray-50">
                <div className="mb-8">
                    <button onClick={() => setStrategyResult(null)} className="text-gray-600 hover:text-gray-900 mb-4">
                        ← Back to Keywords
                    </button>
                    <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--color-secondary)' }}>Recommended Channels</h1>
                    <p className="text-gray-600">Based on {selectedKeywords.length} selected keywords</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                    {strategyResult.channels?.map((c: any, i: number) => (
                        <div key={i} className="oceanic-card p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div className="w-12 h-12 rounded-lg flex items-center justify-center"
                                    style={{ backgroundColor: 'rgba(184, 148, 111, 0.1)' }}>
                                    <svg className="w-6 h-6" style={{ color: 'var(--color-primary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                </div>
                                <span className="text-sm font-bold px-3 py-1 rounded-full"
                                    style={{
                                        backgroundColor: c.relevance_score > 90 ? 'rgba(34, 197, 94, 0.1)' : 'rgba(184, 148, 111, 0.1)',
                                        color: c.relevance_score > 90 ? '#16a34a' : 'var(--color-primary-dark)'
                                    }}>
                                    {c.relevance_score}%
                                </span>
                            </div>

                            <h3 className="font-bold text-lg mb-3" style={{ color: 'var(--color-secondary)' }}>{c.name}</h3>

                            <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                                <div className="h-full rounded-full transition-all duration-1000"
                                    style={{ width: `${c.relevance_score}%`, backgroundColor: 'var(--color-primary)' }}></div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="text-center">
                    <button onClick={() => {
                        localStorage.setItem('Oceanic6_strategy', JSON.stringify({
                            channels: strategyResult.channels,
                            keywords: selectedKeywords,
                            ...inputData
                        }));
                        router.push('/leads');
                    }} className="oceanic-btn oceanic-btn-primary text-lg px-12 py-4">
                        Generate Leads →
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen p-6 md:p-12 max-w-6xl mx-auto bg-gray-50">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--color-secondary)' }}>Keyword Selection</h1>
                <p className="text-gray-600">Select keywords that align with your target audience</p>
            </div>

            <div className="space-y-6 mb-24">
                {categories.map((cat, idx) => (
                    <div key={idx} className="oceanic-card p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-lg" style={{ color: 'var(--color-secondary)' }}>{cat.category_name}</h3>
                            <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600">{cat.keywords.length} keywords</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {cat.keywords.map((kw, kIdx) => {
                                const isSelected = selectedKeywords.includes(kw);
                                return (
                                    <button
                                        key={kIdx}
                                        onClick={() => handleKeywordToggle(kw)}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border-2 ${isSelected
                                            ? 'border-[var(--color-primary)] text-white'
                                            : 'border-gray-200 text-gray-700 hover:border-gray-300'
                                            }`}
                                        style={isSelected ? { backgroundColor: 'var(--color-primary)' } : {}}
                                    >
                                        {kw}
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                ))}
            </div>

            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-20">
                <div className="max-w-6xl mx-auto flex justify-between items-center">
                    <div className="text-sm text-gray-600">
                        <span className="font-bold" style={{ color: 'var(--color-primary)' }}>{selectedKeywords.length}</span> keywords selected
                    </div>
                    <button
                        onClick={generateStrategy}
                        disabled={analyzingStrategy || selectedKeywords.length === 0}
                        className="oceanic-btn oceanic-btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {analyzingStrategy ? 'Analyzing...' : 'Generate Strategy →'}
                    </button>
                </div>
            </div>
        </div>
    )
}

function LoadingScreen() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
            <div className="w-16 h-16 border-4 rounded-full animate-spin mb-4"
                style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }}></div>
            <p className="text-gray-600">Discovering keywords...</p>
        </div>
    )
}
