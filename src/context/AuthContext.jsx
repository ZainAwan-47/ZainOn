// React
import React, { createContext, useState, useEffect } from 'react';

// Firebase
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth } from '../firebase/auth';
import { db } from '../firebase/firestore';

// Services
import { authService } from '../services/authService';

// Components
import SplashScreen from '../components/ui/SplashScreen';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    // Optimistically initialize user from auth.currentUser if already cached in memory to prevent null flickers
    const [user, setUser] = useState(() =>
        auth.currentUser ? { uid: auth.currentUser.uid, email: auth.currentUser.email } : null
    );
    const [loading, setLoading] = useState(true);
    const [isAuthenticating, setIsAuthenticating] = useState(false);

    useEffect(() => {
        let isMounted = true;
        let safetyTimer;

        // ROOT CAUSE FIX: Removed the stale closure reference to `loading`.
        // The timeout is now strictly controlled by clearing it on success.
        safetyTimer = setTimeout(() => {
            if (isMounted) {
                console.warn('[AuthContext] Safety timeout triggered. Network may be slow.');
                setLoading(false);
            }
        }, 6000);

        const initializeAuth = async () => {
            try {
                // Wait for Firebase auth state persistence to fully load from storage on refresh
                await auth.authStateReady();
            } catch (err) {
                console.warn('[AuthContext] authStateReady warning:', err);
            }

            if (!isMounted) return;

            onAuthStateChanged(auth, async (firebaseUser) => {
                if (!isMounted) return;

                if (firebaseUser) {
                    try {
                        const userDocRef = doc(db, 'users', firebaseUser.uid);
                        const userDocSnap = await getDoc(userDocRef);
                        const liveData = userDocSnap.exists() ? userDocSnap.data() : {};

                        if (!isMounted) return;

                        setUser({
                            uid: firebaseUser.uid,
                            email: firebaseUser.email,
                            displayName: firebaseUser.displayName || liveData.fullName || 'User',
                            fullName: liveData.fullName || firebaseUser.displayName || 'User',
                            username: liveData.username || firebaseUser.email?.split('@')[0] || 'user',
                            photoURL: liveData.photoURL || firebaseUser.photoURL || '',
                            bio: liveData.bio || '',
                            status: liveData.status || "Hey there! I'm using ZainOn.",
                            isOnline: liveData.isOnline ?? true,
                            role: liveData.role || 'user',
                            emailVerified: firebaseUser.emailVerified,
                            privacy: {
                                lastSeen: liveData.privacy?.lastSeen || 'everyone',
                                onlineStatus: liveData.privacy?.onlineStatus ?? true,
                                readReceipts: liveData.privacy?.readReceipts ?? true,
                                profileVisibility: liveData.privacy?.profileVisibility || 'everyone',
                                friendRequests: liveData.privacy?.friendRequests || 'everyone',
                            },
                            chatPrefs: {
                                enterToSend: liveData.chatPrefs?.enterToSend ?? true,
                                autoScroll: liveData.chatPrefs?.autoScroll ?? true,
                                chatFontSize: liveData.chatPrefs?.chatFontSize || 'medium',
                                messagePreview: liveData.chatPrefs?.messagePreview ?? true,
                            },
                        });
                    } catch (error) {
                        console.error('[AuthContext] Error fetching user profile:', error);
                        if (isMounted) {
                            setUser({
                                uid: firebaseUser.uid,
                                email: firebaseUser.email,
                                displayName: firebaseUser.displayName || 'User',
                                fullName: firebaseUser.displayName || 'User',
                                username: firebaseUser.email?.split('@')[0] || 'user',
                                photoURL: firebaseUser.photoURL || '',
                                emailVerified: firebaseUser.emailVerified,
                                privacy: { lastSeen: 'everyone', onlineStatus: true, readReceipts: true, profileVisibility: 'everyone', friendRequests: 'everyone' },
                                chatPrefs: { enterToSend: true, autoScroll: true, chatFontSize: 'medium', messagePreview: true },
                            });
                        }
                    }
                } else {
                    if (isMounted) {
                        setUser(null);
                    }
                }

                if (isMounted) {
                    // ROOT CAUSE FIX: Successfully initialized. Clear the timeout so it doesn't fire falsely.
                    clearTimeout(safetyTimer);
                    setLoading(false);
                    setIsAuthenticating(false);
                }
            });
        };

        initializeAuth();

        return () => {
            isMounted = false;
            clearTimeout(safetyTimer);
        };
    }, []);

    // Clean up native splash from HTML
    useEffect(() => {
        if (!loading) {
            const nativeSplash = document.getElementById('native-splash');
            if (nativeSplash) {
                nativeSplash.style.opacity = '0';
                setTimeout(() => nativeSplash.remove(), 300);
            }
        }
    }, [loading]);

    const login = async (email, password, rememberMe) => {
        setIsAuthenticating(true);
        try {
            return await authService.login(email, password, rememberMe);
        } catch (err) {
            setIsAuthenticating(false);
            throw err;
        }
    };

    const googleLogin = async () => {
        setIsAuthenticating(true);
        try {
            return await authService.googleLogin();
        } catch (err) {
            setIsAuthenticating(false);
            throw err;
        }
    };

    const logout = async () => {
        try {
            await authService.logout();
        } catch (error) {
            await signOut(auth);
        } finally {
            setUser(null);
            setIsAuthenticating(false);
        }
    };

    const value = {
        user,
        loading,
        isAuthenticated: Boolean(user),
        login,
        googleLogin,
        logout,
    };

    if (loading || isAuthenticating) {
        return <SplashScreen message={isAuthenticating ? "Signing into your workspace..." : "Restoring ZainOn session..."} />;
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthProvider;