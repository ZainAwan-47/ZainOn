// React
import React from 'react';

// Third Party Libraries
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';

// Components
import AuthCard from '../features/auth/components/AuthCard';
import AuthHeader from '../features/auth/components/AuthHeader';
import AuthInput from '../features/auth/components/AuthInput';
import PasswordInput from '../features/auth/components/PasswordInput';
import AuthButton from '../features/auth/components/AuthButton';
import SocialAuthButton from '../features/auth/components/SocialAuthButton';
import AuthDivider from '../features/auth/components/AuthDivider';

// Schemas
import { registerSchema } from '../features/auth/schemas/authSchemas';

export const RegisterPage = () => {
    const {
        register,
        handleSubmit,
        formState: { errors, isValid },
    } = useForm({
        resolver: zodResolver(registerSchema),
        mode: 'onChange',
    });

    const onSubmit = () => {
        // UI Validation Passed - Authentication logic deferred to Phase 3
    };

    return (
        <AuthCard>
            <AuthHeader
                title="Create Account"
                subtitle="Join ZainOn to start real-time messaging"
            />

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5" noValidate>
                <AuthInput
                    id="fullName"
                    label="Full Name"
                    type="text"
                    placeholder="Alex Johnson"
                    autoComplete="name"
                    required
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
                    error={errors.email?.message}
                    {...register('email')}
                />

                <PasswordInput
                    id="password"
                    label="Password"
                    placeholder="••••••••"
                    autoComplete="new-password"
                    required
                    error={errors.password?.message}
                    {...register('password')}
                />

                <PasswordInput
                    id="confirmPassword"
                    label="Confirm Password"
                    placeholder="••••••••"
                    autoComplete="new-password"
                    required
                    error={errors.confirmPassword?.message}
                    {...register('confirmPassword')}
                />

                <div className="pt-2">
                    <AuthButton type="submit" disabled={!isValid}>
                        Create Account
                    </AuthButton>
                </div>
            </form>

            <AuthDivider />

            <SocialAuthButton label="Sign up with Google" />

            <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-6">
                Already have an account?{' '}
                <Link
                    to="/login"
                    className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline focus:outline-none"
                >
                    Sign In
                </Link>
            </p>
        </AuthCard>
    );
};

export default RegisterPage;