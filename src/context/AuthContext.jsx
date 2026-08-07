// React
import React, { createContext, useState, useEffect } from 'react';

// Firebase
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth } from '../firebase/auth';
import { db } from '../firebase/firestore';

// Services
import { authService } from '../services/authService';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let unsubscribeUserDoc = null;

        const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
            if (unsubscribeUserDoc) {
                unsubscribeUserDoc();
                unsubscribeUserDoc = null;
            }

            if (firebaseUser) {
                try {
                    const profile = await authService.getUserProfile(firebaseUser.uid);

                    const userDocRef = doc(db, 'users', firebaseUser.uid);
                    unsubscribeUserDoc = onSnapshot(userDocRef, (docSnap) => {
                        const liveData = docSnap.exists() ? docSnap.data() : {};
                        setUser({
                            uid: firebaseUser.uid,
                            email: firebaseUser.email,
                            displayName: firebaseUser.displayName || liveData.fullName || profile?.fullName || 'User',
                            fullName: liveData.fullName || profile?.fullName || firebaseUser.displayName || 'User',
                            username: liveData.username || profile?.username || firebaseUser.email?.split('@')[0] || 'user',
                            photoURL: liveData.photoURL || firebaseUser.photoURL || profile?.photoURL || '',
                            bio: liveData.bio || profile?.bio || '',
                            status: liveData.status || profile?.status || "Hey there! I'm using ZainOn.",
                            isOnline: liveData.isOnline ?? true,
                            role: liveData.role || profile?.role || 'user',
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
                    }, (error) => {
                        console.error('[AuthContext]: Error listening to user doc snapshot', error);
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
                        privacy: { lastSeen: 'everyone', onlineStatus: true, readReceipts: true, profileVisibility: 'everyone', friendRequests: 'everyone' },
                        chatPrefs: { enterToSend: true, autoScroll: true, chatFontSize: 'medium', messagePreview: true },
                    });
                }
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return () => {
            unsubscribeAuth();
            if (unsubscribeUserDoc) unsubscribeUserDoc();
        };
    }, []);

    const logout = async () => {
        try {
            if (authService && typeof authService.logout === 'function') {
                await authService.logout();
            } else {
                await signOut(auth);
            }
        } catch (error) {
            console.warn('[AuthContext] Service logout threw an error, forcing native Firebase signOut:', error);
            await signOut(auth);
        } finally {
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

export default AuthProvider;