// src/routes/ProtectedRoute.jsx
import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export const ProtectedRoute = () => {
    const authContext = useContext(AuthContext);

    if (!authContext || authContext.loading) {
        return (
            <div className="fixed inset-0 h-screen w-screen flex flex-col items-center justify-center bg-slate-950 text-slate-100 font-sans z-50 select-none">
                <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                    Authenticating...
                </p>
            </div>
        );
    }

    if (!authContext.isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;