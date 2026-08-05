// Third Party Libraries
import { getFirestore } from 'firebase/firestore';

// Firebase
import { app } from './firebase';

// Initialize Cloud Firestore instance
export const db = getFirestore(app);

export default db;