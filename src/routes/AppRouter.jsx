// React
import React from 'react';

// Third Party Libraries
import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import AuthLayout from '../layouts/AuthLayout';
import MainAppLayout from '../layouts/MainAppLayout';

// Routes
import ProtectedRoute from './ProtectedRoute';

// Pages
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import ForgotPasswordPage from '../pages/ForgotPasswordPage';
import HomePage from '../pages/HomePage';
import ChatPage from '../pages/ChatPage';

export const AppRouter = () => {
    return (
        <Routes>
            {/* Public Auth Routes inside 50/50 Split AuthLayout */}
            <Route element={<AuthLayout />}>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            </Route>

            {/* Protected App Routes inside Main Workspace Layout */}
            <Route element={<ProtectedRoute />}>
                <Route element={<MainAppLayout />}>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/chat" element={<ChatPage />} />
                    <Route path="/profile" element={<ChatPage />} />
                    <Route path="/settings" element={<ChatPage />} />
                </Route>
            </Route>

            {/* Fallback Redirection */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
};

export default AppRouter;