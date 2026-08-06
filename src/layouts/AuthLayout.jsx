// React
import React, { useEffect } from 'react';

// Third Party Libraries
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

// Hooks
import { useAuth } from '../hooks/useAuth';

export const AuthLayout = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { isAuthenticated, loading } = useAuth();
    const path = location.pathname;

    // Auto-redirect already authenticated users to home workspace
    useEffect(() => {
        if (!loading && isAuthenticated) {
            navigate('/', { replace: true });
        }
    }, [isAuthenticated, loading, navigate]);

    // Panel sits on the RIGHT for Register & Forgot Password, LEFT for Login
    const isRightSide = path === '/register' || path === '/forgot-password';

    // Hero screen definitions
    const heroStates = {
        login: {
            gradientClass: 'animate-gradient-login',
            title: 'Welcome Back',
            subtitle: 'Enter your credentials to access your account',
        },
        register: {
            gradientClass: 'animate-gradient-register',
            title: 'Create Account',
            subtitle: 'Join ZainOn to start real-time messaging',
        },
        forgot: {
            gradientClass: 'animate-gradient-forgot',
            title: 'Reset Password',
            subtitle: "Don't worry, we'll help you recover your account",
        },
    };

    const activeKey =
        path === '/register'
            ? 'register'
            : path === '/forgot-password'
                ? 'forgot'
                : 'login';

    return (
        <div className="fixed inset-0 h-screen w-screen overflow-hidden bg-slate-950 relative select-none">
            {/* Desktop 50% Sliding Hero Gradient Panel */}
            <div
                className={`hidden lg:block absolute top-0 bottom-0 w-1/2 h-full z-20 transition-transform duration-700 ease-in-out ${isRightSide ? 'left-0 translate-x-full' : 'left-0 translate-x-0'
                    }`}
            >
                {/* Layered Cross-Fading Backgrounds & Text */}
                {Object.entries(heroStates).map(([key, content]) => {
                    const isActive = activeKey === key;
                    return (
                        <div
                            key={key}
                            className={`absolute inset-0 flex flex-col items-center justify-center p-8 text-center transition-opacity duration-700 ease-in-out ${content.gradientClass
                                } ${isActive
                                    ? 'opacity-100 pointer-events-auto'
                                    : 'opacity-0 pointer-events-none'
                                }`}
                        >
                            {/* Hero Content Block */}
                            <div className="flex flex-col items-center justify-center max-w-sm px-4">
                                <div className="h-11 w-11 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-lg mb-2">
                                    <svg
                                        className="w-6 h-6 text-white"
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

                                <span className="text-xl font-bold tracking-tight text-white mb-3">
                                    ZainOn
                                </span>

                                <h1 className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight">
                                    {content.title}
                                </h1>

                                <p className="text-sm lg:text-base text-slate-200/90 font-medium leading-snug mt-1.5">
                                    {content.subtitle}
                                </p>
                            </div>

                            <div className="absolute bottom-6 text-[11px] text-slate-300/80 font-medium">
                                &copy; {new Date().getFullYear()} ZainOn Realtime Messaging Platform
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Form Canvas Container */}
            <div
                className={`w-full lg:w-1/2 h-full absolute top-0 bottom-0 z-10 transition-all duration-700 ease-in-out flex items-center justify-center p-4 sm:p-8 overflow-y-auto bg-slate-950 ${isRightSide ? 'left-0 lg:left-0' : 'left-0 lg:left-1/2'
                    }`}
            >
                <div
                    key={location.pathname}
                    className="w-full flex justify-center animate-auth-card"
                >
                    <Outlet />
                </div>
            </div>
        </div>
    );
};

export default AuthLayout;