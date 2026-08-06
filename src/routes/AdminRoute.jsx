// React
import React, { useContext } from 'react';

// Third Party Libraries
import { Navigate, Outlet } from 'react-router-dom';

// Context
import { AuthContext } from '../context/AuthContext';

export const AdminRoute = () => {
    const authContext = useContext(AuthContext);

    if (!authContext || authContext.loading) {
        return (
            <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-slate-950 transition-colors">
                <div className="flex flex-col items-center space-y-3">
                    <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Verifying Privileges...
                    </p>
                </div>
            </div>
        );
    }

    if (!authContext.isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (authContext.user?.role !== 'admin') {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
};

export default AdminRoute;