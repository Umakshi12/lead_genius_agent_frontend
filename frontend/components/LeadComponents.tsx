import React from 'react';

interface SocialMediaLinksProps {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
    instagram?: string;
    youtube?: string;
    tiktok?: string;
    pinterest?: string;
    whatsapp?: string;
}

export function SocialMediaLinks({
    linkedin,
    twitter,
    facebook,
    instagram,
    youtube,
    tiktok,
    pinterest,
    whatsapp
}: SocialMediaLinksProps) {
    const socialPlatforms = [
        { name: 'LinkedIn', url: linkedin, color: 'blue', icon: '🔗' },
        { name: 'Twitter', url: twitter, color: 'sky', icon: '🐦' },
        { name: 'Facebook', url: facebook, color: 'blue', icon: '📘' },
        { name: 'Instagram', url: instagram, color: 'pink', icon: '📷' },
        { name: 'YouTube', url: youtube, color: 'red', icon: '📺' },
        { name: 'TikTok', url: tiktok, color: 'purple', icon: '🎵' },
        { name: 'Pinterest', url: pinterest, color: 'red', icon: '📌' },
        { name: 'WhatsApp', url: whatsapp, color: 'green', icon: '💬' },
    ];

    const activePlatforms = socialPlatforms.filter(p => p.url);

    if (activePlatforms.length === 0) {
        return <span className="text-sm text-gray-500">No social media</span>;
    }

    return (
        <div className="flex flex-wrap gap-2">
            {activePlatforms.map((platform) => (
                <a
                    key={platform.name}
                    href={platform.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-${platform.color}-50 text-${platform.color}-700 hover:bg-${platform.color}-100 transition-colors`}
                    title={platform.url}
                >
                    <span>{platform.icon}</span>
                    <span>{platform.name}</span>
                </a>
            ))}
        </div>
    );
}

interface PhoneNumberProps {
    number: string;
    hasWhatsapp: boolean;
}

export function PhoneNumber({ number, hasWhatsapp }: PhoneNumberProps) {
    const cleanNumber = number.replace(/[^0-9+]/g, '');

    return (
        <div className="inline-flex items-center gap-2">
            {hasWhatsapp ? (
                <a
                    href={`https://wa.me/${cleanNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm px-3 py-1 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
                    title="Chat on WhatsApp"
                >
                    <span className="text-base">💬</span>
                    <span>{number}</span>
                    <span className="text-xs bg-green-200 px-1.5 py-0.5 rounded">WhatsApp</span>
                </a>
            ) : (
                <a
                    href={`tel:${cleanNumber}`}
                    className="inline-flex items-center gap-1 text-sm px-3 py-1 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                >
                    <span className="text-base">📞</span>
                    <span>{number}</span>
                </a>
            )}
        </div>
    );
}

interface RoleBadgeProps {
    category: string;
}

export function RoleBadge({ category }: RoleBadgeProps) {
    const colors: Record<string, { bg: string, text: string, icon: string }> = {
        'Decision Maker': { bg: 'bg-purple-100', text: 'text-purple-700', icon: '👑' },
        'Technical Lead': { bg: 'bg-blue-100', text: 'text-blue-700', icon: '⚙️' },
        'Purchasing Authority': { bg: 'bg-green-100', text: 'text-green-700', icon: '💰' },
        'Other': { bg: 'bg-gray-100', text: 'text-gray-700', icon: '👤' },
    };

    const style = colors[category] || colors['Other'];

    return (
        <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${style.bg} ${style.text} font-medium`}>
            <span>{style.icon}</span>
            <span>{category}</span>
        </span>
    );
}

interface ExecutiveCardProps {
    contact: {
        full_name: string;
        designation: string;
        role_category: string;
        email?: string;
        phone?: string;
        linkedin_url?: string;
        twitter_url?: string;
        instagram_url?: string;
        facebook_url?: string;
    };
}

export function ExecutiveCard({ contact }: ExecutiveCardProps) {
    return (
        <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
            {/* Header */}
            <div className="mb-3">
                <h5 className="font-semibold text-gray-900 mb-1">{contact.full_name}</h5>
                <p className="text-sm text-gray-600 mb-2">{contact.designation}</p>
                <RoleBadge category={contact.role_category} />
            </div>

            {/* Contact Methods */}
            {(contact.email || contact.phone) && (
                <div className="mb-3 space-y-2">
                    {contact.email && (
                        <a
                            href={`mailto:${contact.email}`}
                            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
                        >
                            <span>✉️</span>
                            <span>{contact.email}</span>
                        </a>
                    )}
                    {contact.phone && (
                        <a
                            href={`tel:${contact.phone}`}
                            className="flex items-center gap-2 text-sm text-green-600 hover:text-green-700"
                        >
                            <span>📞</span>
                            <span>{contact.phone}</span>
                        </a>
                    )}
                </div>
            )}

            {/* Social Links */}
            <div className="flex flex-wrap gap-2">
                {contact.linkedin_url && (
                    <a
                        href={contact.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
                        title="LinkedIn Profile"
                    >
                        <span>🔗</span>
                        <span>LinkedIn</span>
                    </a>
                )}
                {contact.twitter_url && (
                    <a
                        href={contact.twitter_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-sky-50 text-sky-700 rounded hover:bg-sky-100"
                        title="Twitter Profile"
                    >
                        <span>🐦</span>
                        <span>Twitter</span>
                    </a>
                )}
                {contact.instagram_url && (
                    <a
                        href={contact.instagram_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-pink-50 text-pink-700 rounded hover:bg-pink-100"
                        title="Instagram Profile"
                    >
                        <span>📷</span>
                        <span>Instagram</span>
                    </a>
                )}
                {contact.facebook_url && (
                    <a
                        href={contact.facebook_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
                        title="Facebook Profile"
                    >
                        <span>📘</span>
                        <span>Facebook</span>
                    </a>
                )}
            </div>
        </div>
    );
}

interface BranchCardProps {
    branch: {
        name?: string;
        address?: string;
        phone?: string;
        email?: string;
    };
    index: number;
}

export function BranchCard({ branch, index }: BranchCardProps) {
    return (
        <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
            <h6 className="font-medium text-gray-900 mb-2">
                {branch.name || `Branch ${index + 1}`}
            </h6>
            <div className="space-y-1 text-sm text-gray-600">
                {branch.address && (
                    <div className="flex items-start gap-2">
                        <span className="text-base">📍</span>
                        <span>{branch.address}</span>
                    </div>
                )}
                {branch.phone && (
                    <div className="flex items-center gap-2">
                        <span className="text-base">📞</span>
                        <a href={`tel:${branch.phone}`} className="text-blue-600 hover:underline">
                            {branch.phone}
                        </a>
                    </div>
                )}
                {branch.email && (
                    <div className="flex items-center gap-2">
                        <span className="text-base">✉️</span>
                        <a href={`mailto:${branch.email}`} className="text-blue-600 hover:underline">
                            {branch.email}
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
}
