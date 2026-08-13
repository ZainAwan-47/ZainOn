// Third Party Libraries
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    sendEmailVerification,
    sendPasswordResetEmail,
    signOut,
    GoogleAuthProvider,
    signInWithPopup,
    setPersistence,
    browserLocalPersistence,
    browserSessionPersistence,
} from 'firebase/auth';
import {
    collection,
    doc,
    setDoc,
    getDoc,
    getDocs,
    query,
    where,
    serverTimestamp,
} from 'firebase/firestore';

// Firebase
import { auth } from '../firebase/auth';
import { db } from '../firebase/firestore';

// Services
import { presenceService } from './presenceService';

const formatAuthError = (code) => {
    switch (code) {
        case 'auth/popup-closed-by-user':
            return 'Sign-in cancelled. The authentication window was closed.';
        case 'auth/popup-blocked':
            return 'Pop-up blocked by your browser. Please allow pop-ups for this site and try again.';
        case 'auth/cancelled-popup-request':
            return 'Authentication request was cancelled.';
        case 'auth/account-exists-with-different-credential':
            return 'An account already exists with this email using a different sign-in method.';
        case 'permission-denied':
        case 'firestore/permission-denied':
            return 'Database access denied. Please check your Firestore security rules.';
        case 'auth/email-already-in-use':
            return 'An account with this email address already exists.';
        case 'auth/invalid-email':
            return 'Please enter a valid email address.';
        case 'auth/weak-password':
            return 'Password is too weak. Please use a stronger password.';
        case 'auth/invalid-credential':
        case 'auth/user-not-found':
            return 'No account found with this email address.';
        case 'auth/wrong-password':
            return 'Invalid email or password. Please check your credentials.';
        case 'auth/too-many-requests':
            return 'Too many attempts. Please try again later.';
        case 'auth/network-request-failed':
            return 'Network error. Please check your internet connection.';
        case 'auth/user-disabled':
            return 'This account has been disabled. Please contact support.';
        default:
            return 'Failed to complete authentication request. Please try again.';
    }
};

export const authService = {
    getUserProfile: async (uid) => {
        try {
            const userDocRef = doc(db, 'users', uid);
            const userDocSnap = await getDoc(userDocRef);
            if (userDocSnap.exists()) {
                return userDocSnap.data();
            }
            return null;
        } catch (error) {
            console.error('[authService.getUserProfile]:', error.code || error.message);
            return null;
        }
    },

    login: async (email, password, rememberMe = true) => {
        try {
            const persistenceMode = rememberMe
                ? browserLocalPersistence
                : browserSessionPersistence;
            await setPersistence(auth, persistenceMode);

            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // ROOT CAUSE FIX: Mismatched method name. Using correct 'setUserOnline'
            try {
                await presenceService.setUserOnline(user.uid);
            } catch (presenceErr) {
                console.warn('[authService.login] Non-critical presence update failed:', presenceErr);
            }

            return userCredential;
        } catch (error) {
            console.error('[authService.login]:', error.code || error.message);
            const friendlyMessage = formatAuthError(error.code);
            throw new Error(friendlyMessage);
        }
    },

    resendVerificationEmail: async (email, password) => {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            await sendEmailVerification(userCredential.user);
            await signOut(auth);
        } catch (error) {
            console.error('[authService.resendVerificationEmail]:', error.code || error.message);
            const friendlyMessage = formatAuthError(error.code);
            throw new Error(friendlyMessage);
        }
    },

    register: async ({ fullName, username, email, password }) => {
        try {
            const usersRef = collection(db, 'users');
            const usernameQuery = query(usersRef, where('username', '==', username));
            const querySnapshot = await getDocs(usernameQuery);

            if (!querySnapshot.empty) {
                throw new Error('Username is already taken.');
            }

            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            const userDocRef = doc(db, 'users', user.uid);
            await setDoc(userDocRef, {
                uid: user.uid,
                fullName,
                username,
                email,
                role: 'user',
                bio: '',
                status: "Hey there! I'm using ZainOn.",
                isOnline: true,
                lastSeen: null,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });

            await sendEmailVerification(user);

            return userCredential;
        } catch (error) {
            console.error('[authService.register]:', error.code || error.message);
            if (error.message === 'Username is already taken.') {
                throw error;
            }
            const friendlyMessage = formatAuthError(error.code);
            throw new Error(friendlyMessage);
        }
    },

    googleLogin: async () => {
        try {
            const provider = new GoogleAuthProvider();
            const userCredential = await signInWithPopup(auth, provider);
            const user = userCredential.user;

            const userDocRef = doc(db, 'users', user.uid);
            const userDocSnap = await getDoc(userDocRef);

            if (!userDocSnap.exists()) {
                let baseUsername = user.email
                    ? user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '')
                    : 'user';

                if (baseUsername.length < 3) {
                    baseUsername = `${baseUsername}_${Math.floor(100 + Math.random() * 900)}`;
                }
                if (baseUsername.length > 20) {
                    baseUsername = baseUsername.substring(0, 20);
                }

                const usersRef = collection(db, 'users');
                const usernameQuery = query(usersRef, where('username', '==', baseUsername));
                const querySnapshot = await getDocs(usernameQuery);

                let finalUsername = baseUsername;
                if (!querySnapshot.empty) {
                    finalUsername = `${baseUsername.substring(0, 14)}_${Math.floor(1000 + Math.random() * 9000)}`;
                }

                await setDoc(userDocRef, {
                    uid: user.uid,
                    fullName: user.displayName || 'ZainOn User',
                    username: finalUsername,
                    email: user.email || '',
                    role: 'user',
                    bio: '',
                    status: "Hey there! I'm using ZainOn.",
                    isOnline: true,
                    lastSeen: null,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                });
            } else {
                // ROOT CAUSE FIX: Mismatched method name.
                await presenceService.setUserOnline(user.uid);
            }

            return userCredential;
        } catch (error) {
            console.error('[authService.googleLogin]:', error.code || error.message);
            const friendlyMessage = formatAuthError(error.code);
            throw new Error(friendlyMessage);
        }
    },

    resetPassword: async (email) => {
        try {
            await sendPasswordResetEmail(auth, email);
        } catch (error) {
            console.error('[authService.resetPassword]:', error.code || error.message);
            const friendlyMessage = formatAuthError(error.code);
            throw new Error(friendlyMessage);
        }
    },

    logout: async () => {
        try {
            if (auth.currentUser) {
                try {
                    // ROOT CAUSE FIX: Mismatched method name. Using correct 'setUserOffline'.
                    // Because this now succeeds BEFORE signOut, Firestore rules will allow it perfectly.
                    await presenceService.setUserOffline(auth.currentUser.uid);
                } catch (presenceErr) {
                    console.warn('[authService.logout]: Non-critical presence update failed:', presenceErr);
                }
            }
            await signOut(auth);
        } catch (error) {
            console.error('[authService.logout]:', error.code || error.message);
            await signOut(auth).catch(() => { });
        }
    },
};

export default authService;