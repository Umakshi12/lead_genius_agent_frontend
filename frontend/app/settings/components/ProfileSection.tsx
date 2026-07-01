"use client";
import { useState } from 'react';
import { useApi } from '../../lib/api';

interface ProfileSectionProps {
    userData: any;
    setUserData: (data: any) => void;
}

export default function ProfileSection({ userData, setUserData }: ProfileSectionProps) {
    const { apiFetch } = useApi();
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        firstName: userData?.first_name || '',
        lastName: userData?.last_name || '',
        email: userData?.email || '',
        company: userData?.company || '',
        phone: userData?.phone || '',
        bio: userData?.bio || '',
    });

    const handleSave = async () => {
        setSaving(true);
        try {
            const updatedData = await apiFetch('/api/user/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    first_name: formData.firstName,
                    last_name: formData.lastName,
                    company: formData.company,
                    phone: formData.phone,
                    bio: formData.bio,
                })
            });
            setUserData(updatedData);
            setEditing(false);
            alert('Profile updated successfully!');
        } catch (error) {
            console.error('Failed to update profile:', error);
            alert('Failed to update profile. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setFormData({
            firstName: userData?.first_name || '',
            lastName: userData?.last_name || '',
            email: userData?.email || '',
            company: userData?.company || '',
            phone: userData?.phone || '',
            bio: userData?.bio || '',
        });
        setEditing(false);
    };

    return (
        <div className="space-y-6">
            {/* Profile Picture */}
            <div className="flex items-center gap-6">
                <div className="w-24 h-24 rounded-full flex items-center justify-center text-white font-bold text-3xl"
                    style={{ background: 'linear-gradient(135deg, #b8946f 0%, #8b6f4d 100%)' }}>
                    {formData.firstName?.charAt(0) || 'U'}
                </div>
                <div>
                    <h3 className="font-semibold text-lg mb-1" style={{ color: 'var(--color-secondary)' }}>
                        Profile Picture
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">Upload a photo to personalize your account</p>
                    <button className="oceanic-btn oceanic-btn-outline text-sm px-4 py-2">
                        Upload Photo
                    </button>
                </div>
            </div>

            {/* Profile Information */}
            <div className="border-t border-gray-200 pt-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold" style={{ color: 'var(--color-secondary)' }}>
                        Profile Information
                    </h3>
                    {!editing && (
                        <button
                            onClick={() => setEditing(true)}
                            className="oceanic-btn oceanic-btn-outline text-sm px-4 py-2"
                        >
                            Edit Profile
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
                            First Name
                        </label>
                        <input
                            type="text"
                            value={formData.firstName}
                            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                            disabled={!editing}
                            className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:border-[var(--color-primary)] transition-colors disabled:bg-gray-50"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
                            Last Name
                        </label>
                        <input
                            type="text"
                            value={formData.lastName}
                            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                            disabled={!editing}
                            className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:border-[var(--color-primary)] transition-colors disabled:bg-gray-50"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
                            Email
                        </label>
                        <input
                            type="email"
                            value={formData.email}
                            disabled
                            className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 bg-gray-50 cursor-not-allowed"
                        />
                        <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
                            Phone
                        </label>
                        <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            disabled={!editing}
                            placeholder="+1 (555) 123-4567"
                            className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:border-[var(--color-primary)] transition-colors disabled:bg-gray-50"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
                            Company
                        </label>
                        <input
                            type="text"
                            value={formData.company}
                            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                            disabled={!editing}
                            placeholder="Your company name"
                            className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:border-[var(--color-primary)] transition-colors disabled:bg-gray-50"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
                            Bio
                        </label>
                        <textarea
                            value={formData.bio}
                            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                            disabled={!editing}
                            placeholder="Tell us about yourself..."
                            rows={4}
                            className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:border-[var(--color-primary)] transition-colors disabled:bg-gray-50"
                        />
                    </div>
                </div>

                {editing && (
                    <div className="flex gap-3 mt-6">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="oceanic-btn oceanic-btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                        <button
                            onClick={handleCancel}
                            disabled={saving}
                            className="oceanic-btn oceanic-btn-outline"
                        >
                            Cancel
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
