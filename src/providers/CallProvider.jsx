// React
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/firestore';

// Services & Hooks
import { useAuth } from '../hooks/useAuth';
import { callService } from '../services/callService';
import { messageService } from '../services/messageService';
import { WebRTCService } from '../features/calls/services/webrtcService';
import { CallContext } from '../context/CallContext';

import BoundGlobalCallManager from '../features/calls/components/GlobalCallManager';

export const CallProvider = ({ children }) => {
    const { user } = useAuth();

    const [activeCall, setActiveCall] = useState(null);
    const [callStatus, setCallStatus] = useState('idle');
    const [callType, setCallType] = useState('audio');

    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isCameraEnabled, setIsCameraEnabled] = useState(false);
    const [isSpeakerOn, setIsSpeakerOn] = useState(false);
    const [remoteUser, setRemoteUser] = useState(null);
    const [isMinimized, setIsMinimized] = useState(false);

    const webrtcRef = useRef(null);
    const activeCallIdRef = useRef(null);
    const iceQueueRef = useRef([]);
    const callStartTimeRef = useRef(null);
    const hasConnectedRef = useRef(false);
    const isInitiatorRef = useRef(false);

    const loggedCallsSetRef = useRef(new Set());
    const remoteUserRef = useRef(null);
    const callTypeRef = useRef('audio');

    const incomingSubRef = useRef(null);
    const callUpdateSubRef = useRef(null);
    const iceSubRef = useRef(null);
    const targetUserSubRef = useRef(null);

    // 1. GLOBAL INCOMING CALL LISTENER (Receiver Side Only)
    useEffect(() => {
        if (!user?.uid) return;

        incomingSubRef.current = callService.subscribeToIncomingCalls(user.uid, async (callData) => {
            // CRITICAL GUARD: Never trigger incoming call UI if I am the one who initiated it
            if (callData.callerId === user.uid) return;
            if (activeCallIdRef.current) return;

            activeCallIdRef.current = callData.callId;
            setActiveCall(callData);
            setCallType(callData.type);
            callTypeRef.current = callData.type;
            setCallStatus('ringing');
            setIsMinimized(false);
            hasConnectedRef.current = false;
            isInitiatorRef.current = false;

            callUpdateSubRef.current = callService.subscribeToCallUpdates(callData.callId, (updatedCall) => {
                if (['ended', 'cancelled', 'rejected', 'missed'].includes(updatedCall.status)) {
                    cleanupCallState();
                }
            });

            try {
                const callerDocRef = doc(db, 'users', callData.callerId);
                const callerSnap = await getDoc(callerDocRef);
                if (callerSnap.exists()) {
                    const rUser = { uid: callerSnap.id, ...callerSnap.data() };
                    setRemoteUser(rUser);
                    remoteUserRef.current = rUser;
                } else {
                    const fallback = { uid: callData.callerId, fullName: "Incoming Caller" };
                    setRemoteUser(fallback);
                    remoteUserRef.current = fallback;
                }
            } catch (err) {
                console.error("Failed to fetch caller profile:", err);
                const fallback = { uid: callData.callerId, fullName: "Incoming Caller" };
                setRemoteUser(fallback);
                remoteUserRef.current = fallback;
            }
        });

        return () => {
            if (incomingSubRef.current) incomingSubRef.current();
        };
    }, [user?.uid]);

    const logCallSummaryToChat = async (statusType, durationSeconds = 0) => {
        const targetUsr = remoteUserRef.current;
        const cType = callTypeRef.current;
        const currentCallId = activeCallIdRef.current;

        if (!user?.uid || !targetUsr?.uid || !currentCallId) return;

        if (loggedCallsSetRef.current.has(currentCallId)) return;
        loggedCallsSetRef.current.add(currentCallId);

        try {
            const ids = [user.uid, targetUsr.uid].sort();
            const conversationId = `${ids[0]}_${ids[1]}`;

            let summaryText = '';
            const callLabel = cType === 'video' ? 'Video call' : 'Audio call';

            if (statusType === 'connected' && durationSeconds > 0) {
                const m = Math.floor(durationSeconds / 60);
                const s = durationSeconds % 60;
                const timeStr = m > 0 ? `${m}m ${s}s` : `${s}s`;
                summaryText = `${callLabel} • ${timeStr}`;
            } else if (statusType === 'missed') {
                summaryText = `Missed ${cType} call`;
            } else {
                summaryText = `${callLabel} ended`;
            }

            await messageService.sendMessage(
                conversationId,
                user.uid,
                summaryText,
                targetUsr.uid,
                null,
                true,
                null,
                { isCallLog: true, callType: cType, statusType, durationSeconds, isInitiator: isInitiatorRef.current }
            );
        } catch (err) {
            console.warn('[CallProvider] Failed to log call message to chat:', err);
        }
    };

    const cleanupCallState = useCallback(async () => {
        if (isInitiatorRef.current) {
            if (hasConnectedRef.current && callStartTimeRef.current) {
                const durationSecs = Math.floor((Date.now() - callStartTimeRef.current) / 1000);
                await logCallSummaryToChat('connected', durationSecs);
            } else {
                await logCallSummaryToChat('missed', 0);
            }
        }

        if (targetUserSubRef.current) {
            targetUserSubRef.current();
            targetUserSubRef.current = null;
        }

        if (webrtcRef.current) {
            webrtcRef.current.cleanup();
            webrtcRef.current = null;
        }
        if (callUpdateSubRef.current) {
            callUpdateSubRef.current();
            callUpdateSubRef.current = null;
        }
        if (iceSubRef.current) {
            iceSubRef.current();
            iceSubRef.current = null;
        }

        iceQueueRef.current = [];
        setActiveCall(null);
        activeCallIdRef.current = null;
        setCallStatus('idle');
        setLocalStream(null);
        setRemoteStream(null);
        setIsMuted(false);
        setIsCameraEnabled(false);
        setRemoteUser(null);
        remoteUserRef.current = null;
        setIsMinimized(false);
        callStartTimeRef.current = null;
        hasConnectedRef.current = false;
        isInitiatorRef.current = false;
    }, []);

    const setupWebRTC = useCallback((role, initialCallId) => {
        webrtcRef.current = new WebRTCService();

        webrtcRef.current.onIceCandidate = (candidate) => {
            const currentCallId = activeCallIdRef.current || initialCallId;
            if (!currentCallId || currentCallId === 'pending_call_id') {
                iceQueueRef.current.push(candidate);
                return;
            }
            callService.addIceCandidate(currentCallId, candidate, role);
        };

        webrtcRef.current.onRemoteTrack = (stream) => {
            setRemoteStream(new MediaStream(stream.getTracks()));
        };

        webrtcRef.current.onConnectionStateChange = (state) => {
            if (state === 'connected') {
                hasConnectedRef.current = true;
                setCallStatus('connected');
                if (!callStartTimeRef.current) {
                    callStartTimeRef.current = Date.now();
                }
            } else if (state === 'disconnected' || state === 'failed' || state === 'closed') {
                const currentCallId = activeCallIdRef.current;
                if (currentCallId) {
                    callService.updateCallStatus(currentCallId, 'ended', user?.uid);
                }
                cleanupCallState();
            }
        };
    }, [cleanupCallState, user?.uid]);

    // -- OUTGOING ACTIONS (Caller Side) --
    const startCall = async (targetUser, type = 'audio') => {
        const callerUid = user?.uid;
        const targetUid = targetUser?.uid || targetUser?.id;

        if (!callerUid || !targetUid) {
            console.error('[CallProvider] Missing caller or target UID.');
            return;
        }

        if (targetUid === callerUid) {
            console.error('[CallProvider ABORT] Cannot initiate a call to your own UID!');
            return;
        }

        setRemoteUser(targetUser);
        remoteUserRef.current = targetUser;
        setCallType(type);
        callTypeRef.current = type;
        setIsMinimized(false);
        iceQueueRef.current = [];
        hasConnectedRef.current = false;
        isInitiatorRef.current = true;

        // CRITICAL FIX: Caller status must strictly be 'calling' so it shows OutgoingCallView, never incoming ringing UI
        setCallStatus('calling');

        // Live subscribe to receiver presence updates
        if (targetUserSubRef.current) targetUserSubRef.current();
        targetUserSubRef.current = onSnapshot(doc(db, 'users', targetUid), (docSnap) => {
            if (docSnap.exists()) {
                const liveData = docSnap.data();
                setRemoteUser(prev => prev ? { ...prev, ...liveData } : { uid: targetUid, ...liveData });
                remoteUserRef.current = remoteUserRef.current ? { ...remoteUserRef.current, ...liveData } : { uid: targetUid, ...liveData };
            }
        });

        try {
            const stream = await new WebRTCService().getLocalMedia(type);
            setLocalStream(stream);
            setIsCameraEnabled(type === 'video');

            setupWebRTC('caller', 'pending_call_id');
            webrtcRef.current.localStream = stream;

            const offer = await webrtcRef.current.createOffer();
            const isTargetOnline = targetUser?.isOnline !== false;
            const dbStatus = isTargetOnline ? 'ringing' : 'calling';
            const callId = await callService.createCall(callerUid, targetUid, type, offer, dbStatus);

            activeCallIdRef.current = callId;
            setActiveCall({ callId, callerId: callerUid, receiverId: targetUid });

            if (iceQueueRef.current.length > 0) {
                for (const candidate of iceQueueRef.current) {
                    await callService.addIceCandidate(callId, candidate, 'caller');
                }
                iceQueueRef.current = [];
            }

            callUpdateSubRef.current = callService.subscribeToCallUpdates(callId, async (updatedCall) => {
                if (updatedCall.status === 'connecting' && updatedCall.answer) {
                    setCallStatus('connecting');
                    await webrtcRef.current?.handleAnswer(updatedCall.answer.sdp);
                } else if (['rejected', 'cancelled', 'ended', 'missed'].includes(updatedCall.status)) {
                    cleanupCallState();
                }
            });

            iceSubRef.current = callService.subscribeToRemoteIceCandidates(callId, 'caller', (candidateData) => {
                webrtcRef.current?.addIceCandidate(candidateData);
            });

        } catch (error) {
            console.error('[CallProvider] Failed to start call:', error);
            cleanupCallState();
        }
    };

    const cancelCall = async () => {
        if (activeCallIdRef.current) {
            await callService.updateCallStatus(activeCallIdRef.current, 'cancelled', user?.uid);
            cleanupCallState();
        }
    };

    const acceptCall = async () => {
        if (!activeCall || !activeCall.offer) return;
        const callId = activeCall.callId;

        try {
            const stream = await new WebRTCService().getLocalMedia(callType);
            setLocalStream(stream);
            setIsCameraEnabled(callType === 'video');

            setupWebRTC('receiver', callId);
            webrtcRef.current.localStream = stream;

            const answer = await webrtcRef.current.handleOfferAndCreateAnswer(activeCall.offer.sdp);
            await callService.answerCall(callId, answer);
            setCallStatus('connecting');
            setIsMinimized(false);
            isInitiatorRef.current = false;

            if (iceQueueRef.current.length > 0) {
                for (const candidate of iceQueueRef.current) {
                    await callService.addIceCandidate(callId, candidate, 'receiver');
                }
                iceQueueRef.current = [];
            }

            if (callUpdateSubRef.current) callUpdateSubRef.current();
            callUpdateSubRef.current = callService.subscribeToCallUpdates(callId, (updatedCall) => {
                if (['ended', 'cancelled', 'rejected', 'missed'].includes(updatedCall.status)) {
                    cleanupCallState();
                }
            });

            iceSubRef.current = callService.subscribeToRemoteIceCandidates(callId, 'receiver', (candidateData) => {
                webrtcRef.current?.addIceCandidate(candidateData);
            });

        } catch (error) {
            console.error('[CallProvider] Failed to accept call:', error);
            cleanupCallState();
        }
    };

    const rejectCall = async () => {
        if (activeCallIdRef.current) {
            await callService.updateCallStatus(activeCallIdRef.current, 'rejected', user?.uid);
            cleanupCallState();
        }
    };

    const endCall = async () => {
        if (activeCallIdRef.current) {
            await callService.updateCallStatus(activeCallIdRef.current, 'ended', user?.uid);
            cleanupCallState();
        }
    };

    const toggleMute = () => {
        if (webrtcRef.current) {
            const newMutedState = !isMuted;
            webrtcRef.current.toggleAudio(!newMutedState);
            setIsMuted(newMutedState);
        }
    };

    const toggleCamera = () => {
        if (webrtcRef.current && callType === 'video') {
            const newCameraState = !isCameraEnabled;
            webrtcRef.current.toggleVideo(newCameraState);
            setIsCameraEnabled(newCameraState);
        }
    };

    const toggleSpeaker = () => setIsSpeakerOn(prev => !prev);
    const toggleMinimize = () => setIsMinimized(prev => !prev);

    const contextValue = {
        activeCall,
        callStatus,
        callType,
        localStream,
        remoteStream,
        isMuted,
        isCameraEnabled,
        isSpeakerOn,
        remoteUser,
        isMinimized,

        startAudioCall: (target) => startCall(target, 'audio'),
        startVideoCall: (target) => startCall(target, 'video'),
        acceptCall,
        rejectCall,
        cancelCall,
        endCall,
        toggleMute,
        toggleCamera,
        toggleSpeaker,
        toggleMinimize
    };

    return (
        <CallContext.Provider value={contextValue}>
            {children}
            <BoundGlobalCallManager />
        </CallContext.Provider>
    );
};

export default CallProvider;