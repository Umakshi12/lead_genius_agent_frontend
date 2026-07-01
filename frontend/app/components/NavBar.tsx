"use client";
import React, { useContext, useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { AuthContext } from '../context/AuthContext';

export default function NavBar() {
    const { token, logout } = useContext(AuthContext);
    const router = useRouter();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        logout();
        setIsDropdownOpen(false);
        router.push('/login');
    };

    const navigateTo = (path: string) => {
        router.push(path);
        setIsDropdownOpen(false);
    };

    return (
        <nav className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
                <div className="flex items-center">
                    <Link href="/" className="text-2xl font-bold" style={{ color: 'var(--color-primary)' }}>
                        Oceanic6<span className="text-sm font-normal text-gray-500">.ai</span>
                    </Link>
                </div>

                <div className="flex items-center gap-4">
                    <Link href="/dashboard" className="text-sm font-medium text-gray-700 hover:text-[var(--color-primary)] transition">
                        Dashboard
                    </Link>
                    <Link href="/leads" className="text-sm font-medium text-gray-700 hover:text-[var(--color-primary)] transition">
                        Leads
                    </Link>
                </div>

            </div>
        </nav>
    );
}
