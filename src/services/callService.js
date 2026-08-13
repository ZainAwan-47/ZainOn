import { db } from '../firebase/firestore';
import {
    collection, doc, setDoc, updateDoc, onSnapshot,
    query, where, serverTimestamp, addDoc
} from 'firebase/firestore';

export const callService = {
    // 1. Initiate the call (Write Offer)
    createCall: async (callerId, receiverId, callType, offer) => {
        const callDocRef = doc(collection(db, 'calls'));
        await setDoc(callDocRef, {
            callId: callDocRef.id,
            callerId,
            receiverId,
            type: callType,
            status: 'calling',
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

    // 3. Update generic status (rejected, cancelled, connected, ended)
    updateCallStatus: async (callId, status, endedByUid = null) => {
        const callDocRef = doc(db, 'calls', callId);
        const updates = { status };

        if (status === 'ended' || status === 'rejected' || status === 'cancelled') {
            updates.endedAt = serverTimestamp();
            if (endedByUid) updates.endedBy = endedByUid;
        }
        await updateDoc(callDocRef, updates);
    },

    // 4. Add ICE Candidate (Trickle ICE)
    addIceCandidate: async (callId, candidate, role) => {
        // role is either 'caller' or 'receiver'
        const collectionName = role === 'caller' ? 'callerCandidates' : 'receiverCandidates';
        const candidatesRef = collection(db, 'calls', callId, collectionName);
        await addDoc(candidatesRef, candidate.toJSON());
    },

    // 5. Listen to incoming calls
    subscribeToIncomingCalls: (uid, callback) => {
        const q = query(
            collection(db, 'calls'),
            where('receiverId', '==', uid),
            where('status', '==', 'calling')
        );

        return onSnapshot(q, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    callback(change.doc.data());
                }
            });
        });
    },

    // 6. Listen to specific call updates (e.g., waiting for answer or end)
    subscribeToCallUpdates: (callId, callback) => {
        return onSnapshot(doc(db, 'calls', callId), (docSnap) => {
            if (docSnap.exists()) {
                callback(docSnap.data());
            }
        });
    },

    // 7. Listen to remote ICE candidates
    subscribeToRemoteIceCandidates: (callId, targetRole, callback) => {
        // If I am the caller, I listen to 'receiverCandidates'. If I am receiver, I listen to 'callerCandidates'
        const collectionName = targetRole === 'caller' ? 'callerCandidates' : 'receiverCandidates';
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