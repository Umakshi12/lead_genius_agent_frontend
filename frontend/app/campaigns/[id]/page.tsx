"use client";
import { useState, useEffect, useContext } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { AuthContext } from '../../context/AuthContext';
import { useApi } from '../../lib/apiClient';

export default function CampaignDetailsPage() {
    const router = useRouter();
    const params = useParams();
    const { token } = useContext(AuthContext);
    const { apiFetch } = useApi();

    const [campaign, setCampaign] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        keywords: [] as string[],
    });

    useEffect(() => {
        if (!token) {
            router.push('/login');
            return;
        }

        fetchCampaignDetails();
    }, [token, params.id]);

    const fetchCampaignDetails = async () => {
        try {
            const data = await apiFetch(`/api/campaigns/${params.id}`);
            setCampaign(data);
            setFormData({
                name: data.name || '',
                keywords: data.keywords || [],
            });
        } catch (error) {
            console.error('Failed to fetch campaign details:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            await apiFetch(`/api/campaigns/${params.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    keywords: formData.keywords,
                })
            });
            setCampaign({ ...campaign, ...formData });
            setEditing(false);
            alert('Campaign updated successfully!');
        } catch (error) {
            console.error('Failed to update campaign:', error);
            alert('Failed to update campaign');
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this campaign? This action cannot be undone.')) {
            return;
        }

        try {
            await apiFetch(`/api/campaigns/${params.id}`, {
                method: 'DELETE',
            });
            alert('Campaign deleted successfully');
            router.push('/dashboard');
        } catch (error) {
            console.error('Failed to delete campaign:', error);
            alert('Failed to delete campaign');
        }
    };

    const handleAddKeyword = () => {
        const keyword = prompt('Enter a new keyword:');
        if (keyword && !formData.keywords.includes(keyword.trim())) {
            setFormData({
                ...formData,
                keywords: [...formData.keywords, keyword.trim()]
            });
        }
    };

    const handleRemoveKeyword = (keyword: string) => {
        setFormData({
            ...formData,
            keywords: formData.keywords.filter(k => k !== keyword)
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-24">
                <div className="w-12 h-12 border-4 rounded-full animate-spin"
                    style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }}></div>
            </div>
        );
    }

    if (!campaign) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-24">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--color-secondary)' }}>Campaign Not Found</h2>
                    <Link href="/dashboard" className="oceanic-btn oceanic-btn-primary">Back to Dashboard</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pt-24 pb-12">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Back Button */}
                <Link href="/dashboard" className="inline-flex items-center text-sm font-medium mb-6 hover:underline" style={{ color: 'var(--color-primary)' }}>
                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Dashboard
                </Link>

                {/* Header */}
                <div className="oceanic-card p-6 mb-6">
                    <div className="flex justify-between items-start">
                        <div className="flex-1">
                            {editing ? (
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="text-3xl font-bold mb-2 w-full border-2 border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:border-[var(--color-primary)]"
                                    style={{ color: 'var(--color-secondary)' }}
                                />
                            ) : (
                                <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--color-secondary)' }}>
                                    {campaign.name}
                                </h1>
                            )}
                            <p className="text-gray-600">
                                Created on {campaign.created_at ? new Date(campaign.created_at).toLocaleDateString() : 'N/A'}
                            </p>
                        </div>
                        <div className="flex gap-3">
                            {editing ? (
                                <>
                                    <button onClick={handleSave} className="oceanic-btn oceanic-btn-primary">
                                        Save Changes
                                    </button>
                                    <button onClick={() => {
                                        setEditing(false);
                                        setFormData({ name: campaign.name, keywords: campaign.keywords });
                                    }} className="oceanic-btn oceanic-btn-outline">
                                        Cancel
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button onClick={() => setEditing(true)} className="oceanic-btn oceanic-btn-outline">
                                        Edit Campaign
                                    </button>
                                    <button onClick={handleDelete} className="oceanic-btn text-red-600 border-red-600 hover:bg-red-50">
                                        Delete
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Keywords */}
                        <div className="oceanic-card p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold" style={{ color: 'var(--color-secondary)' }}>
                                    Keywords ({formData.keywords.length})
                                </h2>
                                {editing && (
                                    <button onClick={handleAddKeyword} className="oceanic-btn oceanic-btn-outline text-sm px-3 py-1">
                                        + Add Keyword
                                    </button>
                                )}
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {formData.keywords.map((keyword, index) => (
                                    <div key={index} className="px-4 py-2 rounded-lg flex items-center gap-2"
                                        style={{ backgroundColor: 'rgba(184, 148, 111, 0.1)', color: 'var(--color-primary)' }}>
                                        <span className="font-medium">{keyword}</span>
                                        {editing && (
                                            <button
                                                onClick={() => handleRemoveKeyword(keyword)}
                                                className="text-red-600 hover:text-red-800"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        )}
                                    </div>
                                ))}
                                {formData.keywords.length === 0 && (
                                    <p className="text-gray-400 text-sm">No keywords added yet</p>
                                )}
                            </div>
                        </div>

                        {/* Campaign Stats */}
                        <div className="oceanic-card p-6">
                            <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--color-secondary)' }}>
                                Campaign Statistics
                            </h2>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="text-center p-4 bg-gray-50 rounded-lg">
                                    <p className="text-3xl font-bold mb-1" style={{ color: 'var(--color-primary)' }}>
                                        {campaign.total_leads || 0}
                                    </p>
                                    <p className="text-sm text-gray-600">Total Leads</p>
                                </div>
                                <div className="text-center p-4 bg-gray-50 rounded-lg">
                                    <p className="text-3xl font-bold mb-1" style={{ color: 'var(--color-primary)' }}>
                                        {campaign.keywords?.length || 0}
                                    </p>
                                    <p className="text-sm text-gray-600">Keywords</p>
                                </div>
                                <div className="text-center p-4 bg-gray-50 rounded-lg">
                                    <p className="text-3xl font-bold mb-1" style={{ color: 'var(--color-primary)' }}>
                                        {campaign.channels || 0}
                                    </p>
                                    <p className="text-sm text-gray-600">Channels</p>
                                </div>
                                <div className="text-center p-4 bg-gray-50 rounded-lg">
                                    <p className="text-3xl font-bold mb-1 text-green-600">
                                        {campaign.converted_leads || 0}
                                    </p>
                                    <p className="text-sm text-gray-600">Converted</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Quick Actions */}
                        <div className="oceanic-card p-6">
                            <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--color-secondary)' }}>
                                Quick Actions
                            </h3>
                            <div className="space-y-3">
                                <Link href={`/leads?campaign=${campaign.id}`} className="block oceanic-btn oceanic-btn-outline w-full text-center">
                                    View Leads
                                </Link>
                                <button className="oceanic-btn oceanic-btn-outline w-full">
                                    Export Data
                                </button>
                                <button className="oceanic-btn oceanic-btn-primary w-full">
                                    Run Again
                                </button>
                            </div>
                        </div>

                        {/* Campaign Info */}
                        <div className="oceanic-card p-6">
                            <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--color-secondary)' }}>
                                Details
                            </h3>
                            <div className="space-y-3 text-sm">
                                <div>
                                    <label className="font-semibold text-gray-600 block mb-1">Status</label>
                                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                        Complete
                                    </span>
                                </div>
                                <div>
                                    <label className="font-semibold text-gray-600 block mb-1">Created</label>
                                    <p className="text-gray-700">
                                        {campaign.created_at ? new Date(campaign.created_at).toLocaleString() : 'N/A'}
                                    </p>
                                </div>
                                <div>
                                    <label className="font-semibold text-gray-600 block mb-1">Last Updated</label>
                                    <p className="text-gray-700">
                                        {campaign.updated_at ? new Date(campaign.updated_at).toLocaleString() : 'N/A'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
