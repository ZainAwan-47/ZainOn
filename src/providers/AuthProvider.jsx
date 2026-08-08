// React
import React, { useState, useEffect, useMemo, useCallback } from 'react';

// Third Party Libraries
import { onAuthStateChanged } from 'firebase/auth';

// Firebase
import { auth } from '../firebase/auth';

// Services
import { authService } from '../services/authService';

// Context
import { AuthContext } from '../context/AuthContext';

// Components
import SplashScreen from '../components/ui/SplashScreen';

export const AuthProvider = ({ children }) => {
    const [{ user, loading }, setAuthData] = useState({ user: null, loading: true });

    useEffect(() => {
        let isMounted = true;

        // Hard failsafe timer: guarantee splash screen never freezes longer than 2.5 seconds
        const safetyTimeout = setTimeout(() => {
            if (isMounted) {
                console.warn('[AuthProvider] Safety timeout triggered: forcing load completion.');
                setAuthData((prev) => (prev.loading ? { user: null, loading: false } : prev));
            }
        }, 2500);

        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (!isMounted) return;

            if (firebaseUser) {
                const isGoogleUser = firebaseUser.providerData.some(
                    (provider) => provider.providerId === 'google.com'
                );

                if (firebaseUser.emailVerified || isGoogleUser) {
                    let profile = null;
                    try {
                        // Attempt profile fetch with a quick 1.5s race timeout
                        const profilePromise = authService.getUserProfile(firebaseUser.uid);
                        const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve(null), 1500));
                        profile = await Promise.race([profilePromise, timeoutPromise]);
                    } catch (err) {
                        console.warn('[AuthProvider] Profile fetch error, using base user:', err);
                    }

                    if (isMounted) {
                        setAuthData({
                            user: {
                                uid: firebaseUser.uid,
                                email: firebaseUser.email,
                                emailVerified: firebaseUser.emailVerified,
                                displayName: firebaseUser.displayName,
                                photoURL: firebaseUser.photoURL,
                                ...(profile || {}),
                            },
                            loading: false,
                        });
                    }
                } else {
                    if (isMounted) {
                        setAuthData({ user: null, loading: false });
                    }
                }
            } else {
                if (isMounted) {
                    setAuthData({ user: null, loading: false });
                }
            }
            clearTimeout(safetyTimeout);
        });

        return () => {
            isMounted = false;
            clearTimeout(safetyTimeout);
            unsubscribe();
        };
    }, []);

    // Clean up native sibling splash once React state resolves
    useEffect(() => {
        if (!loading) {
            const nativeSplash = document.getElementById('native-splash');
            if (nativeSplash) {
                nativeSplash.style.opacity = '0';
                setTimeout(() => nativeSplash.remove(), 300);
            }
        }
    }, [loading]);

    const login = useCallback(async (email, password) => {
        return await authService.login(email, password);
    }, []);

    const register = useCallback(async (userData) => {
        return await authService.register(userData);
    }, []);

    const loginWithGoogle = useCallback(async () => {
        return await authService.googleLogin();
    }, []);

    const resetPassword = useCallback(async (email) => {
        return await authService.resetPassword(email);
    }, []);

    const logout = useCallback(async () => {
        await authService.logout();
        setAuthData({ user: null, loading: false });
    }, []);

    const value = useMemo(
        () => ({
            user,
            loading,
            isAuthenticated: Boolean(user),
            login,
            register,
            loginWithGoogle,
            resetPassword,
            logout,
        }),
        [user, loading, login, register, loginWithGoogle, resetPassword, logout]
    );

    if (loading) {
        return <SplashScreen message="Restoring ZainOn session..." />;
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;