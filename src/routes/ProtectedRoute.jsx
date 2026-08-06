import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export const ProtectedRoute = () => {
    const { user, loading } = useAuth();
    const location = useLocation();

    // 1. Wait for Firebase to determine auth state
    if (loading) {
        return (
            <div className="min-h-screen w-screen bg-slate-950 flex items-center justify-center">
                <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    // 2. Unauthenticated -> Kick to Login
    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // 3. Authenticated but Email NOT Verified -> Quarantine to Verify Page
    if (user.emailVerified === false) {
        return <Navigate to="/verify-email" replace />;
    }

    // 4. Fully Authenticated & Verified -> Grant Access to MainAppLayout
    return <Outlet />;
};

export default ProtectedRoute;