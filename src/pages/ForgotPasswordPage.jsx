// React
import React from 'react';

// Third Party Libraries
import { Link } from 'react-router-dom';

// Components
import AuthCard from '../features/auth/components/AuthCard';
import AuthHeader from '../features/auth/components/AuthHeader';
import AuthInput from '../features/auth/components/AuthInput';
import AuthButton from '../features/auth/components/AuthButton';

export const ForgotPasswordPage = () => {
    return (
        <AuthCard>
            <AuthHeader
                title="Reset Password"
                subtitle="Enter your account email to receive a password reset link"
            />

            <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
                <AuthInput
                    id="email"
                    label="Email Address"
                    type="email"
                    placeholder="name@example.com"
                    autoComplete="email"
                    required
                />

                <div className="pt-2">
                    <AuthButton type="submit">Send Reset Link</AuthButton>
                </div>
            </form>

            <div className="text-center mt-6">
                <Link
                    to="/login"
                    className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 focus:outline-none transition-colors"
                >
                    <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M10 19l-7-7m0 0l7-7m-7 7h18"
                        />
                    </svg>
                    <span>Back to Sign In</span>
                </Link>
            </div>
        </AuthCard>
    );
};

export default ForgotPasswordPage;