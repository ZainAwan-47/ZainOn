import { db } from '../firebase/firestore';
import {
    collection, doc, setDoc, updateDoc, onSnapshot,
    query, where, serverTimestamp, addDoc
} from 'firebase/firestore';

export const callService = {
    // 1. Initiate the call (Write Offer with dynamic initial status)
    createCall: async (callerId, receiverId, callType, offer, initialStatus = 'calling') => {
        const callDocRef = doc(collection(db, 'calls'));
        await setDoc(callDocRef, {
            callId: callDocRef.id,
            callerId,
            receiverId,
            type: callType,
            status: initialStatus, // 'ringing' if online, 'calling' if offline
            offer: {
                type: offer.type,
                sdp: offer.sdp
            },
            createdAt: serverTimestamp(),
            answeredAt: null,
            endedAt: null,
            endedBy: null
        });
        return callDocRef.id;
    },

    // 2. Receiver answers the call (Write Answer)
    answerCall: async (callId, answer) => {
        const callDocRef = doc(db, 'calls', callId);
        await updateDoc(callDocRef, {
            status: 'connecting',
            answer: {
                type: answer.type,
                sdp: answer.sdp
            },
            answeredAt: serverTimestamp()
        });
    },

    // 3. Update generic status
    updateCallStatus: async (callId, status, endedByUid = null) => {
        const callDocRef = doc(db, 'calls', callId);
        const updates = { status };

        if (status === 'ended' || status === 'rejected' || status === 'cancelled') {
            updates.endedAt = serverTimestamp();
            if (endedByUid) updates.endedBy = endedByUid;
        }
        await updateDoc(callDocRef, updates);
    },

    // 4. Add ICE Candidate
    addIceCandidate: async (callId, candidate, role) => {
        const collectionName = role === 'caller' ? 'callerCandidates' : 'receiverCandidates';
        const candidatesRef = collection(db, 'calls', callId, collectionName);
        await addDoc(candidatesRef, candidate.toJSON());
    },

    // 5. Listen to incoming calls
    subscribeToIncomingCalls: (uid, callback) => {
        const q = query(
            collection(db, 'calls'),
            where('receiverId', '==', uid),
            where('status', 'in', ['calling', 'ringing'])
        );

        return onSnapshot(q, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    const data = change.doc.data();
                    // Absolute safeguard: never trigger incoming for own calls
                    if (data.callerId !== uid) {
                        callback(data);
                    }
                }
            });
        });
    },

    // 6. Listen to specific call updates
    subscribeToCallUpdates: (callId, callback) => {
        return onSnapshot(doc(db, 'calls', callId), (docSnap) => {
            if (docSnap.exists()) {
                callback(docSnap.data());
            }
        });
    },

    // 7. Listen to remote ICE candidates
    subscribeToRemoteIceCandidates: (callId, targetRole, callback) => {
        const collectionName = targetRole === 'caller' ? 'receiverCandidates' : 'callerCandidates';
        const candidatesRef = collection(db, 'calls', callId, collectionName);

        return onSnapshot(candidatesRef, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    callback(change.doc.data());
                }
            });
        });
    }
};