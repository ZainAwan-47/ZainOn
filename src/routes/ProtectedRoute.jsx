// React
import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

// Hooks & Components
import { useAuth } from '../hooks/useAuth';
import SplashScreen from '../components/ui/SplashScreen';

export const ProtectedRoute = () => {
    const { user, loading } = useAuth();
    const location = useLocation();

    // 1. Wait for Firebase to determine auth state
    if (loading) {
        return <SplashScreen message="Restoring ZainOn session..." />;
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