"use client";
import { useEffect, useState, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { AuthContext } from '../context/AuthContext';
import { useApi } from '../lib/apiClient';

interface KeywordCategory {
    category_name: string;
    keywords: string[];
}

export default function DiscoveryPage() {
    const router = useRouter();
    const { token } = useContext(AuthContext);
    const { apiFetch, streamApiFetch } = useApi();
    const [loading, setLoading] = useState(true);
    const [analyzingStrategy, setAnalyzingStrategy] = useState(false);

    const [categories, setCategories] = useState<KeywordCategory[]>([]);
    const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
    const [strategyResult, setStrategyResult] = useState<any>(null);
    const [inputData, setInputData] = useState<any>(null);
    const [location, setLocation] = useState('New York, NY'); // Default location
    const [activeCampaignId, setActiveCampaignId] = useState<string | null>(null);

    // Campaign save state
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [campaignName, setCampaignName] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const analysisStored = localStorage.getItem('Oceanic6_analysis');
        const companyStored = localStorage.getItem('Oceanic6_company');

        // Enforce sequential flow: user must complete onboarding + analysis
        if (!companyStored) {
            router.push('/');
            return;
        }

        if (!analysisStored) {
            router.push('/analysis');
            return;
        }

        const input = JSON.parse(analysisStored);
        setInputData(input);

        const fetchKeywords = async () => {
            try {
                const result = await apiFetch('/api/keywords', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(input)
                });

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
            const payload = {
                selected_keywords: selectedKeywords,
                company_summary: inputData.company_summary,
                target_industries: inputData.target_industries
            };
            const result = await apiFetch('/api/strategy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            setStrategyResult(result);
        } catch (e) {
            console.error(e);
        } finally {
            setAnalyzingStrategy(false);
        }
    };

    const saveCampaign = async () => {
        if (!campaignName.trim()) {
            alert('Please enter a campaign name');
            return;
        }


        setSaving(true);
        try {
            const result = await apiFetch('/api/campaigns', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: campaignName,
                    keywords: selectedKeywords
                })
            });

            if (result && result.id) {
                setActiveCampaignId(result.id);
            }

            setShowSaveModal(false);
            setCampaignName('');
            alert('Campaign saved successfully! You can now generate leads for this campaign.');
        } catch (e) {
            console.error('Failed to save campaign:', e);
            alert('Failed to save campaign. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const [generatingLeads, setGeneratingLeads] = useState(false);
    const [liveLeads, setLiveLeads] = useState<any[]>([]);
    const [currentStatus, setCurrentStatus] = useState("Initializing generation...");

    const handleGenerateLeads = async () => {
        setGeneratingLeads(true);
        setLiveLeads([]);
        setCurrentStatus("Initializing generation...");
        
        let campaignId = activeCampaignId;

        try {
            // AUTO-CREATE CAMPAIGN IF NONE ACTIVE
            if (!campaignId) {
                setCurrentStatus("Creating discovery campaign...");
                try {
                    const quickCampaign = await apiFetch('/api/campaigns', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            name: `Quick Discovery - ${new Date().toLocaleDateString()}`,
                            keywords: selectedKeywords
                        })
                    });
                    campaignId = quickCampaign.id;
                    setActiveCampaignId(campaignId);
                } catch (err) {
                    console.error("Auto-campaign creation failed:", err);
                    // Continue anyway, leads will be nullable-campaign
                }
            }

            const payload = {
                campaign_id: campaignId,
                selected_channels: strategyResult.channels.map((c: any) => c.name),
                selected_keywords: selectedKeywords,
                target_industries: inputData.target_industries,
                company_summary: inputData.company_summary,
                location: location,
                max_leads_per_channel: 15
            };

            if (!location.trim()) {
                const loc = prompt("Where do you want to find these leads? (e.g., New York, NY)", "New York, NY");
                if (!loc) {
                    setGeneratingLeads(false);
                    return;
                }
                setLocation(loc);
                payload.location = loc;
            }

            await streamApiFetch('/api/generate-leads', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            }, (msg) => {
                if (msg.type === 'status') {
                    setCurrentStatus(msg.data);
                } else if (msg.type === 'lead') {
                    setLiveLeads(prev => [msg.data, ...prev]); // Keep all leads for display
                }
            });

            localStorage.setItem('Oceanic6_strategy', JSON.stringify({
                channels: strategyResult.channels,
                keywords: selectedKeywords,
                ...inputData
            }));

            // Final wait to let user see completion
            setCurrentStatus("Generation complete! Finalizing...");
            setTimeout(() => {
                router.push('/leads');
            }, 1500);
        } catch (e) {
            console.error('Failed to generate leads:', e);
            alert('Failed to generate leads. Please try again.');
            setGeneratingLeads(false);
        }
    };

    if (loading) return <LoadingScreen />;

    if (strategyResult) {
        return (
            <div className="min-h-screen p-6 md:p-12 max-w-7xl mx-auto bg-gray-50">
                {generatingLeads ? (
                    <div className="flex flex-col items-center justify-start w-full text-center mt-8">
                        <div className="max-w-4xl w-full">
                            <div className="w-16 h-16 border-4 rounded-full animate-spin mx-auto mb-6"
                                style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }}></div>
                            
                            <h2 className="text-3xl font-bold mb-2" style={{ color: 'var(--color-secondary)' }}>
                                {liveLeads.length > 0 ? "Leads Found!" : "Generating Leads"}
                            </h2>
                            
                            {/* LIVE FEED STATUS */}
                            <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full mb-8 bg-blue-50 text-blue-700 font-medium">
                                <span className="relative flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                                </span>
                                <span>{currentStatus}</span>
                            </div>

                            {/* LIVE LEAD LIST */}
                            {liveLeads.length > 0 && (
                                <div className="mt-6 w-full max-w-2xl mx-auto space-y-3">
                                    {liveLeads.map((lead, idx) => (
                                        <div key={idx} className="bg-white border rounded-xl p-4 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-500 flex justify-between items-center text-left">
                                            <div className="flex-1 min-w-0 pr-4">
                                                <h4 className="font-bold text-gray-900 truncate">{lead.company_name}</h4>
                                                <p className="text-sm text-gray-500 truncate">{lead.industry || lead.location}</p>
                                            </div>
                                            <div className="flex items-center space-x-3">
                                                {lead.website && (
                                                    <span className="hidden sm:inline-block text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                                        Website Verified
                                                    </span>
                                                )}
                                                <div className="text-right">
                                                    <div className="text-xs font-bold text-gray-400 uppercase tracking-tighter">Score</div>
                                                    <div className="font-black text-lg leading-none" style={{ color: 'var(--color-primary)' }}>
                                                        {lead.lead_score || '??'}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {!liveLeads.length && (
                                <p className="text-gray-600 max-w-md mx-auto text-lg">
                                    Our AI is scanning maps, searching directories, and verifying websites. Sit back while we build your list...
                                </p>
                            )}
                        </div>
                    </div>
                ) : (
                    <>
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

                <div className="max-w-md mx-auto mb-10 text-left">
                    <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-secondary)' }}>
                        Target Location
                    </label>
                    <div className="relative">
                        <input
                            type="text"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            placeholder="e.g., New York, NY or London, UK"
                            className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[var(--color-primary)] outline-none transition-all"
                        />
                        <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                        Specifying a city or region helps us find much more accurate leads from Google Maps.
                    </p>
                </div>

                <div className="text-center">
                    <button onClick={handleGenerateLeads} disabled={generatingLeads} className="oceanic-btn oceanic-btn-primary text-lg px-12 py-4 disabled:opacity-50">
                        {generatingLeads ? 'Generating...' : 'Generate Leads →'}
                    </button>
                </div>
                </>
                )}
            </div>
        )
    }

    return (
        <div className="min-h-screen p-6 md:p-12 max-w-6xl mx-auto bg-gray-50">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--color-secondary)' }}>Keyword Selection</h1>
                <div className="flex justify-between items-center">
                    <p className="text-gray-600">Select keywords that align with your target audience</p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => {
                                const allKeywords = categories.flatMap(cat => cat.keywords);
                                setSelectedKeywords(allKeywords);
                            }}
                            className="oceanic-btn oceanic-btn-outline text-sm"
                        >
                            Select All
                        </button>
                        <button
                            onClick={() => setSelectedKeywords([])}
                            className="oceanic-btn oceanic-btn-outline text-sm"
                        >
                            Deselect All
                        </button>
                    </div>
                </div>
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
                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowSaveModal(true)}
                            disabled={selectedKeywords.length === 0}
                            className="oceanic-btn oceanic-btn-outline disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            💾 Save Campaign
                        </button>
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

            {/* Save Campaign Modal */}
            {showSaveModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowSaveModal(false)}>
                    <div className="oceanic-card p-8 max-w-md w-full m-4" onClick={(e) => e.stopPropagation()}>
                        <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--color-secondary)' }}>
                            Save Campaign
                        </h2>
                        <p className="text-gray-600 mb-6">
                            Give your campaign a name to save it for future use
                        </p>

                        <div className="mb-6">
                            <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
                                Campaign Name <span style={{ color: 'var(--color-primary)' }}>*</span>
                            </label>
                            <input
                                type="text"
                                value={campaignName}
                                onChange={(e) => setCampaignName(e.target.value)}
                                placeholder="e.g., Q1 2025 Lead Gen"
                                className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                                autoFocus
                            />
                            <p className="text-xs text-gray-500 mt-2">
                                {selectedKeywords.length} keywords will be saved with this campaign
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowSaveModal(false);
                                    setCampaignName('');
                                }}
                                className="oceanic-btn oceanic-btn-outline flex-1"
                                disabled={saving}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={saveCampaign}
                                disabled={saving || !campaignName.trim()}
                                className="oceanic-btn oceanic-btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {saving ? 'Saving...' : 'Save Campaign'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
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
