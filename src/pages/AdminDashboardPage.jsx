// React
import React from 'react';

export const AdminDashboardPage = () => {
    return (
        <div className="flex-1 flex flex-col items-center justify-center h-full bg-[var(--bg-main)] text-[var(--text-primary)] p-6 transition-colors duration-300">
            <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="text-xs text-[var(--text-secondary)] mt-1">Welcome to the ZainOn admin control center.</p>
        </div>
    );
};

export default AdminDashboardPage;