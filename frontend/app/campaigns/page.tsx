"use client";
import React, { useEffect, useState, useContext } from 'react';
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

export default function CampaignsPage() {
    const { token } = useContext(AuthContext);
    const router = useRouter();
    const { apiFetch } = useApi();

    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [newName, setNewName] = useState('');
    const [newKeywords, setNewKeywords] = useState(''); // comma separated
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [editKeywords, setEditKeywords] = useState('');

    // Redirect to login if not authenticated
    useEffect(() => {
        if (!token) {
            router.push('/login');
        }
    }, [token, router]);

    const fetchCampaigns = async () => {
        if (!token) return;
        setLoading(true);
        try {
            const data = await apiFetch('/api/campaigns');
            setCampaigns(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCampaigns();
    }, [token]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) return;
        const payload = {
            name: newName,
            keywords: newKeywords.split(',').map(k => k.trim()).filter(k => k),
        };
        try {
            await apiFetch('/api/campaigns', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            await fetchCampaigns();
            setNewName('');
            setNewKeywords('');
        } catch (e) {
            console.error(e);
        }
    };

    const startEdit = (c: Campaign) => {
        setEditingId(c.id);
        setEditName(c.name);
        setEditKeywords(c.keywords.join(', '));
    };

    const cancelEdit = () => {
        setEditingId(null);
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token || !editingId) return;
        const payload = {
            name: editName,
            keywords: editKeywords.split(',').map(k => k.trim()).filter(k => k),
        };
        try {
            await apiFetch(`/api/campaigns/${editingId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            await fetchCampaigns();
            setEditingId(null);
        } catch (e) {
            console.error(e);
        }
    };

    const handleDelete = async (id: string) => {
        if (!token) return;
        if (!confirm('Delete this campaign?')) return;
        try {
            await apiFetch(`/api/campaigns/${id}`, { method: 'DELETE' });
            await fetchCampaigns();
        } catch (e) {
            console.error(e);
        }
    };

    if (!token) {
        return null; // redirect handled above
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-4" style={{ color: 'var(--color-primary)' }}>Campaigns</h1>

            {/* Create New Campaign */}
            <form onSubmit={handleCreate} className="bg-white p-4 rounded shadow mb-6">
                <h2 className="text-lg font-semibold mb-2">Create New Campaign</h2>
                <div className="mb-2">
                    <label className="block text-sm font-medium mb-1">Name</label>
                    <input
                        type="text"
                        value={newName}
                        onChange={e => setNewName(e.target.value)}
                        className="w-full border rounded px-2 py-1"
                        required
                    />
                </div>
                <div className="mb-2">
                    <label className="block text-sm font-medium mb-1">Keywords (comma separated)</label>
                    <input
                        type="text"
                        value={newKeywords}
                        onChange={e => setNewKeywords(e.target.value)}
                        className="w-full border rounded px-2 py-1"
                    />
                </div>
                <button type="submit" className="oceanic-btn oceanic-btn-primary mt-2">Create</button>
            </form>

            {/* Campaign List */}
            {loading ? (
                <p>Loading campaigns...</p>
            ) : (
                <div className="space-y-4">
                    {campaigns.map(c => (
                        <div key={c.id} className="bg-white p-4 rounded shadow flex justify-between items-center">
                            {editingId === c.id ? (
                                <form onSubmit={handleUpdate} className="flex-1 mr-4">
                                    <input
                                        type="text"
                                        value={editName}
                                        onChange={e => setEditName(e.target.value)}
                                        className="w-full border rounded px-2 py-1 mb-1"
                                        required
                                    />
                                    <input
                                        type="text"
                                        value={editKeywords}
                                        onChange={e => setEditKeywords(e.target.value)}
                                        className="w-full border rounded px-2 py-1"
                                        placeholder="comma separated keywords"
                                    />
                                </form>
                            ) : (
                                <div className="flex-1 mr-4">
                                    <p className="font-medium">{c.name}</p>
                                    <p className="text-sm text-gray-600">Keywords: {c.keywords.join(', ') || '—'}</p>
                                </div>
                            )}
                            <div className="flex space-x-2">
                                {editingId === c.id ? (
                                    <>
                                        <button onClick={handleUpdate} className="oceanic-btn oceanic-btn-primary text-xs">Save</button>
                                        <button onClick={cancelEdit} className="oceanic-btn oceanic-btn-outline text-xs">Cancel</button>
                                    </>
                                ) : (
                                    <>
                                        <button onClick={() => startEdit(c)} className="oceanic-btn oceanic-btn-outline text-xs">Edit</button>
                                        <button onClick={() => handleDelete(c.id)} className="oceanic-btn oceanic-btn-outline text-xs text-red-600">Delete</button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
