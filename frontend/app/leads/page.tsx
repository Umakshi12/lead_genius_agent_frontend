"use client";
import { useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { AuthContext } from '../context/AuthContext';
import { useApi } from '../lib/apiClient';
import LeadTable from './components/LeadTable';
import LeadFilters from './components/LeadFilters';

export default function LeadsPage() {
    const router = useRouter();
    const { token } = useContext(AuthContext);
    const { apiFetch } = useApi();

    const [leads, setLeads] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        search: '',
        campaign: '',
        status: '',
        dateFrom: '',
        dateTo: '',
    });
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        total: 0,
    });

    useEffect(() => {
        fetchLeads();
    }, [filters, pagination.page]);

    const fetchLeads = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: pagination.page.toString(),
                limit: pagination.limit.toString(),
                ...(filters.search && { search: filters.search }),
                ...(filters.campaign && { campaign_id: filters.campaign }),
                ...(filters.status && { status: filters.status }),
                ...(filters.dateFrom && { date_from: filters.dateFrom }),
                ...(filters.dateTo && { date_to: filters.dateTo }),
            });

            const data = await apiFetch(`/api/leads?${params}`);
            setLeads(data.leads || []);
            setPagination(prev => ({ ...prev, total: data.total || 0 }));
        } catch (error) {
            console.error('Failed to fetch leads:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' && window.location.hostname !== 'localhost' ? '' : 'http://localhost:8000')}/api/leads/export`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(filters),
                }
            );

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `leads-${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Failed to export leads:', error);
            alert('Failed to export leads. Please try again.');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pt-24 pb-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--color-secondary)' }}>
                            Lead Database
                        </h1>
                        <p className="text-gray-600">
                            {loading ? 'Loading...' : `${pagination.total} total leads`}
                        </p>
                    </div>
                    <button
                        onClick={handleExport}
                        className="oceanic-btn oceanic-btn-outline flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Export CSV
                    </button>
                </div>

                {/* Filters */}
                <LeadFilters filters={filters} setFilters={setFilters} onSearch={fetchLeads} />

                {/* Lead Table */}
                <LeadTable
                    leads={leads}
                    loading={loading}
                    pagination={pagination}
                    setPagination={setPagination}
                />
            </div>
        </div>
    );
}
