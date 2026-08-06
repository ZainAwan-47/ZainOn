// React
import React, { useState } from 'react';
// Third Party Libraries
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
// Services
import { authService } from '../services/authService';
// Components
import AuthInput from '../components/ui/AuthInput';
import PasswordInput from '../components/ui/PasswordInput';
import PrimaryButton from '../components/ui/PrimaryButton';

// Validation Schema
const registerSchema = z
    .object({
        fullName: z
            .string()
            .min(1, 'Full name is required')
            .min(3, 'Full name must be at least 3 characters'),
        username: z
            .string()
            .min(1, 'Username is required')
            .min(3, 'Username must be at least 3 characters')
            .max(20, 'Username cannot exceed 20 characters')
            .regex(
                /^[a-zA-Z0-9_]+$/,
                'Username can only contain letters, numbers, and underscores'
            ),
        email: z
            .string()
            .min(1, 'Email address is required')
            .email('Please enter a valid email address'),
        password: z
            .string()
            .min(1, 'Password is required')
            .min(8, 'Password must be at least 8 characters')
            .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
            .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
            .regex(/[0-9]/, 'Password must contain at least one number'),
        confirmPassword: z
            .string()
            .min(1, 'Please confirm your password'),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: 'Passwords do not match',
        path: ['confirmPassword'],
    });

export const RegisterPage = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const [registrationError, setRegistrationError] = useState('');

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(registerSchema),
        mode: 'onSubmit',
        defaultValues: {
            fullName: '',
            username: '',
            email: '',
            password: '',
            confirmPassword: '',
        },
    });

    const onSubmit = async (data) => {
        setRegistrationError('');
        setIsLoading(true);
        try {
            await authService.register({
                fullName: data.fullName.trim(),
                username: data.username.trim(),
                email: data.email.trim(),
                password: data.password,
            });

            // Immediately navigate to the Email Verification Quarantine Page
            navigate('/verify-email', { replace: true });
        } catch (error) {
            setRegistrationError(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setRegistrationError('');
        setIsGoogleLoading(true);
        try {
            await authService.googleLogin();
            navigate('/');
        } catch (error) {
            setRegistrationError(error.message);
        } finally {
            setIsGoogleLoading(false);
        }
    };

    const isAnyLoading = isLoading || isGoogleLoading;

    return (
        <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 transition-colors">
            {/* Mobile-Only Header Banner */}
            <div className="lg:hidden flex flex-col items-center text-center mb-6">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 mb-3">
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
                <span className="text-xl font-bold tracking-tight text-white mb-2">
                    Zainon
                </span>
                <h1 className="text-2xl font-bold text-white tracking-tight">
                    Create Account
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                    Join Zainon to start real-time messaging
                </p>
            </div>

            {/* Registration Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5" noValidate>
                <AuthInput
                    id="fullName"
                    label="Full Name"
                    type="text"
                    placeholder="Alex Johnson"
                    autoComplete="name"
                    required
                    disabled={isAnyLoading}
                    error={errors.fullName?.message}
                    {...register('fullName')}
                />

                <AuthInput
                    id="username"
                    label="Username"
                    type="text"
                    placeholder="alexjohnson"
                    autoComplete="username"
                    required
                    disabled={isAnyLoading}
                    error={errors.username?.message}
                    {...register('username')}
                />

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

                <PasswordInput
                    id="password"
                    label="Password"
                    placeholder="••••••••"
                    autoComplete="new-password"
                    required
                    disabled={isAnyLoading}
                    error={errors.password?.message}
                    {...register('password')}
                />

                <PasswordInput
                    id="confirmPassword"
                    label="Confirm Password"
                    placeholder="••••••••"
                    autoComplete="new-password"
                    required
                    disabled={isAnyLoading}
                    error={errors.confirmPassword?.message}
                    {...register('confirmPassword')}
                />

                <div className="pt-2">
                    <PrimaryButton type="submit" disabled={isAnyLoading}>
                        {isLoading ? 'Creating Account...' : 'Create Account'}
                    </PrimaryButton>
                </div>
            </form>

            {/* Error Notification Banner */}
            {registrationError && (
                <div
                    role="alert"
                    className="mt-4 p-3 rounded-xl bg-rose-950/40 border border-rose-900/60 text-rose-300 text-xs flex items-center space-x-2"
                >
                    <svg
                        className="w-4 h-4 flex-shrink-0 text-rose-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 11-18 0z"
                        />
                    </svg>
                    <span>{registrationError}</span>
                </div>
            )}

            {/* Divider */}
            <div className="relative my-6 flex items-center justify-center">
                <div className="w-full border-t border-slate-800" />
                <span className="absolute bg-slate-900 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    OR
                </span>
            </div>

            {/* Google Sign In Button */}
            <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isAnyLoading}
                className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700/80 text-slate-200 font-medium border border-slate-700 rounded-xl transition-all duration-200 flex items-center justify-center space-x-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
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
                <span>{isGoogleLoading ? 'Signing In...' : 'Sign up with Google'}</span>
            </button>

            {/* Footer Link */}
            <p className="text-center text-xs text-slate-400 mt-6">
                Already have an account?{' '}
                <Link
                    to="/login"
                    className="font-semibold text-indigo-400 hover:underline focus:outline-none"
                >
                    Sign In
                </Link>
            </p>
        </div>
    );
};

export default RegisterPage;