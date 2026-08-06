// React
import React from 'react';

// Third Party Libraries
import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts
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
            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />

            {/* Protected Routes encapsulated within Main App Layout Shell */}
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