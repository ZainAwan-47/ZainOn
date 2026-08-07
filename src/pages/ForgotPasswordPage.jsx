// React
import React, { useState } from 'react';

// Third Party Libraries
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';

// Services
import { authService } from '../services/authService';

// Components
import AuthInput from '../components/ui/AuthInput';
import PrimaryButton from '../components/ui/PrimaryButton';

// Validation Schema
const forgotPasswordSchema = z.object({
    email: z
        .string()
        .min(1, 'Email address is required')
        .email('Please enter a valid email address'),
});

export const ForgotPasswordPage = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [resetError, setResetError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(forgotPasswordSchema),
        mode: 'onSubmit',
        defaultValues: {
            email: '',
        },
    });

    const onSubmit = async (data) => {
        setResetError('');
        setSuccessMessage('');
        setIsLoading(true);

        try {
            await authService.resetPassword(data.email.trim());
            setSuccessMessage('Password reset email sent successfully. Please check your inbox.');
            reset();
        } catch (error) {
            setResetError(error.message);
        } finally {
            setIsLoading(false);
        }
    };

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
                    Forgot Password
                </h1>
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                    Enter your email address to receive a password reset link
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
                    disabled={isLoading}
                    error={errors.email?.message}
                    {...register('email')}
                />

                <div className="pt-2">
                    <PrimaryButton type="submit" disabled={isLoading}>
                        {isLoading ? 'Sending Reset Link...' : 'Send Reset Link'}
                    </PrimaryButton>
                </div>
            </form>

            {/* Success Banner */}
            {successMessage && (
                <div
                    role="status"
                    className="mt-4 p-3 rounded-xl bg-[var(--color-success)]/10 border border-[var(--color-success)]/30 text-[var(--color-success)] text-xs flex items-center space-x-2"
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
                            d="M5 13l4 4L19 7"
                        />
                    </svg>
                    <span>{successMessage}</span>
                </div>
            )}

            {/* Error Banner */}
            {resetError && (
                <div
                    role="alert"
                    className="mt-4 p-3 rounded-xl bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/30 text-[var(--color-danger)] text-xs flex items-center space-x-2"
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
                    <span>{resetError}</span>
                </div>
            )}

            {/* Footer Back Link */}
            <div className="text-center mt-6">
                <Link
                    to="/login"
                    className="inline-flex items-center space-x-2 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--color-primary)] focus:outline-none transition-colors"
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
                    <span>Back to Login</span>
                </Link>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;