// React
import React, { useState, useEffect, useRef, useCallback } from 'react';

// Services & Hooks
import { useAuth } from '../hooks/useAuth';
import { callService } from '../services/callService';
import { WebRTCService } from '../features/calls/services/webrtcService';
import { CallContext } from '../context/CallContext';

export const CallProvider = ({ children }) => {
    const { user } = useAuth();

    // -- Call State Machine --
    const [activeCall, setActiveCall] = useState(null);
    const [callStatus, setCallStatus] = useState('idle'); // idle, calling, ringing, connecting, connected
    const [callType, setCallType] = useState('audio');

    // -- Media State --
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isCameraEnabled, setIsCameraEnabled] = useState(false);
    const [remoteUser, setRemoteUser] = useState(null);

    // -- Internal Engine Refs --
    const webrtcRef = useRef(null);
    const activeCallIdRef = useRef(null);

    // -- Listener Unsubscribe Refs --
    const incomingSubRef = useRef(null);
    const callUpdateSubRef = useRef(null);
    const iceSubRef = useRef(null);

    // 1. GLOBAL INCOMING CALL LISTENER
    useEffect(() => {
        if (!user?.uid) return;

        // Listen for calls directed to me where status is 'calling'
        incomingSubRef.current = callService.subscribeToIncomingCalls(user.uid, (callData) => {
            // If already in a call, ignore new ones (or handle busy logic later)
            if (activeCallIdRef.current) return;

            activeCallIdRef.current = callData.callId;
            setActiveCall(callData);
            setCallType(callData.type);
            setCallStatus('ringing');

            // Set basic remote user info for incoming caller
            setRemoteUser({ uid: callData.callerId });
        });

        return () => {
            if (incomingSubRef.current) incomingSubRef.current();
        };
    }, [user?.uid]);

    // Cleanup Helper
    const cleanupCallState = useCallback(() => {
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

        setActiveCall(null);
        activeCallIdRef.current = null;
        setCallStatus('idle');
        setLocalStream(null);
        setRemoteStream(null);
        setIsMuted(false);
        setIsCameraEnabled(false);
        setRemoteUser(null);
    }, []);

    // Setup WebRTC Instance & Callbacks
    const setupWebRTC = useCallback((role, callId) => {
        webrtcRef.current = new WebRTCService();

        webrtcRef.current.onIceCandidate = (candidate) => {
            callService.addIceCandidate(callId, candidate, role);
        };

        webrtcRef.current.onRemoteTrack = (stream) => {
            setRemoteStream(new MediaStream(stream.getTracks()));
        };

        webrtcRef.current.onConnectionStateChange = (state) => {
            if (state === 'connected') {
                setCallStatus('connected');
            } else if (state === 'disconnected' || state === 'failed' || state === 'closed') {
                // If WebRTC fails or closes, end the call
                callService.updateCallStatus(callId, 'ended', user?.uid);
                cleanupCallState();
            }
        };
    }, [cleanupCallState, user?.uid]);


    // -- OUTGOING ACTIONS --

    const startCall = async (targetUser, type = 'audio') => {
        if (!user?.uid || !targetUser?.uid) return;

        setRemoteUser(targetUser);
        setCallType(type);
        setCallStatus('calling');

        try {
            // 1. Init Media & WebRTC
            const stream = await new WebRTCService().getLocalMedia(type); // Temp instance just to get media
            setLocalStream(stream);
            setIsCameraEnabled(type === 'video');

            // 2. Generate Offer
            setupWebRTC('caller', 'temp_id_will_replace');
            webrtcRef.current.localStream = stream; // Attach stream
            const offer = await webrtcRef.current.createOffer();

            // 3. Write to Firestore
            const callId = await callService.createCall(user.uid, targetUser.uid, type, offer);
            activeCallIdRef.current = callId;
            setActiveCall({ callId, callerId: user.uid, receiverId: targetUser.uid });

            // Re-assign proper callId to ICE callback
            webrtcRef.current.onIceCandidate = (c) => callService.addIceCandidate(callId, c, 'caller');

            // 4. Listen for Receiver's Answer & Status Changes
            callUpdateSubRef.current = callService.subscribeToCallUpdates(callId, async (updatedCall) => {
                if (updatedCall.status === 'connecting' && updatedCall.answer) {
                    await webrtcRef.current.handleAnswer(updatedCall.answer.sdp);
                } else if (['rejected', 'cancelled', 'ended', 'missed'].includes(updatedCall.status)) {
                    cleanupCallState();
                }
            });

            // 5. Listen for Receiver's ICE Candidates
            iceSubRef.current = callService.subscribeToRemoteIceCandidates(callId, 'caller', (candidateData) => {
                webrtcRef.current.addIceCandidate(candidateData);
            });

        } catch (error) {
            console.error('Failed to start call:', error);
            cleanupCallState();
        }
    };

    const cancelCall = async () => {
        if (activeCallIdRef.current) {
            await callService.updateCallStatus(activeCallIdRef.current, 'cancelled', user?.uid);
            cleanupCallState();
        }
    };


    // -- INCOMING ACTIONS --

    const acceptCall = async () => {
        if (!activeCall || !activeCall.offer) return;
        const callId = activeCall.callId;

        try {
            // 1. Init Media & WebRTC
            const stream = await new WebRTCService().getLocalMedia(callType);
            setLocalStream(stream);
            setIsCameraEnabled(callType === 'video');

            // 2. Setup PC & Generate Answer
            setupWebRTC('receiver', callId);
            webrtcRef.current.localStream = stream;
            const answer = await webrtcRef.current.handleOfferAndCreateAnswer(activeCall.offer.sdp);

            // 3. Write Answer to Firestore
            await callService.answerCall(callId, answer);
            setCallStatus('connecting');

            // 4. Listen for Call Ending
            callUpdateSubRef.current = callService.subscribeToCallUpdates(callId, (updatedCall) => {
                if (['ended', 'cancelled'].includes(updatedCall.status)) {
                    cleanupCallState();
                }
            });

            // 5. Listen for Caller's ICE Candidates
            iceSubRef.current = callService.subscribeToRemoteIceCandidates(callId, 'receiver', (candidateData) => {
                webrtcRef.current.addIceCandidate(candidateData);
            });

        } catch (error) {
            console.error('Failed to accept call:', error);
            cleanupCallState();
        }
    };

    const rejectCall = async () => {
        if (activeCallIdRef.current) {
            await callService.updateCallStatus(activeCallIdRef.current, 'rejected', user?.uid);
            cleanupCallState();
        }
    };


    // -- IN-CALL ACTIONS --

    const endCall = async () => {
        if (activeCallIdRef.current) {
            await callService.updateCallStatus(activeCallIdRef.current, 'ended', user?.uid);
            cleanupCallState();
        }
    };

    const toggleMute = () => {
        if (webrtcRef.current) {
            const newMutedState = !isMuted;
            webrtcRef.current.toggleAudio(!newMutedState); // !muted = enabled
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

    // Construct the context payload
    const contextValue = {
        activeCall,
        callStatus,
        callType,
        localStream,
        remoteStream,
        isMuted,
        isCameraEnabled,
        remoteUser,

        startAudioCall: (target) => startCall(target, 'audio'),
        startVideoCall: (target) => startCall(target, 'video'),
        acceptCall,
        rejectCall,
        cancelCall,
        endCall,
        toggleMute,
        toggleCamera
    };

    return (
        <CallContext.Provider value={contextValue}>
            {children}

            {/* UI Overlays will be injected here in SPRINT 1E */}
            {/* {callStatus !== 'idle' && <ActiveCallOverlay />} */}

        </CallContext.Provider>
    );
};

export default CallProvider;