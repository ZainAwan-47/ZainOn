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

    // Auto-redirect already authenticated users to workspace chat
    useEffect(() => {
        if (!loading && isAuthenticated) {
            navigate('/chat', { replace: true });
        }
    }, [isAuthenticated, loading, navigate]);

    const isRightSide = path === '/register' || path === '/forgot-password';

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
        <div className="fixed inset-0 h-screen w-screen overflow-hidden theme-navy bg-[var(--bg-main)] relative select-none transition-colors duration-300">
            <div
                className={`hidden lg:block absolute top-0 bottom-0 w-1/2 h-full z-25 transition-transform duration-900 ease-[cubic-bezier(0.25,1,0.5,1)] ${isRightSide ? 'left-0 translate-x-full' : 'left-0 translate-x-0'
                    }`}
            >
                {Object.entries(heroStates).map(([key, content]) => {
                    const isActive = activeKey === key;
                    return (
                        <div
                            key={key}
                            className={`absolute inset-0 flex flex-col items-center justify-center p-8 text-center transition-opacity duration-900 ease-in-out ${content.gradientClass
                                } ${isActive
                                    ? 'opacity-100 pointer-events-auto'
                                    : 'opacity-0 pointer-events-none'
                                }`}
                        >
                            <div className="flex flex-col items-center justify-center max-w-sm px-4">
                                <div className="h-11 w-11 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-lg mb-2">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                </div>
                                <span className="text-xl font-bold tracking-tight text-white mb-3">ZainOn</span>
                                <h1 className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight">{content.title}</h1>
                                <p className="text-sm lg:text-base text-white/90 font-medium leading-snug mt-1.5">{content.subtitle}</p>
                            </div>
                            <div className="absolute bottom-6 text-[11px] text-white/80 font-medium">
                                &copy; {new Date().getFullYear()} ZainOn Realtime Messaging Platform
                            </div>
                        </div>
                    );
                })}
            </div>

            <div
                className={`w-full lg:w-1/2 h-full absolute top-0 bottom-0 z-10 transition-all duration-900 ease-[cubic-bezier(0.25,1,0.5,1)] flex items-center justify-center p-4 sm:p-8 overflow-y-auto bg-[var(--bg-main)] ${isRightSide ? 'left-0 lg:left-0' : 'left-0 lg:left-1/2'
                    }`}
            >
                <div
                    key={location.pathname}
                    className="w-full max-w-md flex justify-center"
                    style={{ animation: 'authSmoothMorph 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
                >
                    <Outlet />
                </div>
            </div>

            <style>{`
                @keyframes authSmoothMorph {
                    0% { opacity: 0; transform: translateY(20px) scale(0.96); }
                    100% { opacity: 1; transform: translateY(0) scale(1); }
                }
            `}</style>
        </div>
    );
};

export default AuthLayout;