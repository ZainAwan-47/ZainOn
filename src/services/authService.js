// Third Party Libraries
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    sendEmailVerification,
    sendPasswordResetEmail,
    signOut,
    GoogleAuthProvider,
    signInWithPopup,
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

/**
 * Maps Firebase Authentication and Cloud Firestore error codes to user-friendly messages.
 * @param {string} code - The Firebase error code or custom error message.
 * @returns {string} User-friendly error message.
 */
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
    /**
     * Retrieves a user profile document from Firestore by user ID.
     * @param {string} uid
     * @returns {Promise<Object|null>}
     */
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

    /**
     * Authenticates a user with email and password using Firebase Auth.
     * Enforces email verification before allowing an active session.
     * @param {string} email
     * @param {string} password
     * @returns {Promise<import('firebase/auth').UserCredential>}
     */
    login: async (email, password) => {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            if (!user.emailVerified) {
                await signOut(auth);
                throw new Error('Please verify your email before signing in.');
            }

            return userCredential;
        } catch (error) {
            console.error('[authService.login]:', error.code || error.message);
            if (error.message === 'Please verify your email before signing in.') {
                throw error;
            }
            const friendlyMessage = formatAuthError(error.code);
            throw new Error(friendlyMessage);
        }
    },

    /**
     * Resends a verification email to an unverified user account.
     * @param {string} email
     * @param {string} password
     * @returns {Promise<void>}
     */
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

    /**
     * Registers a new user, creates a Firestore document, and sends email verification.
     * @param {Object} userData
     * @param {string} userData.fullName
     * @param {string} userData.username
     * @param {string} userData.email
     * @param {string} userData.password
     * @returns {Promise<import('firebase/auth').UserCredential>}
     */
    register: async ({ fullName, username, email, password }) => {
        try {
            // 1. Check if username already exists in Firestore
            const usersRef = collection(db, 'users');
            const usernameQuery = query(usersRef, where('username', '==', username));
            const querySnapshot = await getDocs(usernameQuery);

            if (!querySnapshot.empty) {
                throw new Error('Username is already taken.');
            }

            // 2. Create Firebase Authentication User
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // 3. Create Firestore User Document
            const userDocRef = doc(db, 'users', user.uid);
            await setDoc(userDocRef, {
                uid: user.uid,
                fullName,
                username,
                email,
                role: 'user',
                bio: '',
                status: "Hey there! I'm using ZainOn.",
                isOnline: false,
                lastSeen: null,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });

            // 4. Send Email Verification
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

    /**
     * Authenticates a user using Google OAuth popup.
     * Provisions a Firestore user document if signing in for the first time.
     * @returns {Promise<import('firebase/auth').UserCredential>}
     */
    googleLogin: async () => {
        try {
            const provider = new GoogleAuthProvider();
            const userCredential = await signInWithPopup(auth, provider);
            const user = userCredential.user;

            // Check if user document already exists in Firestore
            const userDocRef = doc(db, 'users', user.uid);
            const userDocSnap = await getDoc(userDocRef);

            if (!userDocSnap.exists()) {
                // Generate valid base username from email or fallback
                let baseUsername = user.email
                    ? user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '')
                    : 'user';

                if (baseUsername.length < 3) {
                    baseUsername = `${baseUsername}_${Math.floor(100 + Math.random() * 900)}`;
                }
                if (baseUsername.length > 20) {
                    baseUsername = baseUsername.substring(0, 20);
                }

                // Verify username uniqueness in Firestore
                const usersRef = collection(db, 'users');
                const usernameQuery = query(usersRef, where('username', '==', baseUsername));
                const querySnapshot = await getDocs(usernameQuery);

                let finalUsername = baseUsername;
                if (!querySnapshot.empty) {
                    finalUsername = `${baseUsername.substring(0, 14)}_${Math.floor(1000 + Math.random() * 9000)}`;
                }

                // Create Firestore profile document
                await setDoc(userDocRef, {
                    uid: user.uid,
                    fullName: user.displayName || 'ZainOn User',
                    username: finalUsername,
                    email: user.email || '',
                    role: 'user',
                    bio: '',
                    status: "Hey there! I'm using ZainOn.",
                    isOnline: false,
                    lastSeen: null,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                });
            }

            return userCredential;
        } catch (error) {
            console.error('[authService.googleLogin]:', error.code || error.message);
            const friendlyMessage = formatAuthError(error.code);
            throw new Error(friendlyMessage);
        }
    },

    /**
     * Sends a password reset email to the specified address.
     * @param {string} email
     * @returns {Promise<void>}
     */
    resetPassword: async (email) => {
        try {
            await sendPasswordResetEmail(auth, email);
        } catch (error) {
            console.error('[authService.resetPassword]:', error.code || error.message);
            const friendlyMessage = formatAuthError(error.code);
            throw new Error(friendlyMessage);
        }
    },

    /**
     * Signs out the currently authenticated user from Firebase Auth.
     * @returns {Promise<void>}
     */
    logout: async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error('[authService.logout]:', error.code || error.message);
            const friendlyMessage = formatAuthError(error.code);
            throw new Error(friendlyMessage);
        }
    },
};

export default authService;