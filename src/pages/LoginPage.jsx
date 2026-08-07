// React
import React, { useState, useEffect } from 'react';

// Third Party Libraries
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';

// Services & Hooks
import { authService } from '../services/authService';
import { useAuth } from '../hooks/useAuth';

// Components
import AuthInput from '../components/ui/AuthInput';
import PasswordInput from '../components/ui/PasswordInput';
import PrimaryButton from '../components/ui/PrimaryButton';

// Validation Schema
const loginSchema = z.object({
    email: z
        .string()
        .min(1, 'Email address is required')
        .email('Please enter a valid email address'),
    password: z
        .string()
        .min(1, 'Password is required')
        .min(8, 'Password must be at least 8 characters'),
    rememberMe: z.boolean().default(true),
});

export const LoginPage = () => {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();

    const [isLoading, setIsLoading] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const [authError, setAuthError] = useState('');

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(loginSchema),
        mode: 'onSubmit',
        defaultValues: {
            email: '',
            password: '',
            rememberMe: true,
        },
    });

    // Redirect instantly as soon as AuthContext confirms authentication state
    useEffect(() => {
        if (isAuthenticated) {
            navigate('/', { replace: true });
        }
    }, [isAuthenticated, navigate]);

    const onSubmit = async (data) => {
        setAuthError('');
        setIsLoading(true);

        try {
            await authService.login(data.email.trim(), data.password, data.rememberMe);
        } catch (error) {
            if (isAuthenticated) {
                return;
            }
            setAuthError(error.message || 'Failed to complete authentication request. Please try again.');
            setIsLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setAuthError('');
        setIsGoogleLoading(true);

        try {
            await authService.googleLogin();
        } catch (error) {
            if (isAuthenticated) {
                return;
            }
            setAuthError(error.message || 'Failed to complete Google sign-in. Please try again.');
            setIsGoogleLoading(false);
        }
    };

    const isAnyLoading = isLoading || isGoogleLoading;

    return (
        <div className="w-full max-w-md bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-3xl shadow-2xl p-6 sm:p-8 transition-all duration-300">
            {/* Mobile-Only Header Banner */}
            <div className="lg:hidden flex flex-col items-center text-center mb-6">
                <div className="h-12 w-12 rounded-2xl bg-[var(--color-primary)] flex items-center justify-center shadow-lg shadow-[var(--color-primary)]/20 mb-3">
                    <svg
                        className="w-7 h-7 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2.5"
                            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        />
                    </svg>
                </div>
                <span className="text-xl font-bold tracking-tight text-[var(--text-primary)] mb-2">
                    ZainOn
                </span>
                <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">
                    Welcome Back
                </h1>
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                    Enter your credentials to access your account
                </p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
                <AuthInput
                    id="email"
                    label="Email Address"
                    type="email"
                    placeholder="name@example.com"
                    autoComplete="email"
                    required
                    disabled={isAnyLoading}
                    error={errors.email?.message}
                    {...register('email')}
                />

                <div className="space-y-1.5">
                    <PasswordInput
                        id="password"
                        label="Password"
                        placeholder="••••••••"
                        autoComplete="current-password"
                        required
                        disabled={isAnyLoading}
                        error={errors.password?.message}
                        {...register('password')}
                    />
                    <div className="flex items-center justify-between pt-1">
                        <label
                            htmlFor="rememberMe"
                            className="flex items-center space-x-2 cursor-pointer select-none"
                        >
                            <input
                                id="rememberMe"
                                type="checkbox"
                                disabled={isAnyLoading}
                                className="w-4 h-4 rounded border-[var(--border-color)] text-[var(--color-primary)] focus:ring-[var(--color-primary)] bg-[var(--bg-main)] transition-colors cursor-pointer"
                                {...register('rememberMe')}
                            />
                            <span className="text-xs font-medium text-[var(--text-secondary)]">
                                Remember me
                            </span>
                        </label>
                        <Link
                            to="/forgot-password"
                            className="text-xs font-medium text-[var(--color-primary)] hover:underline focus:outline-none"
                        >
                            Forgot Password?
                        </Link>
                    </div>
                </div>

                <div className="pt-2">
                    <PrimaryButton type="submit" disabled={isAnyLoading}>
                        {isLoading ? 'Signing In...' : 'Sign In'}
                    </PrimaryButton>
                </div>
            </form>

            {/* Error Banner */}
            {authError && (
                <div
                    role="alert"
                    className="mt-4 p-3.5 rounded-xl bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/30 text-[var(--color-danger)] text-xs flex items-center space-x-2"
                >
                    <svg
                        className="w-4 h-4 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                    <span>{authError}</span>
                </div>
            )}

            {/* Divider */}
            <div className="relative my-6 flex items-center justify-center">
                <div className="w-full border-t border-[var(--border-color)]" />
                <span className="absolute bg-[var(--bg-surface)] px-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                    OR
                </span>
            </div>

            {/* Google OAuth Button */}
            <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isAnyLoading}
                className="w-full py-3 px-4 bg-[var(--bg-surface-hover)] hover:opacity-90 text-[var(--text-primary)] font-medium border border-[var(--border-color)] rounded-xl transition-all duration-200 flex items-center justify-center space-x-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                </svg>
                <span>{isGoogleLoading ? 'Signing In...' : 'Continue with Google'}</span>
            </button>

            {/* Footer Link */}
            <p className="text-center text-xs text-[var(--text-secondary)] mt-6">
                Don&apos;t have an account?{' '}
                <Link
                    to="/register"
                    className="font-semibold text-[var(--color-primary)] hover:underline focus:outline-none"
                >
                    Create Account
                </Link>
            </p>
        </div>
    );
};

export default LoginPage;