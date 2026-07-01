"use client";
import { useEffect, useState, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { AuthContext } from '../context/AuthContext';
import { useApi } from '../lib/api';

interface Campaign {
    id: string;
    name: string;
    keywords: string[];
    created_at: string;
    updated_at?: string;
}

export default function Dashboard() {
    const router = useRouter();
    const { token } = useContext(AuthContext);
    const { apiFetch } = useApi();
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch campaigns from the API
        const fetchCampaigns = async () => {
            try {
                const data = await apiFetch('/api/campaigns');
                setCampaigns(data);
            } catch (e) {
                console.error('Failed to fetch campaigns:', e);
            } finally {
                setLoading(false);
            }
        };

        fetchCampaigns();
    }, [token]);

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8 pt-24 max-w-7xl mx-auto animate-fade-in">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--color-secondary)' }}>
                    Campaign Dashboard
                </h1>
                <p className="text-gray-600">Manage and track your lead generation campaigns</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* New Campaign Card */}
                <div
                    onClick={() => router.push('/')}
                    className="oceanic-card p-8 flex flex-col items-center justify-center cursor-pointer border-2 border-dashed hover:border-solid min-h-[280px] group"
                    style={{ borderColor: 'var(--color-primary)' }}
                >
                    <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition"
                        style={{ backgroundColor: 'rgba(184, 148, 111, 0.1)' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" style={{ color: 'var(--color-primary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                    </div>
                    <p className="font-semibold text-lg mb-1" style={{ color: 'var(--color-primary)' }}>
                        Start New Campaign
                    </p>
                    <p className="text-gray-500 text-sm">Run fresh analysis</p>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="oceanic-card p-8 flex flex-col items-center justify-center min-h-[280px]">
                        <div className="w-12 h-12 border-4 rounded-full animate-spin"
                            style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }}></div>
                        <p className="text-gray-500 mt-4">Loading campaigns...</p>
                    </div>
                )}

                {/* Existing Campaigns */}
                {!loading && campaigns.map((campaign) => (
                    <div key={campaign.id} className="oceanic-card p-6 relative group min-h-[280px] flex flex-col">
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                                style={{ background: 'linear-gradient(135deg, #b8946f 0%, #8b6f4d 100%)' }}>
                                {campaign.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200">
                                Complete
                            </span>
                        </div>

                        <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--color-secondary)' }}>
                            {campaign.name}
                        </h3>
                        <p className="text-sm text-gray-500 mb-4">
                            Created on {formatDate(campaign.created_at)}
                        </p>

                        <div className="grid grid-cols-2 gap-3 mb-6 flex-grow">
                            <div className="bg-gray-50 rounded-lg p-3 text-center border border-gray-200">
                                <span className="block text-2xl font-bold mb-1" style={{ color: 'var(--color-primary)' }}>
                                    {campaign.keywords.length}
                                </span>
                                <span className="text-xs text-gray-600 uppercase tracking-wide">
                                    Keywords
                                </span>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-3 text-center border border-gray-200">
                                <span className="block text-2xl font-bold mb-1" style={{ color: 'var(--color-primary)' }}>
                                    4
                                </span>
                                <span className="text-xs text-gray-600 uppercase tracking-wide">
                                    Channels
                                </span>
                            </div>
                        </div>

                        <button
                            onClick={() => router.push(`/campaigns/${campaign.id}`)}
                            className="oceanic-btn oceanic-btn-primary w-full py-3 text-sm flex items-center justify-center gap-2"
                        >
                            View Details
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                ))}

                {/* Empty State */}
                {!loading && campaigns.length === 0 && (
                    <div className="oceanic-card p-8 flex flex-col items-center justify-center min-h-[280px] col-span-full">
                        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                            style={{ backgroundColor: 'rgba(184, 148, 111, 0.1)' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" style={{ color: 'var(--color-primary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                        </div>
                        <p className="text-gray-600 text-center mb-2">No campaigns yet</p>
                        <p className="text-gray-400 text-sm text-center">Create your first campaign to get started</p>
                    </div>
                )}
            </div>
        </div>
    );
}
