"use client";
import Link from 'next/link';

interface LeadTableProps {
    leads: any[];
    loading: boolean;
    pagination: {
        page: number;
        limit: number;
        total: number;
    };
    setPagination: (pagination: any) => void;
}

export default function LeadTable({ leads, loading, pagination, setPagination }: LeadTableProps) {
    const totalPages = Math.ceil(pagination.total / pagination.limit);

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

    if (loading) {
        return (
            <div className="oceanic-card p-12">
                <div className="flex items-center justify-center">
                    <div className="w-12 h-12 border-4 rounded-full animate-spin"
                        style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }}></div>
                </div>
            </div>
        );
    }

    if (leads.length === 0) {
        return (
            <div className="oceanic-card p-12 text-center">
                <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center"
                    style={{ backgroundColor: 'rgba(184, 148, 111, 0.1)' }}>
                    <svg className="w-10 h-10" style={{ color: 'var(--color-primary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                </div>
                <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--color-secondary)' }}>
                    No Leads Found
                </h3>
                <p className="text-gray-600 mb-6">Start generating leads from your campaigns</p>
                <Link href="/dashboard" className="oceanic-btn oceanic-btn-primary">
                    Go to Dashboard
                </Link>
            </div>
        );
    }

    return (
        <>
            <div className="oceanic-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-secondary)' }}>
                                    Company
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-secondary)' }}>
                                    Contact
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-secondary)' }}>
                                    Campaign
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-secondary)' }}>
                                    Status
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-secondary)' }}>
                                    Added
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-secondary)' }}>
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {leads.map((lead) => (
                                <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
                                                style={{ background: 'linear-gradient(135deg, #b8946f 0%, #8b6f4d 100%)' }}>
                                                {lead.company_name?.charAt(0) || 'L'}
                                            </div>
                                            <div>
                                                <p className="font-semibold" style={{ color: 'var(--color-secondary)' }}>
                                                    {lead.company_name || 'Unknown Company'}
                                                </p>
                                                {lead.website && (
                                                    <a href={lead.website} target="_blank" rel="noopener noreferrer"
                                                        className="text-xs hover:underline"
                                                        style={{ color: 'var(--color-primary)' }}>
                                                        {lead.website}
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm">
                                            {lead.email_addresses && lead.email_addresses.length > 0 && (
                                                <p className="text-gray-700">{lead.email_addresses[0]}</p>
                                            )}
                                            {lead.phone_numbers && lead.phone_numbers.length > 0 && (
                                                <p className="text-gray-500 text-xs">
                                                    {typeof lead.phone_numbers[0] === 'string' ? lead.phone_numbers[0] : lead.phone_numbers[0].number}
                                                </p>
                                            )}
                                            {(!lead.email_addresses || lead.email_addresses.length === 0) && (!lead.phone_numbers || lead.phone_numbers.length === 0) && (
                                                <p className="text-gray-400 text-xs">No contact info</p>
                                            )}
                                            
                                            {/* Social Links Mini */}
                                            <div className="flex gap-2 mt-1">
                                                {lead.linkedin_url && (
                                                    <a href={lead.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 text-xs" title="LinkedIn">
                                                        in
                                                    </a>
                                                )}
                                                {lead.twitter_url && (
                                                    <a href={lead.twitter_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-600 text-xs" title="Twitter">
                                                        tw
                                                    </a>
                                                )}
                                                {lead.facebook_url && (
                                                    <a href={lead.facebook_url} target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:text-blue-900 text-xs" title="Facebook">
                                                        fb
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-sm text-gray-700">{lead.campaign_name || 'N/A'}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(lead.status || 'new')}`}>
                                            {lead.status || 'New'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-sm text-gray-600">
                                            {lead.created_at ? new Date(lead.created_at).toLocaleDateString() : 'N/A'}
                                        </p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <Link
                                            href={`/leads/${lead.id}`}
                                            className="text-sm font-medium hover:underline"
                                            style={{ color: 'var(--color-primary)' }}
                                        >
                                            View Details
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between">
                    <p className="text-sm text-gray-600">
                        Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} leads
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                            disabled={pagination.page === 1}
                            className="oceanic-btn oceanic-btn-outline disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Previous
                        </button>
                        <div className="flex gap-1">
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                const page = i + 1;
                                return (
                                    <button
                                        key={page}
                                        onClick={() => setPagination({ ...pagination, page })}
                                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${pagination.page === page
                                                ? 'bg-[var(--color-primary)] text-white'
                                                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                                            }`}
                                    >
                                        {page}
                                    </button>
                                );
                            })}
                        </div>
                        <button
                            onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                            disabled={pagination.page === totalPages}
                            className="oceanic-btn oceanic-btn-outline disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
