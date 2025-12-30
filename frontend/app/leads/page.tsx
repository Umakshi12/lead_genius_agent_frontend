"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface PersonContact {
    full_name: string;
    designation: string;
    role_category: string;
    email?: string;
    phone?: string;
    linkedin_url?: string;
    confidence_score: number;
}

interface CompanyLead {
    company_name: string;
    website?: string;
    industry?: string;
    company_size?: string;
    location?: string;
    linkedin_url?: string;
    twitter_url?: string;
    email_addresses: string[];
    phone_numbers: Array<{ number: string, has_whatsapp: boolean }>;
    key_contacts: PersonContact[];
    channel_source: string;
    keywords_matched: string[];
    confidence_score: number;
    enrichment_status: string;
}

export default function LeadsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [leads, setLeads] = useState<CompanyLead[]>([]);
    const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
    const [totalLeads, setTotalLeads] = useState(0);
    const [leadsByChannel, setLeadsByChannel] = useState<Record<string, number>>({});
    const [expandedCompany, setExpandedCompany] = useState<string | null>(null);

    useEffect(() => {
        const stored = localStorage.getItem('leadGenius_strategy');
        if (!stored) {
            router.push('/');
            return;
        }

        const strategyData = JSON.parse(stored);
        const channels = strategyData.channels.map((c: any) => c.name);
        setSelectedChannels(channels);
        setLoading(false);
    }, [router]);

    const handleGenerateLeads = async () => {
        setGenerating(true);

        try {
            const stored = localStorage.getItem('leadGenius_strategy');
            if (!stored) return;

            const strategyData = JSON.parse(stored);

            const payload = {
                selected_channels: strategyData.channels.map((c: any) => c.name),
                selected_keywords: strategyData.keywords || [],
                target_industries: strategyData.target_industries || [],
                company_summary: strategyData.company_summary || "",
                max_leads_per_channel: 10
            };

            const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
            const res = await fetch(`${baseUrl}/generate-leads`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await res.json();

            setLeads(result.companies || []);
            setTotalLeads(result.total_leads || 0);
            setLeadsByChannel(result.leads_by_channel || {});

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
            'LinkedIn', 'Twitter', 'Email Addresses', 'Phone Numbers',
            'Channel Source', 'Keywords Matched', 'Confidence Score', 'Enrichment Status',
            'Contact Name', 'Contact Designation', 'Contact Role', 'Contact Email',
            'Contact LinkedIn', 'Contact Confidence'
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
                    company.email_addresses.join('; '),
                    company.phone_numbers.map(p => `${p.number}${p.has_whatsapp ? ' (WhatsApp)' : ''}`).join('; '),
                    company.channel_source,
                    company.keywords_matched.join('; '),
                    company.confidence_score.toFixed(2),
                    company.enrichment_status,
                    '', '', '', '', '', ''
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
                        company.email_addresses.join('; '),
                        company.phone_numbers.map(p => `${p.number}${p.has_whatsapp ? ' (WhatsApp)' : ''}`).join('; '),
                        company.channel_source,
                        company.keywords_matched.join('; '),
                        company.confidence_score.toFixed(2),
                        company.enrichment_status,
                        contact.full_name,
                        contact.designation,
                        contact.role_category,
                        contact.email || '',
                        contact.linkedin_url || '',
                        contact.confidence_score.toFixed(2)
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

            {/* Channel Selection Summary */}
            <div className="oceanic-card p-6 mb-6">
                <h3 className="font-bold mb-3" style={{ color: 'var(--color-secondary)' }}>Selected Channels</h3>
                <div className="flex flex-wrap gap-2">
                    {selectedChannels.map((channel, idx) => (
                        <span key={idx} className="px-4 py-2 rounded-lg text-sm font-medium"
                            style={{ backgroundColor: 'rgba(184, 148, 111, 0.1)', color: 'var(--color-primary-dark)', border: '1px solid var(--color-primary)' }}>
                            {channel}
                        </span>
                    ))}
                </div>
            </div>

            {/* Generate Button */}
            {leads.length === 0 && (
                <div className="text-center py-12">
                    <button
                        onClick={handleGenerateLeads}
                        disabled={generating}
                        className="oceanic-btn oceanic-btn-primary text-lg px-12 py-4 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {generating ? (
                            <span className="flex items-center gap-2">
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Generating Leads...
                            </span>
                        ) : 'Start Lead Generation'}
                    </button>
                    <p className="text-sm text-gray-500 mt-4">This may take a few moments</p>
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
                                        <>
                                            <tr key={idx} className="hover:bg-gray-50">
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
                                                    <td colSpan={7} className="px-4 py-4 bg-gray-50">
                                                        <div className="space-y-4">
                                                            {/* Company Details */}
                                                            <div className="grid grid-cols-2 gap-4">
                                                                <div>
                                                                    <h4 className="font-semibold text-sm mb-2" style={{ color: 'var(--color-secondary)' }}>Company Information</h4>
                                                                    <div className="text-sm space-y-1">
                                                                        <div><span className="text-gray-600">Size:</span> {company.company_size || 'N/A'}</div>
                                                                        <div><span className="text-gray-600">LinkedIn:</span> {company.linkedin_url ? <a href={company.linkedin_url} target="_blank" className="text-blue-600 hover:underline">View</a> : 'N/A'}</div>
                                                                        <div><span className="text-gray-600">Emails:</span> {company.email_addresses.join(', ') || 'N/A'}</div>
                                                                        <div><span className="text-gray-600">Phones:</span> {company.phone_numbers.map(p => p.number).join(', ') || 'N/A'}</div>
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <h4 className="font-semibold text-sm mb-2" style={{ color: 'var(--color-secondary)' }}>Key Contacts</h4>
                                                                    {company.key_contacts.length > 0 ? (
                                                                        <div className="space-y-2">
                                                                            {company.key_contacts.map((contact, cIdx) => (
                                                                                <div key={cIdx} className="text-sm border-l-2 pl-3" style={{ borderColor: 'var(--color-primary)' }}>
                                                                                    <div className="font-semibold">{contact.full_name}</div>
                                                                                    <div className="text-gray-600">{contact.designation}</div>
                                                                                    <div className="text-xs text-gray-500">{contact.role_category}</div>
                                                                                    {contact.email && <div className="text-xs text-blue-600">{contact.email}</div>}
                                                                                    {contact.linkedin_url && <a href={contact.linkedin_url} target="_blank" className="text-xs text-blue-600 hover:underline">LinkedIn</a>}
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    ) : (
                                                                        <div className="text-sm text-gray-500">No contacts available</div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
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
