// React & Third Party
import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { sendEmailVerification } from 'firebase/auth';

// Firebase, Context & Hooks
import { auth } from '../firebase/auth';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../context/ToastContext';

export const VerifyEmailPage = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const { showToast } = useToast();

    const [checking, setChecking] = useState(false);
    const [resending, setResending] = useState(false);
    const [resendDisabled, setResendDisabled] = useState(false);

    // Auto-redirect verified users away from the quarantine page
    if (user?.emailVerified) {
        return <Navigate to="/chat" replace />;
    }

    const handleCheckVerification = async () => {
        if (!auth.currentUser) return;

        try {
            setChecking(true);
            await auth.currentUser.reload();

            if (auth.currentUser.emailVerified) {
                showToast('Email verified successfully! Welcome to ZainOn.', 'info');
                window.location.assign('/chat');
            } else {
                showToast('Your email is not verified yet. Please check your inbox or spam folder.', 'error');
            }
        } catch (error) {
            console.error('[VerifyEmailPage.handleCheckVerification]:', error);
            showToast('Failed to verify status. Please try again.', 'error');
        } finally {
            setChecking(false);
        }
    };

    const handleResendEmail = async () => {
        if (!auth.currentUser) return;

        try {
            setResending(true);
            await sendEmailVerification(auth.currentUser);
            showToast('Verification email resent! Please check your inbox.', 'info');
            setResendDisabled(true);

            setTimeout(() => setResendDisabled(false), 60000);
        } catch (error) {
            console.error('[VerifyEmailPage.handleResendEmail]:', error);
            const message =
                error.code === 'auth/too-many-requests'
                    ? 'Too many requests. Please wait a minute before resending.'
                    : 'Failed to resend verification email.';
            showToast(message, 'error');
        } finally {
            setResending(false);
        }
    };

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login', { replace: true });
        } catch (error) {
            console.error('[VerifyEmailPage.handleLogout]:', error);
            showToast('Failed to sign out.', 'error');
        }
    };

    return (
        <div className="min-h-screen w-screen theme-navy bg-[var(--bg-main)] text-[var(--text-primary)] flex flex-col items-center justify-center p-4 select-none transition-colors duration-300">
            <div className="w-full max-w-md bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-3xl p-8 shadow-2xl text-center space-y-6">
                {/* Mail Icon */}
                <div className="w-16 h-16 bg-[var(--color-primary)]/10 text-[var(--color-primary)] rounded-2xl flex items-center justify-center mx-auto ring-1 ring-[var(--color-primary)]/20">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                </div>

                {/* Content Details */}
                <div className="space-y-2">
                    <h1 className="text-xl font-bold tracking-tight">Verify Your Email Address</h1>
                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                        We have dispatched a verification link to{' '}
                        <span className="text-[var(--color-primary)] font-semibold">{user?.email}</span>. Please verify your email address to access your workspace.
                    </p>
                </div>

                {/* Action Controls */}
                <div className="flex flex-col space-y-3 pt-2">
                    <button
                        type="button"
                        onClick={handleCheckVerification}
                        disabled={checking}
                        className="w-full py-3 px-4 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] disabled:opacity-50 text-white rounded-xl font-bold text-xs transition-all shadow-md active:scale-95 cursor-pointer flex items-center justify-center space-x-2"
                    >
                        {checking && (
                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" />
                        )}
                        <span>{checking ? 'Checking Status...' : "I've Verified My Email"}</span>
                    </button>

                    <button
                        type="button"
                        onClick={handleResendEmail}
                        disabled={resending || resendDisabled}
                        className="w-full py-3 px-4 bg-[var(--bg-surface-hover)] disabled:opacity-50 text-[var(--text-primary)] border border-[var(--border-color)] rounded-xl font-bold text-xs transition-all active:scale-95 cursor-pointer"
                    >
                        {resending ? 'Sending...' : resendDisabled ? 'Resend Cooldown Active' : 'Resend Verification Email'}
                    </button>
                </div>

                {/* Footer Logout */}
                <div className="pt-4 border-t border-[var(--border-color)]">
                    <button
                        type="button"
                        onClick={handleLogout}
                        className="text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                    >
                        Sign out and use a different account
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VerifyEmailPage;