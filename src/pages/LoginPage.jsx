// React
import React from 'react';

// Third Party Libraries
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';

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
    rememberMe: z.boolean().default(false),
});

export const LoginPage = () => {
    const {
        register,
        handleSubmit,
        formState: { errors, isValid },
    } = useForm({
        resolver: zodResolver(loginSchema),
        mode: 'onChange',
        defaultValues: {
            email: '',
            password: '',
            rememberMe: false,
        },
    });

    const onSubmit = () => {
        // UI Validation Passed - Backend auth execution deferred to Firebase Sprint
    };

    return (
        <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none p-6 sm:p-8 transition-colors">
            {/* Brand Header */}
            <div className="flex flex-col items-center text-center mb-6 sm:mb-8">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 mb-3">
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
                            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        />
                    </svg>
                </div>
                <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white mb-4">
                    ZainOn
                </span>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                    Welcome Back
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-sm">
                    Enter your credentials to access your account
                </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
                <AuthInput
                    id="email"
                    label="Email Address"
                    type="email"
                    placeholder="name@example.com"
                    autoComplete="email"
                    required
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
                        error={errors.password?.message}
                        {...register('password')}
                    />
                    <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center space-x-2 cursor-pointer">
                            <input
                                id="rememberMe"
                                type="checkbox"
                                className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-400 dark:bg-slate-800 transition-colors cursor-pointer"
                                {...register('rememberMe')}
                            />
                            <label
                                htmlFor="rememberMe"
                                className="text-xs font-medium text-slate-600 dark:text-slate-300 select-none cursor-pointer"
                            >
                                Remember me
                            </label>
                        </div>
                        <Link
                            to="/forgot-password"
                            className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline focus:outline-none focus:underline"
                        >
                            Forgot Password?
                        </Link>
                    </div>
                </div>

                <div className="pt-2">
                    <PrimaryButton type="submit" disabled={!isValid}>
                        Sign In
                    </PrimaryButton>
                </div>
            </form>

            {/* Divider */}
            <div className="relative my-6 flex items-center justify-center">
                <div className="w-full border-t border-slate-200 dark:border-slate-800" />
                <span className="absolute bg-white dark:bg-slate-900 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    OR
                </span>
            </div>

            {/* Social Button (UI Only) */}
            <button
                type="button"
                className="w-full py-3 px-4 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 font-medium border border-slate-200 dark:border-slate-700 rounded-xl transition-all duration-200 flex items-center justify-center space-x-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-600"
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
                <span>Continue with Google</span>
            </button>

            {/* Footer Link */}
            <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-6">
                Don&apos;t have an account?{' '}
                <Link
                    to="/register"
                    className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline focus:outline-none"
                >
                    Create Account
                </Link>
            </p>
        </div>
    );
};

export default LoginPage;