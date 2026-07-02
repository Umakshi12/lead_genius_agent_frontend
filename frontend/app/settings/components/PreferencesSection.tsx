"use client";
import { useState } from 'react';
import { useApi } from '../../lib/apiClient';

interface PreferencesSectionProps {
    userData: any;
    setUserData: (data: any) => void;
}

export default function PreferencesSection({ userData, setUserData }: PreferencesSectionProps) {
    const { apiFetch } = useApi();
    const [saving, setSaving] = useState(false);
    const [preferences, setPreferences] = useState({
        emailNotifications: userData?.preferences?.email_notifications ?? true,
        weeklyDigest: userData?.preferences?.weekly_digest ?? true,
        campaignUpdates: userData?.preferences?.campaign_updates ?? true,
        leadAlerts: userData?.preferences?.lead_alerts ?? true,
        theme: userData?.preferences?.theme ?? 'light',
        timezone: userData?.preferences?.timezone ?? 'America/New_York',
        language: userData?.preferences?.language ?? 'en',
    });

    const handleSave = async () => {
        setSaving(true);
        try {
            await apiFetch('/api/user/preferences', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email_notifications: preferences.emailNotifications,
                    weekly_digest: preferences.weeklyDigest,
                    campaign_updates: preferences.campaignUpdates,
                    lead_alerts: preferences.leadAlerts,
                    theme: preferences.theme,
                    timezone: preferences.timezone,
                    language: preferences.language,
                })
            });
            alert('Preferences saved successfully!');
        } catch (error) {
            console.error('Failed to save preferences:', error);
            alert('Failed to save preferences. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Email Notifications */}
            <div>
                <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--color-secondary)' }}>
                    Email Notifications
                </h3>
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                            <p className="font-semibold text-sm" style={{ color: 'var(--color-secondary)' }}>
                                Email Notifications
                            </p>
                            <p className="text-xs text-gray-500">Receive email updates about your account</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={preferences.emailNotifications}
                                onChange={(e) => setPreferences({ ...preferences, emailNotifications: e.target.checked })}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-primary)]"></div>
                        </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                            <p className="font-semibold text-sm" style={{ color: 'var(--color-secondary)' }}>
                                Weekly Digest
                            </p>
                            <p className="text-xs text-gray-500">Get a weekly summary of your campaigns</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={preferences.weeklyDigest}
                                onChange={(e) => setPreferences({ ...preferences, weeklyDigest: e.target.checked })}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-primary)]"></div>
                        </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                            <p className="font-semibold text-sm" style={{ color: 'var(--color-secondary)' }}>
                                Campaign Updates
                            </p>
                            <p className="text-xs text-gray-500">Notifications when campaigns complete</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={preferences.campaignUpdates}
                                onChange={(e) => setPreferences({ ...preferences, campaignUpdates: e.target.checked })}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-primary)]"></div>
                        </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                            <p className="font-semibold text-sm" style={{ color: 'var(--color-secondary)' }}>
                                New Lead Alerts
                            </p>
                            <p className="text-xs text-gray-500">Get notified when new leads are found</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={preferences.leadAlerts}
                                onChange={(e) => setPreferences({ ...preferences, leadAlerts: e.target.checked })}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-primary)]"></div>
                        </label>
                    </div>
                </div>
            </div>

            {/* Appearance */}
            <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--color-secondary)' }}>
                    Appearance
                </h3>
                <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
                        Theme
                    </label>
                    <div className="grid grid-cols-3 gap-3 max-w-md">
                        <button
                            onClick={() => setPreferences({ ...preferences, theme: 'light' })}
                            className={`p-4 rounded-lg border-2 transition-all ${preferences.theme === 'light'
                                    ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                        >
                            <div className="text-center">
                                <span className="text-2xl mb-1 block">☀️</span>
                                <span className="text-sm font-medium">Light</span>
                            </div>
                        </button>
                        <button
                            onClick={() => setPreferences({ ...preferences, theme: 'dark' })}
                            className={`p-4 rounded-lg border-2 transition-all ${preferences.theme === 'dark'
                                    ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                        >
                            <div className="text-center">
                                <span className="text-2xl mb-1 block">🌙</span>
                                <span className="text-sm font-medium">Dark</span>
                            </div>
                        </button>
                        <button
                            onClick={() => setPreferences({ ...preferences, theme: 'auto' })}
                            className={`p-4 rounded-lg border-2 transition-all ${preferences.theme === 'auto'
                                    ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                        >
                            <div className="text-center">
                                <span className="text-2xl mb-1 block">💻</span>
                                <span className="text-sm font-medium">Auto</span>
                            </div>
                        </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Dark mode coming soon</p>
                </div>
            </div>

            {/* Regional Settings */}
            <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--color-secondary)' }}>
                    Regional Settings
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
                    <div>
                        <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
                            Timezone
                        </label>
                        <select
                            value={preferences.timezone}
                            onChange={(e) => setPreferences({ ...preferences, timezone: e.target.value })}
                            className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                        >
                            <option value="America/New_York">Eastern Time (ET)</option>
                            <option value="America/Chicago">Central Time (CT)</option>
                            <option value="America/Denver">Mountain Time (MT)</option>
                            <option value="America/Los_Angeles">Pacific Time (PT)</option>
                            <option value="Europe/London">London (GMT)</option>
                            <option value="Europe/Paris">Paris (CET)</option>
                            <option value="Asia/Tokyo">Tokyo (JST)</option>
                            <option value="Asia/Kolkata">India (IST)</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
                            Language
                        </label>
                        <select
                            value={preferences.language}
                            onChange={(e) => setPreferences({ ...preferences, language: e.target.value })}
                            className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                        >
                            <option value="en">English</option>
                            <option value="es">Español</option>
                            <option value="fr">Français</option>
                            <option value="de">Deutsch</option>
                            <option value="ja">日本語</option>
                        </select>
                        <p className="text-xs text-gray-500 mt-1">More languages coming soon</p>
                    </div>
                </div>
            </div>

            {/* Save Button */}
            <div className="border-t border-gray-200 pt-6">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="oceanic-btn oceanic-btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {saving ? 'Saving Preferences...' : 'Save Preferences'}
                </button>
            </div>
        </div>
    );
}
