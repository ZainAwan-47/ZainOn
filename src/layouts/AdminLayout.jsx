// React
import React from 'react';

// Third Party Libraries
import { Outlet } from 'react-router-dom';

export const AdminLayout = () => {
    return (
        <div className="min-h-screen w-full bg-[var(--bg-main)] text-[var(--text-primary)] transition-colors duration-300">
            <Outlet />
        </div>
    );
};

export default AdminLayout;