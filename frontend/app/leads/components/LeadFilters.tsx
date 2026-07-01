"use client";

interface LeadFiltersProps {
    filters: {
        search: string;
        campaign: string;
        status: string;
        dateFrom: string;
        dateTo: string;
    };
    setFilters: (filters: any) => void;
    onSearch: () => void;
}

export default function LeadFilters({ filters, setFilters, onSearch }: LeadFiltersProps) {
    const handleReset = () => {
        setFilters({
            search: '',
            campaign: '',
            status: '',
            dateFrom: '',
            dateTo: '',
        });
    };

    return (
        <div className="oceanic-card p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Search */}
                <div className="lg:col-span-2">
                    <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
                        Search
                    </label>
                    <div className="relative">
                        <input
                            type="text"
                            value={filters.search}
                            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                            placeholder="Search by company name..."
                            className="w-full border-2 border-gray-200 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                            onKeyPress={(e) => e.key === 'Enter' && onSearch()}
                        />
                        <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                </div>

                {/* Status */}
                <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
                        Status
                    </label>
                    <select
                        value={filters.status}
                        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                        className="w-full border-2 border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                    >
                        <option value="">All Statuses</option>
                        <option value="new">New</option>
                        <option value="contacted">Contacted</option>
                        <option value="qualified">Qualified</option>
                        <option value="converted">Converted</option>
                        <option value="lost">Lost</option>
                    </select>
                </div>

                {/* Date From */}
                <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
                        From Date
                    </label>
                    <input
                        type="date"
                        value={filters.dateFrom}
                        onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                        className="w-full border-2 border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                    />
                </div>

                {/* Date To */}
                <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
                        To Date
                    </label>
                    <input
                        type="date"
                        value={filters.dateTo}
                        onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                        className="w-full border-2 border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                    />
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-4">
                <button onClick={onSearch} className="oceanic-btn oceanic-btn-primary">
                    Apply Filters
                </button>
                <button onClick={handleReset} className="oceanic-btn oceanic-btn-outline">
                    Reset
                </button>
            </div>
        </div>
    );
}
