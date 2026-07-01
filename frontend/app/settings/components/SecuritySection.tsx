"use client";
import { useState } from 'react';
import { useApi } from '../../lib/api';

export default function SecuritySection() {
    const { apiFetch } = useApi();
    const [changing, setChanging] = useState(false);
    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.newPassword !== formData.confirmPassword) {
            alert('New passwords do not match');
            return;
        }

        if (formData.newPassword.length < 8) {
            alert('Password must be at least 8 characters long');
            return;
        }

        setChanging(true);
        try {
            await apiFetch('/api/user/password', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    current_password: formData.currentPassword,
                    new_password: formData.newPassword,
                })
            });

            alert('Password changed successfully!');
            setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error) {
            console.error('Failed to change password:', error);
            alert('Failed to change password. Please check your current password and try again.');
        } finally {
            setChanging(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Change Password */}
            <div>
                <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--color-secondary)' }}>
                    Change Password
                </h3>
                <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                    <div>
                        <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
                            Current Password
                        </label>
                        <input
                            type="password"
                            value={formData.currentPassword}
                            onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                            required
                            className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
                            New Password
                        </label>
                        <input
                            type="password"
                            value={formData.newPassword}
                            onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                            required
                            minLength={8}
                            className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                        />
                        <p className="text-xs text-gray-500 mt-1">Must be at least 8 characters</p>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
                            Confirm New Password
                        </label>
                        <input
                            type="password"
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                            required
                            className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={changing}
                        className="oceanic-btn oceanic-btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {changing ? 'Changing Password...' : 'Change Password'}
                    </button>
                </form>
            </div>

            {/* Two-Factor Authentication (Coming Soon) */}
            <div className="border-t border-gray-200 pt-6">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--color-secondary)' }}>
                            Two-Factor Authentication
                        </h3>
                        <p className="text-sm text-gray-600 mb-4">
                            Add an extra layer of security to your account
                        </p>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                        Coming Soon
                    </span>
                </div>
                <button
                    disabled
                    className="oceanic-btn oceanic-btn-outline opacity-50 cursor-not-allowed"
                >
                    Enable 2FA
                </button>
            </div>

            {/* Active Sessions */}
            <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--color-secondary)' }}>
                    Active Sessions
                </h3>
                <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center"
                                style={{ backgroundColor: 'rgba(184, 148, 111, 0.1)' }}>
                                <svg className="w-5 h-5" style={{ color: 'var(--color-primary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <div>
                                <p className="font-semibold text-sm" style={{ color: 'var(--color-secondary)' }}>
                                    Current Device
                                </p>
                                <p className="text-xs text-gray-500">Windows • Chrome • Last active now</p>
                            </div>
                        </div>
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            Active
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
