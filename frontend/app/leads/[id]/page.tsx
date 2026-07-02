"use client";
import { useState, useEffect, useContext } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { AuthContext } from '../../context/AuthContext';
import { useApi } from '../../lib/apiClient';

export default function LeadDetailsPage() {
    const router = useRouter();
    const params = useParams();
    const { token } = useContext(AuthContext);
    const { apiFetch } = useApi();

    const [lead, setLead] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [notes, setNotes] = useState('');
    const [savingNotes, setSavingNotes] = useState(false);

    useEffect(() => {
        fetchLeadDetails();
    }, [params.id]);

    const fetchLeadDetails = async () => {
        try {
            const data = await apiFetch(`/api/leads/${params.id}`);
            setLead(data);
            setNotes(data.notes || '');
        } catch (error) {
            console.error('Failed to fetch lead details:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (newStatus: string) => {
        try {
            await apiFetch(`/api/leads/${params.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            setLead({ ...lead, status: newStatus });
        } catch (error) {
            console.error('Failed to update status:', error);
            alert('Failed to update status');
        }
    };

    const handleSaveNotes = async () => {
        setSavingNotes(true);
        try {
            await apiFetch(`/api/leads/${params.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notes })
            });
            alert('Notes saved successfully!');
        } catch (error) {
            console.error('Failed to save notes:', error);
            alert('Failed to save notes');
        } finally {
            setSavingNotes(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-24">
                <div className="w-12 h-12 border-4 rounded-full animate-spin"
                    style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }}></div>
            </div>
        );
    }

    if (!lead) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-24">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--color-secondary)' }}>Lead Not Found</h2>
                    <Link href="/leads" className="oceanic-btn oceanic-btn-primary">Back to Leads</Link>
                </div>
            </div>
        );
    }

    const getStatusColor = (status: string) => {
        const colors: any = {
            new: 'bg-blue-100 text-blue-700',
            contacted: 'bg-yellow-100 text-yellow-700',
            qualified: 'bg-green-100 text-green-700',
            converted: 'bg-purple-100 text-purple-700',
            lost: 'bg-red-100 text-red-700',
        };
        return colors[status] || 'bg-gray-100 text-gray-700';
    };

    return (
        <div className="min-h-screen bg-gray-50 pt-24 pb-12">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Back Button */}
                <Link href="/leads" className="inline-flex items-center text-sm font-medium mb-6 hover:underline" style={{ color: 'var(--color-primary)' }}>
                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Leads
                </Link>

                {/* Header */}
                <div className="oceanic-card p-6 mb-6">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-2xl"
                                style={{ background: 'linear-gradient(135deg, #b8946f 0%, #8b6f4d 100%)' }}>
                                {lead.company_name?.charAt(0) || 'L'}
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold mb-1" style={{ color: 'var(--color-secondary)' }}>
                                    {lead.company_name || 'Unknown Company'}
                                </h1>
                                {lead.website && (
                                    <a href={lead.website} target="_blank" rel="noopener noreferrer"
                                        className="hover:underline flex items-center gap-1"
                                        style={{ color: 'var(--color-primary)' }}>
                                        {lead.website}
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                        </svg>
                                    </a>
                                )}
                            </div>
                        </div>
                        <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(lead.status || 'new')}`}>
                            {lead.status || 'New'}
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Info */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Contact Information */}
                        <div className="oceanic-card p-6">
                            <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--color-secondary)' }}>
                                Contact Information
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-semibold text-gray-600 block mb-1">Email Addresses</label>
                                    {lead.email_addresses && lead.email_addresses.length > 0 ? (
                                        <div className="space-y-1">
                                            {lead.email_addresses.map((email: string, i: number) => (
                                                <a key={i} href={`mailto:${email}`} className="block hover:underline" style={{ color: 'var(--color-primary)' }}>
                                                    {email}
                                                </a>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-gray-400 text-sm">Not available</p>
                                    )}
                                </div>
                                <div>
                                    <label className="text-sm font-semibold text-gray-600 block mb-1">Phone Numbers</label>
                                    {lead.phone_numbers && lead.phone_numbers.length > 0 ? (
                                        <div className="space-y-1">
                                            {lead.phone_numbers.map((phone: any, i: number) => {
                                                const num = typeof phone === 'string' ? phone : phone.number;
                                                return (
                                                    <a key={i} href={`tel:${num}`} className="block hover:underline" style={{ color: 'var(--color-primary)' }}>
                                                        {num}
                                                    </a>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <p className="text-gray-400 text-sm">Not available</p>
                                    )}
                                </div>
                                <div>
                                    <label className="text-sm font-semibold text-gray-600 block mb-1">Location</label>
                                    <p className="text-gray-700">{lead.location || 'Not available'}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-semibold text-gray-600 block mb-1">Industry</label>
                                    <p className="text-gray-700">{lead.industry || 'Not specified'}</p>
                                </div>
                            </div>
                            
                            {/* Social Media Links */}
                            {(lead.linkedin_url || lead.twitter_url || lead.facebook_url) && (
                                <div className="mt-6 border-t pt-4">
                                    <label className="text-sm font-semibold text-gray-600 block mb-2">Social Media</label>
                                    <div className="flex gap-4">
                                        {lead.linkedin_url && (
                                            <a href={lead.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                                LinkedIn
                                            </a>
                                        )}
                                        {lead.twitter_url && (
                                            <a href={lead.twitter_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                                                Twitter
                                            </a>
                                        )}
                                        {lead.facebook_url && (
                                            <a href={lead.facebook_url} target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:underline">
                                                Facebook
                                            </a>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Key Contacts */}
                        {lead.key_contacts && lead.key_contacts.length > 0 && (
                            <div className="oceanic-card p-6">
                                <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--color-secondary)' }}>
                                    Key Contacts
                                </h2>
                                <div className="space-y-4">
                                    {lead.key_contacts.map((contact: any, idx: number) => (
                                        <div key={idx} className="border-l-4 border-blue-500 pl-4 py-2 bg-gray-50 rounded-r-lg">
                                            <h3 className="font-bold text-gray-900">{contact.full_name}</h3>
                                            <p className="text-sm text-gray-600">{contact.designation}</p>
                                            <div className="mt-2 text-sm space-y-1">
                                                {contact.email && (
                                                    <p><span className="font-medium">Email:</span> <a href={`mailto:${contact.email}`} className="text-blue-600 hover:underline">{contact.email}</a></p>
                                                )}
                                                {contact.phone && (
                                                    <p><span className="font-medium">Phone:</span> <a href={`tel:${contact.phone}`} className="text-blue-600 hover:underline">{contact.phone}</a></p>
                                                )}
                                                {contact.linkedin_url && (
                                                    <p><a href={contact.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">LinkedIn Profile</a></p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Notes */}
                        <div className="oceanic-card p-6">
                            <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--color-secondary)' }}>
                                Notes
                            </h2>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Add notes about this lead..."
                                rows={6}
                                className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:border-[var(--color-primary)] transition-colors mb-4"
                            />
                            <button
                                onClick={handleSaveNotes}
                                disabled={savingNotes}
                                className="oceanic-btn oceanic-btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {savingNotes ? 'Saving...' : 'Save Notes'}
                            </button>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Status Management */}
                        <div className="oceanic-card p-6">
                            <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--color-secondary)' }}>
                                Update Status
                            </h3>
                            <div className="space-y-2">
                                {['new', 'contacted', 'qualified', 'converted', 'lost'].map((status) => (
                                    <button
                                        key={status}
                                        onClick={() => handleStatusChange(status)}
                                        className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors ${lead.status === status
                                            ? 'bg-[var(--color-primary)] text-white'
                                            : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                                            }`}
                                    >
                                        {status.charAt(0).toUpperCase() + status.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Campaign Info */}
                        <div className="oceanic-card p-6">
                            <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--color-secondary)' }}>
                                Campaign
                            </h3>
                            <p className="text-gray-700 mb-2">{lead.campaign_name || 'N/A'}</p>
                            {lead.campaign_id && (
                                <Link href={`/campaigns/${lead.campaign_id}`} className="text-sm hover:underline" style={{ color: 'var(--color-primary)' }}>
                                    View Campaign →
                                </Link>
                            )}
                        </div>

                        {/* Metadata */}
                        <div className="oceanic-card p-6">
                            <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--color-secondary)' }}>
                                Details
                            </h3>
                            <div className="space-y-3 text-sm">
                                <div>
                                    <label className="font-semibold text-gray-600 block mb-1">Added</label>
                                    <p className="text-gray-700">
                                        {lead.created_at ? new Date(lead.created_at).toLocaleString() : 'N/A'}
                                    </p>
                                </div>
                                <div>
                                    <label className="font-semibold text-gray-600 block mb-1">Last Updated</label>
                                    <p className="text-gray-700">
                                        {lead.updated_at ? new Date(lead.updated_at).toLocaleString() : 'N/A'}
                                    </p>
                                </div>
                                <div>
                                    <label className="font-semibold text-gray-600 block mb-1">Source</label>
                                    <p className="text-gray-700">{lead.source || 'Direct'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
