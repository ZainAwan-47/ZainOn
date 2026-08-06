// React
import React, { createContext, useState, useEffect } from 'react';

// Firebase
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../firebase/auth';

// Services
import { authService } from '../services/authService';

// 1. Explicit Named Export for AuthContext
export const AuthContext = createContext(null);

// 2. Explicit Named Export for AuthProvider
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                try {
                    // Fetch extended user profile data from Firestore
                    const profile = await authService.getUserProfile(firebaseUser.uid);
                    setUser({
                        uid: firebaseUser.uid,
                        email: firebaseUser.email,
                        displayName: firebaseUser.displayName || profile?.fullName || 'User',
                        fullName: profile?.fullName || firebaseUser.displayName || 'User',
                        username: profile?.username || firebaseUser.email?.split('@')[0] || 'user',
                        photoURL: firebaseUser.photoURL || profile?.photoURL || '',
                        bio: profile?.bio || '',
                        status: profile?.status || "Hey there! I'm using ZainOn.",
                        isOnline: profile?.isOnline ?? true,
                        role: profile?.role || 'user',
                        emailVerified: firebaseUser.emailVerified,
                    });
                } catch (error) {
                    console.error('[AuthContext]: Error fetching profile during auth state change', error);
                    setUser({
                        uid: firebaseUser.uid,
                        email: firebaseUser.email,
                        displayName: firebaseUser.displayName || 'User',
                        fullName: firebaseUser.displayName || 'User',
                        username: firebaseUser.email?.split('@')[0] || 'user',
                        photoURL: firebaseUser.photoURL || '',
                        emailVerified: firebaseUser.emailVerified,
                    });
                }
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // --- FIX: Bulletproof Logout Logic ---
    const logout = async () => {
        try {
            // Attempt standard service logout (handles presence updates, etc.)
            if (authService && typeof authService.logout === 'function') {
                await authService.logout();
            } else {
                await signOut(auth);
            }
        } catch (error) {
            console.warn('[AuthContext] Service logout threw an error, forcing native Firebase signOut:', error);
            await signOut(auth); // Force absolute native signout if the service fails
        } finally {
            // GUARANTEE the context is wiped instantly
            setUser(null);
        }
    };

    const value = {
        user,
        loading,
        isAuthenticated: Boolean(user),
        logout,
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

// 3. Default Export for Fallback Compatibility
export default AuthProvider;