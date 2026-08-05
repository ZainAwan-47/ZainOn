// Third Party Libraries
import { getAuth } from 'firebase/auth';

// Firebase
import { app } from './firebase';

// Initialize Firebase Authentication instance
export const auth = getAuth(app);

export default auth;