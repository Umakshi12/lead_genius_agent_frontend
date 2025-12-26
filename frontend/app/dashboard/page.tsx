"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
    const router = useRouter();
    const [campaigns, setCampaigns] = useState<any[]>([]);

    useEffect(() => {
        // Mock loading from local storage
        // In a real app, this would come from the backend DB
        const saved = localStorage.getItem('leadGenius_campaigns');
        if (saved) {
            setCampaigns(JSON.parse(saved));
        } else {
            // Add a demo campaign
            setCampaigns([{
                name: "Acme Corp Strategy",
                date: new Date().toLocaleDateString(),
                status: "Complete",
                keywords: 12,
                channels: 4
            }]);
        }
    }, []);

    return (
        <div className="min-h-screen p-4 md:p-8 pt-24 max-w-7xl mx-auto animate-fade-in">
            <h1 className="text-3xl font-bold text-white mb-8 font-outfit">Campaign Dashboard</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* New Campaign Card */}
                <div
                    onClick={() => router.push('/')}
                    className="glass-card p-6 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-slate-800/60 transition border border-dashed border-slate-600 min-h-[200px] group"
                >
                    <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                    </div>
                    <p className="text-white font-semibold">Start New Campaign</p>
                    <p className="text-slate-500 text-sm mt-1">Run fresh analysis</p>
                </div>

                {/* Existing Campaigns */}
                {campaigns.map((c, i) => (
                    <div key={i} className="glass-card p-6 rounded-xl relative group hover:border-blue-500/30 transition">
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center text-white font-bold border border-white/10">
                                {c.name.charAt(0)}
                            </div>
                            <span className="px-2 py-1 rounded text-xs bg-green-500/10 text-green-400 border border-green-500/20">
                                {c.status}
                            </span>
                        </div>

                        <h3 className="text-xl font-bold text-white mb-1">{c.name}</h3>
                        <p className="text-slate-400 text-sm mb-6">Created on {c.date}</p>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="bg-slate-800/50 rounded p-2 text-center">
                                <span className="block text-white font-bold">{c.keywords}</span>
                                <span className="text-xs text-slate-500">Keywords</span>
                            </div>
                            <div className="bg-slate-800/50 rounded p-2 text-center">
                                <span className="block text-white font-bold">{c.channels}</span>
                                <span className="text-xs text-slate-500">Channels</span>
                            </div>
                        </div>

                        <button className="w-full py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white text-sm font-medium transition flex items-center justify-center gap-2 group-hover:bg-blue-600">
                            View Results
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                ))}
            </div>
        </div>
    )
}
