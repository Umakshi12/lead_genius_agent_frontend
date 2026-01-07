"use client";
import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface PersonContact {
    full_name: string;
    designation: string;
    role_category: string;
    email?: string;
    phone?: string;
    linkedin_url?: string;
    twitter_url?: string;
    instagram_url?: string;
    facebook_url?: string;
    whatsapp_number?: string;
}

interface CompanyLead {
    company_name: string;
    website?: string;
    industry?: string;
    company_size?: string;
    location?: string;
    // Address Information
    main_address?: string;
    headquarters?: string;
    branches?: Array<{ name: string, address: string, phone?: string, email?: string }>;
    // Social Media
    linkedin_url?: string;
    twitter_url?: string;
    instagram_url?: string;
    facebook_url?: string;
    whatsapp_url?: string;
    youtube_url?: string;
    tiktok_url?: string;
    pinterest_url?: string;
    // Contact Info
    email_addresses: string[];
    phone_numbers: Array<{ number: string, has_whatsapp: boolean }>;
    key_contacts: PersonContact[];
    // Metadata
    channel_source: string;
    keywords_matched: string[];
    enrichment_status: string;
}

export default function LeadsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [statusMessage, setStatusMessage] = useState("");
    const [leads, setLeads] = useState<CompanyLead[]>([]);
    const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
    const [newChannel, setNewChannel] = useState("");
    const [leadsByChannel, setLeadsByChannel] = useState<Record<string, number>>({});
    const [expandedCompany, setExpandedCompany] = useState<string | null>(null);

    // Filtered leads visible in the table (currently showing all, but can be filtered)
    const visibleLeads = leads;
    const totalLeads = leads.length;

    useEffect(() => {
        const stored = localStorage.getItem('Oceanic6_strategy');
        if (!stored) {
            router.push('/');
            return;
        }

        const strategyData = JSON.parse(stored);
        const channels = strategyData.channels.map((c: any) => c.name);
        setSelectedChannels(channels);
        setLoading(false);
    }, [router]);

    const handleAddChannel = () => {
        if (newChannel.trim() && !selectedChannels.includes(newChannel.trim())) {
            setSelectedChannels([...selectedChannels, newChannel.trim()]);
            setNewChannel("");
        }
    };

    const handleRemoveChannel = (channel: string) => {
        setSelectedChannels(selectedChannels.filter(c => c !== channel));
    };

    const handleGenerateLeads = async () => {
        if (selectedChannels.length === 0) {
            alert("Please select at least one channel.");
            return;
        }

        setGenerating(true);
        setLeads([]);
        setLeadsByChannel({});
        setStatusMessage("Initializing search...");

        try {
            const stored = localStorage.getItem('Oceanic6_strategy');
            if (!stored) return;

            const strategyData = JSON.parse(stored);

            const payload = {
                selected_channels: selectedChannels,
                selected_keywords: strategyData.keywords || [],
                target_industries: strategyData.target_industries || [],
                company_summary: strategyData.company_summary || "",
                max_leads_per_channel: 10
            };

            const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

            // Use streaming endpoint
            const response = await fetch(`${baseUrl}/api/generate-leads-stream`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.body) throw new Error("No response body");

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (!line.trim()) continue;
                    try {
                        const msg = JSON.parse(line);

                        if (msg.type === "status") {
                            setStatusMessage(msg.data);
                        } else if (msg.type === "lead") {
                            const lead = msg.data as CompanyLead;
                            setLeads(prev => [...prev, lead]);
                            setLeadsByChannel(prev => ({
                                ...prev,
                                [lead.channel_source]: (prev[lead.channel_source] || 0) + 1
                            }));
                        } else if (msg.type === "error") {
                            console.error("Stream error:", msg.data);
                        }
                    } catch (e) {
                        console.error("Error parsing stream chunk", e);
                    }
                }
            }

            setStatusMessage("Completed!");

        } catch (error) {
            console.error('Error generating leads:', error);
            alert('Failed to generate leads. Please try again.');
        } finally {
            setGenerating(false);
        }
    };

    const exportToCSV = () => {
        if (leads.length === 0) return;

        const headers = [
            'Company Name', 'Website', 'Industry', 'Company Size', 'Location',
            'LinkedIn', 'Twitter', 'Instagram', 'Facebook', 'WhatsApp', 'YouTube', 'Email Addresses', 'Phone Numbers',
            'Channel Source', 'Keywords Matched', 'Confidence Score', 'Enrichment Status',
            'Contact Name', 'Contact Designation', 'Contact Role', 'Contact Email', 'Contact Phone',
            'Contact LinkedIn', 'Contact Twitter', 'Contact Facebook', 'Contact Instagram', 'Contact WhatsApp'
        ];

        const rows: string[][] = [];
        leads.forEach(company => {
            if (company.key_contacts.length === 0) {
                rows.push([
                    company.company_name,
                    company.website || '',
                    company.industry || '',
                    company.company_size || '',
                    company.location || '',
                    company.linkedin_url || '',
                    company.twitter_url || '',
                    company.instagram_url || '',
                    company.facebook_url || '',
                    company.whatsapp_url || '',
                    company.youtube_url || '',
                    company.email_addresses.join('; '),
                    company.phone_numbers.map(p => `${p.number}${p.has_whatsapp ? ' (WhatsApp)' : ''}`).join('; '),
                    company.channel_source,
                    company.keywords_matched.join('; '),
                    company.enrichment_status,
                    '', '', '', '', '', '', '', '', '', ''
                ]);
            } else {
                company.key_contacts.forEach(contact => {
                    rows.push([
                        company.company_name,
                        company.website || '',
                        company.industry || '',
                        company.company_size || '',
                        company.location || '',
                        company.linkedin_url || '',
                        company.twitter_url || '',
                        company.instagram_url || '',
                        company.facebook_url || '',
                        company.whatsapp_url || '',
                        company.youtube_url || '',
                        company.email_addresses.join('; '),
                        company.phone_numbers.map(p => `${p.number}${p.has_whatsapp ? ' (WhatsApp)' : ''}`).join('; '),
                        company.channel_source,
                        company.keywords_matched.join('; '),
                        company.enrichment_status,
                        contact.full_name,
                        contact.designation,
                        contact.role_category,
                        contact.email || '',
                        contact.phone || '',
                        contact.linkedin_url || '',
                        contact.twitter_url || '',
                        contact.facebook_url || '',
                        contact.instagram_url || '',
                        contact.whatsapp_number || ''
                    ]);
                });
            }
        });

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `leads_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    if (loading) return <LoadingScreen />;

    return (
        <div className="min-h-screen p-6 md:p-12 max-w-7xl mx-auto bg-gray-50">
            {/* Header */}
            <div className="mb-8">
                <button onClick={() => router.push('/discovery')} className="text-gray-600 hover:text-gray-900 mb-4">
                    ← Back to Discovery
                </button>
                <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--color-secondary)' }}>Lead Generation</h1>
                <p className="text-gray-600">Generate and enrich leads from selected channels</p>
            </div>

            {/* Channel Selection with Edit Capability */}
            <div className="oceanic-card p-6 mb-6">
                <div className="flex justify-between items-center mb-3">
                    <h3 className="font-bold" style={{ color: 'var(--color-secondary)' }}>Selected Channels</h3>
                    {!generating && (
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newChannel}
                                onChange={(e) => setNewChannel(e.target.value)}
                                placeholder="Add custom channel"
                                className="border rounded px-2 py-1 text-sm outline-none focus:border-blue-500"
                                onKeyDown={(e) => e.key === 'Enter' && handleAddChannel()}
                            />
                            <button
                                onClick={handleAddChannel}
                                className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                            >
                                Add
                            </button>
                        </div>
                    )}
                </div>
                <div className="flex flex-wrap gap-2">
                    {selectedChannels.map((channel, idx) => (
                        <span key={idx} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium"
                            style={{ backgroundColor: 'rgba(184, 148, 111, 0.1)', color: 'var(--color-primary-dark)', border: '1px solid var(--color-primary)' }}>
                            {channel}
                            {!generating && (
                                <button
                                    onClick={() => handleRemoveChannel(channel)}
                                    className="ml-1 text-gray-400 hover:text-red-500 font-bold leading-none"
                                >
                                    ×
                                </button>
                            )}
                        </span>
                    ))}
                    {selectedChannels.length === 0 && (
                        <span className="text-gray-400 italic text-sm">No channels selected</span>
                    )}
                </div>
            </div>

            {/* Generate Button */}
            {leads.length === 0 && !generating && (
                <div className="text-center py-12">
                    <button
                        onClick={handleGenerateLeads}
                        disabled={selectedChannels.length === 0}
                        className="oceanic-btn oceanic-btn-primary text-lg px-12 py-4 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Start Lead Generation
                    </button>
                    <p className="text-sm text-gray-500 mt-4">This searches for real companies and contacts in real-time</p>
                </div>
            )}

            {/* Generating Loading State */}
            {generating && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-blue-800 font-medium">{statusMessage || "Processing..."}</span>
                    </div>
                    <div className="text-sm text-blue-600">
                        {leads.length} leads found so far
                    </div>
                </div>
            )}

            {/* Results */}
            {leads.length > 0 && (
                <>
                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="oceanic-card p-4">
                            <div className="text-sm text-gray-600 mb-1">Total Leads</div>
                            <div className="text-3xl font-bold" style={{ color: 'var(--color-primary)' }}>{totalLeads}</div>
                        </div>
                        {Object.entries(leadsByChannel).map(([channel, count]) => (
                            <div key={channel} className="oceanic-card p-4">
                                <div className="text-sm text-gray-600 mb-1">{channel}</div>
                                <div className="text-3xl font-bold" style={{ color: 'var(--color-secondary)' }}>{count}</div>
                            </div>
                        ))}
                    </div>

                    {/* Export Button */}
                    <div className="flex justify-end mb-4">
                        <button onClick={exportToCSV} className="oceanic-btn oceanic-btn-outline">
                            Export to CSV
                        </button>
                    </div>

                    {/* Leads Table */}
                    <div className="oceanic-card overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-100 border-b border-gray-200">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Company</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Industry</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Location</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Contacts</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Channel</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {leads.map((company, idx) => (
                                        <React.Fragment key={idx}>
                                            <tr className="hover:bg-gray-50">
                                                <td className="px-4 py-4">
                                                    <div className="font-semibold text-gray-900">{company.company_name}</div>
                                                    {company.website && (
                                                        <a href={company.website} target="_blank" rel="noopener noreferrer"
                                                            className="text-xs text-blue-600 hover:underline">
                                                            {company.website}
                                                        </a>
                                                    )}
                                                </td>
                                                <td className="px-4 py-4 text-sm text-gray-600">{company.industry || '-'}</td>
                                                <td className="px-4 py-4 text-sm text-gray-600">{company.location || '-'}</td>
                                                <td className="px-4 py-4 text-sm text-gray-600">{company.key_contacts.length} contacts</td>
                                                <td className="px-4 py-4">
                                                    <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">
                                                        {company.channel_source}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <span className={`px-2 py-1 text-xs rounded-full ${company.enrichment_status === 'enriched'
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-yellow-100 text-yellow-700'
                                                        }`}>
                                                        {company.enrichment_status}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <button
                                                        onClick={() => setExpandedCompany(expandedCompany === company.company_name ? null : company.company_name)}
                                                        className="text-sm font-medium hover:underline"
                                                        style={{ color: 'var(--color-primary)' }}
                                                    >
                                                        {expandedCompany === company.company_name ? 'Hide' : 'View'} Details
                                                    </button>
                                                </td>
                                            </tr>
                                            {expandedCompany === company.company_name && (
                                                <tr>
                                                    <td colSpan={7} className="px-4 py-6 bg-gradient-to-br from-gray-50 to-white">
                                                        <div className="space-y-6">
                                                            {/* Company Header */}
                                                            <div className="flex items-start justify-between border-b pb-4">
                                                                <div>
                                                                    <h3 className="text-xl font-bold text-gray-900">{company.company_name}</h3>
                                                                    {company.website && (
                                                                        <a href={company.website} target="_blank" rel="noopener noreferrer"
                                                                            className="text-blue-600 hover:underline text-sm">
                                                                            {company.website}
                                                                        </a>
                                                                    )}
                                                                </div>
                                                                <div className="text-right">
                                                                    <div className="text-sm text-gray-600">Enrichment Status</div>
                                                                    <span className={`inline-block mt-1 px-3 py-1 text-xs rounded-full font-medium ${company.enrichment_status === 'enriched'
                                                                        ? 'bg-green-100 text-green-700'
                                                                        : 'bg-yellow-100 text-yellow-700'
                                                                        }`}>
                                                                        {company.enrichment_status}
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                                                {/* Left Column - Company Info */}
                                                                <div className="space-y-4">
                                                                    {/* Contact Information */}
                                                                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                                                                        <h4 className="font-semibold text-sm mb-3 text-gray-700 flex items-center gap-2">
                                                                            <span className="text-lg">📞</span>
                                                                            Contact Information
                                                                        </h4>
                                                                        <div className="space-y-3 text-sm">
                                                                            {company.main_address && (
                                                                                <div className="flex items-start gap-2">
                                                                                    <span className="text-base mt-0.5">📍</span>
                                                                                    <span className="text-gray-700">{company.main_address}</span>
                                                                                </div>
                                                                            )}
                                                                            {company.email_addresses.length > 0 && (
                                                                                <div>
                                                                                    <div className="text-gray-500 text-xs mb-1">Emails:</div>
                                                                                    <div className="flex flex-wrap gap-2">
                                                                                        {company.email_addresses.map((email, idx) => (
                                                                                            <a
                                                                                                key={idx}
                                                                                                href={`mailto:${email}`}
                                                                                                className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
                                                                                            >
                                                                                                <span>✉️</span>
                                                                                                <span>{email}</span>
                                                                                            </a>
                                                                                        ))}
                                                                                    </div>
                                                                                </div>
                                                                            )}
                                                                            {company.phone_numbers.length > 0 && (
                                                                                <div>
                                                                                    <div className="text-gray-500 text-xs mb-1">Phones:</div>
                                                                                    <div className="flex flex-wrap gap-2">
                                                                                        {company.phone_numbers.map((phone, idx) => (
                                                                                            <div key={idx}>
                                                                                                {phone.has_whatsapp ? (
                                                                                                    <a
                                                                                                        href={`https://wa.me/${phone.number.replace(/[^0-9+]/g, '')}`}
                                                                                                        target="_blank"
                                                                                                        rel="noopener noreferrer"
                                                                                                        className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-green-50 text-green-700 rounded hover:bg-green-100"
                                                                                                    >
                                                                                                        <span>💬</span>
                                                                                                        <span>{phone.number}</span>
                                                                                                        <span className="bg-green-200 px-1 rounded text-xs">WhatsApp</span>
                                                                                                    </a>
                                                                                                ) : (
                                                                                                    <a
                                                                                                        href={`tel:${phone.number}`}
                                                                                                        className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                                                                                                    >
                                                                                                        <span>📞</span>
                                                                                                        <span>{phone.number}</span>
                                                                                                    </a>
                                                                                                )}
                                                                                            </div>
                                                                                        ))}
                                                                                    </div>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>

                                                                    {/* Social Media */}
                                                                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                                                                        <h4 className="font-semibold text-sm mb-3 text-gray-700 flex items-center gap-2">
                                                                            <span className="text-lg">🔗</span>
                                                                            Social Media
                                                                        </h4>
                                                                        <div className="flex flex-wrap gap-2">
                                                                            {company.linkedin_url && (
                                                                                <a href={company.linkedin_url} target="_blank" rel="noopener noreferrer"
                                                                                    className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded hover:bg-blue-100">
                                                                                    <span>🔗</span> LinkedIn
                                                                                </a>
                                                                            )}
                                                                            {company.twitter_url && (
                                                                                <a href={company.twitter_url} target="_blank" rel="noopener noreferrer"
                                                                                    className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-sky-50 text-sky-700 rounded hover:bg-sky-100">
                                                                                    <span>🐦</span> Twitter
                                                                                </a>
                                                                            )}
                                                                            {company.facebook_url && (
                                                                                <a href={company.facebook_url} target="_blank" rel="noopener noreferrer"
                                                                                    className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded hover:bg-blue-100">
                                                                                    <span>📘</span> Facebook
                                                                                </a>
                                                                            )}
                                                                            {company.instagram_url && (
                                                                                <a href={company.instagram_url} target="_blank" rel="noopener noreferrer"
                                                                                    className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-pink-50 text-pink-700 rounded hover:bg-pink-100">
                                                                                    <span>📷</span> Instagram
                                                                                </a>
                                                                            )}
                                                                            {company.youtube_url && (
                                                                                <a href={company.youtube_url} target="_blank" rel="noopener noreferrer"
                                                                                    className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-red-50 text-red-700 rounded hover:bg-red-100">
                                                                                    <span>📺</span> YouTube
                                                                                </a>
                                                                            )}
                                                                            {company.tiktok_url && (
                                                                                <a href={company.tiktok_url} target="_blank" rel="noopener noreferrer"
                                                                                    className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-purple-50 text-purple-700 rounded hover:bg-purple-100">
                                                                                    <span>🎵</span> TikTok
                                                                                </a>
                                                                            )}
                                                                            {company.pinterest_url && (
                                                                                <a href={company.pinterest_url} target="_blank" rel="noopener noreferrer"
                                                                                    className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-red-50 text-red-700 rounded hover:bg-red-100">
                                                                                    <span>📌</span> Pinterest
                                                                                </a>
                                                                            )}
                                                                            {company.whatsapp_url && (
                                                                                <a href={company.whatsapp_url} target="_blank" rel="noopener noreferrer"
                                                                                    className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-green-50 text-green-700 rounded hover:bg-green-100">
                                                                                    <span>💬</span> WhatsApp
                                                                                </a>
                                                                            )}
                                                                            {!company.linkedin_url && !company.twitter_url && !company.facebook_url &&
                                                                                !company.instagram_url && !company.youtube_url && !company.tiktok_url &&
                                                                                !company.pinterest_url && !company.whatsapp_url && (
                                                                                    <span className="text-sm text-gray-500">No social media found</span>
                                                                                )}
                                                                        </div>
                                                                    </div>

                                                                    {/* Branch Locations */}
                                                                    {company.branches && company.branches.length > 0 && (
                                                                        <div className="bg-white rounded-lg border border-gray-200 p-4">
                                                                            <h4 className="font-semibold text-sm mb-3 text-gray-700 flex items-center gap-2">
                                                                                <span className="text-lg">🏢</span>
                                                                                Branch Locations ({company.branches.length})
                                                                            </h4>
                                                                            <div className="space-y-2 max-h-60 overflow-y-auto">
                                                                                {company.branches.map((branch, bIdx) => (
                                                                                    <div key={bIdx} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                                                                                        <div className="font-medium text-sm text-gray-900 mb-1">
                                                                                            {branch.name || `Branch ${bIdx + 1}`}
                                                                                        </div>
                                                                                        {branch.address && <div className="text-xs text-gray-600 flex items-start gap-1"><span>📍</span>{branch.address}</div>}
                                                                                        {branch.phone && <div className="text-xs text-gray-600 flex items-center gap-1"><span>📞</span>{branch.phone}</div>}
                                                                                        {branch.email && <div className="text-xs text-gray-600 flex items-center gap-1"><span>✉️</span>{branch.email}</div>}
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>


                                                                {/* Right Column - Key Contacts */}
                                                                <div>
                                                                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                                                                        <h4 className="font-semibold text-sm mb-3 text-gray-700 flex items-center gap-2">
                                                                            <span className="text-lg">👥</span>
                                                                            Key Contacts ({company.key_contacts.length})
                                                                        </h4>
                                                                        {company.key_contacts.length > 0 ? (
                                                                            <div className="space-y-3 max-h-96 overflow-y-auto">
                                                                                {company.key_contacts.map((contact, cIdx) => (
                                                                                    <div key={cIdx} className="border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow bg-gradient-to-br from-white to-gray-50">
                                                                                        {/* Contact Header */}
                                                                                        <div className="mb-2">
                                                                                            <div className="font-semibold text-gray-900">{contact.full_name}</div>
                                                                                            <div className="text-sm text-gray-600">{contact.designation}</div>
                                                                                            <div className="mt-1">
                                                                                                <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${contact.role_category === 'Decision Maker' ? 'bg-purple-100 text-purple-700' :
                                                                                                        contact.role_category === 'Technical Lead' ? 'bg-blue-100 text-blue-700' :
                                                                                                            contact.role_category === 'Purchasing Authority' ? 'bg-green-100 text-green-700' :
                                                                                                                'bg-gray-100 text-gray-700'
                                                                                                    }`}>
                                                                                                    <span>{contact.role_category === 'Decision Maker' ? '👑' :
                                                                                                        contact.role_category === 'Technical Lead' ? '⚙️' :
                                                                                                            contact.role_category === 'Purchasing Authority' ? '💰' : '👤'}</span>
                                                                                                    <span>{contact.role_category}</span>
                                                                                                </span>
                                                                                            </div>
                                                                                        </div>

                                                                                        {/* Contact Info */}
                                                                                        <div className="space-y-1 mb-2">
                                                                                            {contact.email && (
                                                                                                <a href={`mailto:${contact.email}`} className="flex items-center gap-2 text-xs text-blue-600 hover:text-blue-700">
                                                                                                    <span>✉️</span>
                                                                                                    <span>{contact.email}</span>
                                                                                                </a>
                                                                                            )}
                                                                                            {contact.phone && (
                                                                                                <a href={`tel:${contact.phone}`} className="flex items-center gap-2 text-xs text-green-600 hover:text-green-700">
                                                                                                    <span>📞</span>
                                                                                                    <span>{contact.phone}</span>
                                                                                                </a>
                                                                                            )}
                                                                                        </div>

                                                                                        {/* Social Links */}
                                                                                        <div className="flex flex-wrap gap-1.5">
                                                                                            {contact.linkedin_url && (
                                                                                                <a href={contact.linkedin_url} target="_blank" rel="noopener noreferrer"
                                                                                                    className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded hover:bg-blue-100">
                                                                                                    <span>🔗</span> LinkedIn
                                                                                                </a>
                                                                                            )}
                                                                                            {contact.twitter_url && (
                                                                                                <a href={contact.twitter_url} target="_blank" rel="noopener noreferrer"
                                                                                                    className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-sky-50 text-sky-700 rounded hover:bg-sky-100">
                                                                                                    <span>🐦</span> Twitter
                                                                                                </a>
                                                                                            )}
                                                                                            {contact.instagram_url && (
                                                                                                <a href={contact.instagram_url} target="_blank" rel="noopener noreferrer"
                                                                                                    className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-pink-50 text-pink-700 rounded hover:bg-pink-100">
                                                                                                    <span>📷</span> Instagram
                                                                                                </a>
                                                                                            )}
                                                                                            {contact.facebook_url && (
                                                                                                <a href={contact.facebook_url} target="_blank" rel="noopener noreferrer"
                                                                                                    className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded hover:bg-blue-100">
                                                                                                    <span>📘</span> Facebook
                                                                                                </a>
                                                                                            )}
                                                                                        </div>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        ) : (
                                                                            <div className="text-sm text-gray-500 text-center py-4">No contacts available</div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    ))}
                                </tbody>
                            </table>
                        </div >
                    </div >
                </>
            )
            }
        </div >
    );
}

function LoadingScreen() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
            <div className="w-16 h-16 border-4 rounded-full animate-spin mb-4"
                style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }}></div>
            <p className="text-gray-600">Loading...</p>
        </div>
    );
}
