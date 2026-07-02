"use client";
import { useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { AuthContext } from '../context/AuthContext';
import { useApi } from '../lib/apiClient';
import ProfileSection from './components/ProfileSection';
import SecuritySection from './components/SecuritySection';
import PreferencesSection from './components/PreferencesSection';

type Tab = 'profile' | 'security' | 'preferences';

export default function SettingsPage() {
    const router = useRouter();
    const { token } = useContext(AuthContext);
    const { apiFetch } = useApi();
    const [activeTab, setActiveTab] = useState<Tab>('profile');
    const [loading, setLoading] = useState(true);
    const [userData, setUserData] = useState<any>(null);

    useEffect(() => {
        if (!token) {
            router.push('/login');
            return;
        }

        const fetchUserData = async () => {
            try {
                const data = await apiFetch('/api/user/profile');
                setUserData(data);
            } catch (error) {
                console.error('Failed to fetch user data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, [token]);

    const tabs = [
        { id: 'profile' as Tab, label: 'Profile', icon: '👤' },
        { id: 'security' as Tab, label: 'Security', icon: '🔒' },
        { id: 'preferences' as Tab, label: 'Preferences', icon: '⚙️' },
    ];

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-24">
                <div className="w-12 h-12 border-4 rounded-full animate-spin"
                    style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }}></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pt-24 pb-12">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--color-secondary)' }}>
                        Settings
                    </h1>
                    <p className="text-gray-600">Manage your account settings and preferences</p>
                </div>

                {/* Tabs */}
                <div className="oceanic-card mb-6">
                    <div className="border-b border-gray-200">
                        <nav className="flex -mb-px">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`px-6 py-4 text-sm font-medium transition-colors border-b-2 ${activeTab === tab.id
                                            ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                                >
                                    <span className="mr-2">{tab.icon}</span>
                                    {tab.label}
                                </button>
                            ))}
                        </nav>
                    </div>

                    <div className="p-6">
                        {activeTab === 'profile' && <ProfileSection userData={userData} setUserData={setUserData} />}
                        {activeTab === 'security' && <SecuritySection />}
                        {activeTab === 'preferences' && <PreferencesSection userData={userData} setUserData={setUserData} />}
                    </div>
                </div>

                {/* Danger Zone */}
                <div className="oceanic-card border-2 border-red-200">
                    <div className="p-6">
                        <h3 className="text-lg font-bold text-red-600 mb-2">Danger Zone</h3>
                        <p className="text-sm text-gray-600 mb-4">
                            Once you delete your account, there is no going back. Please be certain.
                        </p>
                        <button className="oceanic-btn text-sm px-4 py-2 bg-red-600 text-white border-red-600 hover:bg-red-700 hover:border-red-700">
                            Delete Account
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
