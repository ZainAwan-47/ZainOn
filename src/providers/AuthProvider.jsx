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

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                // Allow session if email is verified OR user authenticated via Google OAuth
                const isGoogleUser = firebaseUser.providerData.some(
                    (provider) => provider.providerId === 'google.com'
                );

                if (firebaseUser.emailVerified || isGoogleUser) {
                    try {
                        const profile = await authService.getUserProfile(firebaseUser.uid);
                        setUser({
                            uid: firebaseUser.uid,
                            email: firebaseUser.email,
                            emailVerified: firebaseUser.emailVerified,
                            displayName: firebaseUser.displayName,
                            photoURL: firebaseUser.photoURL,
                            ...profile,
                        });
                    } catch (error) {
                        console.error('[AuthProvider] Failed to fetch user profile:', error);
                        setUser(null);
                    }
                } else {
                    setUser(null);
                }
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

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
        setUser(null);
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

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;