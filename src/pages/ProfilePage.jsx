// React
import React from 'react';

// Hooks
import { useAuth } from '../hooks/useAuth';

export const ProfilePage = () => {
    const { user } = useAuth();

    return (
        <div className="flex-1 flex flex-col h-full bg-[var(--bg-main)] text-[var(--text-primary)] transition-colors duration-300 overflow-y-auto p-4 sm:p-8">
            <div className="max-w-3xl w-full mx-auto space-y-6">
                <header>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Profile</h1>
                    <p className="text-[var(--text-secondary)] text-sm mt-1">
                        View and manage your account details.
                    </p>
                </header>

                <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-3xl p-6 shadow-sm flex items-center space-x-4 transition-colors duration-300">
                    <img
                        src={user?.photoURL || 'https://via.placeholder.com/150'}
                        alt={user?.fullName || 'User'}
                        className="w-16 h-16 rounded-full object-cover border border-[var(--border-color)]"
                    />
                    <div>
                        <h2 className="text-lg font-bold">{user?.fullName || user?.displayName || 'Zainon User'}</h2>
                        <p className="text-xs text-[var(--text-secondary)]">@{user?.username || 'user'}</p>
                        <p className="text-xs text-[var(--text-secondary)] mt-1">{user?.email}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;