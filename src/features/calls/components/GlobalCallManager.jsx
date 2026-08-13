import React, { useContext, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CallContext } from '../../../context/CallContext';
import Avatar from '../../../components/ui/Avatar';

const VideoTrack = ({ stream, isLocal }) => {
    const videoRef = useRef(null);

    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

    return (
        <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={isLocal}
            className={`w-full h-full object-cover ${isLocal ? 'scale-x-[-1]' : ''}`}
        />
    );
};

const IncomingCallView = ({ remoteUser, callType, acceptCall, rejectCall }) => (
    <motion.div
        initial={{ opacity: 0, y: -50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
        className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-3xl shadow-2xl p-6 w-[90%] max-w-[320px] flex flex-col items-center text-center mx-auto mt-16 sm:mt-24 pointer-events-auto"
    >
        <div className="relative mb-4">
            <div className="absolute inset-0 bg-[var(--color-primary)] rounded-full animate-ping opacity-20"></div>
            <Avatar src={remoteUser?.photoURL} name={remoteUser?.fullName || 'User'} size="xl" />
        </div>
        <h2 className="text-lg font-bold text-[var(--text-primary)] tracking-tight truncate w-full">
            {remoteUser?.fullName || 'Unknown Caller'}
        </h2>
        <p className="text-xs font-semibold text-[var(--color-primary)] mt-1 uppercase tracking-widest">
            Incoming {callType} Call
        </p>

        <div className="flex items-center justify-center space-x-4 mt-8 w-full">
            <button onClick={rejectCall} className="flex-1 py-3 bg-[var(--color-danger)] text-white rounded-2xl font-bold shadow-md hover:opacity-90 active:scale-95 transition-all">
                Decline
            </button>
            <button onClick={acceptCall} className="flex-1 py-3 bg-[var(--color-success)] text-white rounded-2xl font-bold shadow-md hover:opacity-90 active:scale-95 transition-all animate-pulse">
                Accept
            </button>
        </div>
    </motion.div>
);

const OutgoingCallView = ({ remoteUser, callStatus, callType, cancelCall }) => {
    const isOnline = remoteUser?.isOnline === true;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-3xl shadow-2xl p-6 w-[90%] max-w-[320px] flex flex-col items-center text-center mx-auto mt-16 sm:mt-24 pointer-events-auto"
        >
            <Avatar src={remoteUser?.photoURL} name={remoteUser?.fullName || 'User'} size="xl" className="mb-4" />
            <h2 className="text-lg font-bold text-[var(--text-primary)] tracking-tight truncate w-full">
                {remoteUser?.fullName || 'Unknown User'}
            </h2>
            <div className="flex items-center space-x-2 mt-2">
                <span className={`w-2 h-2 rounded-full animate-bounce [animation-delay:-0.3s] ${isOnline ? 'bg-orange-500' : 'bg-[var(--text-secondary)]'}`}></span>
                <span className={`w-2 h-2 rounded-full animate-bounce [animation-delay:-0.15s] ${isOnline ? 'bg-orange-500' : 'bg-[var(--text-secondary)]'}`}></span>
                <span className={`w-2 h-2 rounded-full animate-bounce ${isOnline ? 'bg-orange-500' : 'bg-[var(--text-secondary)]'}`}></span>
            </div>
            <p className={`text-xs mt-2 font-semibold transition-colors duration-300 ${isOnline ? 'text-orange-500' : 'text-[var(--text-secondary)]'}`}>
                {isOnline ? 'Ringing...' : 'Calling...'}
            </p>

            <button onClick={cancelCall} className="mt-8 w-full py-3 bg-[var(--bg-surface-hover)] text-[var(--color-danger)] border border-[var(--color-danger)]/20 rounded-2xl font-bold hover:bg-[var(--color-danger)] hover:text-white active:scale-95 transition-all">
                Cancel
            </button>
        </motion.div>
    );
};

export const MinimizedCallBanner = () => {
    const {
        callStatus, remoteUser, isMuted, isSpeakerOn,
        toggleMute, toggleSpeaker, toggleMinimize, endCall
    } = useContext(CallContext) || {};

    const [duration, setDuration] = useState(0);

    useEffect(() => {
        let interval;
        if (callStatus === 'connected') {
            interval = setInterval(() => setDuration(d => d + 1), 1000);
        }
        return () => clearInterval(interval);
    }, [callStatus]);

    const formatTime = (secs) => {
        const m = Math.floor(secs / 60).toString().padStart(2, '0');
        const s = (secs % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    if (!['connecting', 'connected'].includes(callStatus)) return null;

    return (
        <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="w-full bg-[var(--bg-surface)] border-b border-[var(--border-color)] px-4 py-2.5 flex items-center justify-between shrink-0 z-50 pointer-events-auto shadow-md"
        >
            <div onClick={toggleMinimize} className="flex items-center space-x-3 cursor-pointer group">
                <Avatar src={remoteUser?.photoURL} name={remoteUser?.fullName || 'User'} size="sm" isOnline={true} />
                <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-[var(--text-primary)] truncate">
                        {remoteUser?.fullName || 'Active Call'}
                    </span>
                    <span className="text-[10px] font-semibold text-[var(--color-success)]">
                        {callStatus === 'connected' ? formatTime(duration) : 'Connecting...'}
                    </span>
                </div>
            </div>

            <div className="flex items-center space-x-2">
                <button onClick={toggleMute} className={`p-2 rounded-xl transition-all ${isMuted ? 'bg-red-600 text-white' : 'bg-[var(--bg-surface-hover)] text-[var(--text-primary)]'}`} title={isMuted ? "Unmute" : "Mute"}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {isMuted ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z M1 1l22 22" />
                        ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        )}
                    </svg>
                </button>

                <button onClick={toggleSpeaker} className={`p-2 rounded-xl transition-all ${isSpeakerOn ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--bg-surface-hover)] text-[var(--text-secondary)]'}`} title={isSpeakerOn ? "Speaker On" : "Speaker Off"}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    </svg>
                </button>

                <button onClick={toggleMinimize} className="p-2 bg-[var(--bg-surface-hover)] hover:text-[var(--color-primary)] rounded-xl text-[var(--text-primary)] transition-all" title="Maximize">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
                </button>

                <button onClick={endCall} className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all shadow-md" title="End Call">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 15c.66.66 1.48 1.15 2.37 1.44a1.002 1.002 0 001.21-.61l.88-2.65a1.001 1.001 0 00-.47-1.2l-2.02-1.01c-.69-.35-1.52-.08-1.85.62A9.975 9.975 0 014 9c0-.7.31-1.35.84-1.82l2.02-1.01a1.001 1.001 0 00.47-1.2l-.88-2.65a1.002 1.002 0 00-1.21-.61A8.966 8.966 0 003 4.08C3 9.02 7.02 13 11.96 13h.04z" /></svg>
                </button>
            </div>
        </motion.div>
    );
};

const ActiveCallView = ({
    callType, callStatus, remoteUser, localStream, remoteStream,
    isMuted, isCameraEnabled, isSpeakerOn, toggleMute, toggleCamera, toggleSpeaker, endCall, toggleMinimize
}) => {
    const [duration, setDuration] = useState(0);

    useEffect(() => {
        let interval;
        if (callStatus === 'connected') {
            interval = setInterval(() => setDuration(d => d + 1), 1000);
        }
        return () => clearInterval(interval);
    }, [callStatus]);

    const formatTime = (secs) => {
        const m = Math.floor(secs / 60).toString().padStart(2, '0');
        const s = (secs % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`pointer-events-auto flex flex-col relative overflow-hidden bg-black text-white shadow-2xl ${callType === 'video'
                    ? 'w-full h-full sm:w-[800px] sm:h-[600px] sm:max-h-[90vh] sm:rounded-3xl'
                    : 'w-[90%] max-w-[320px] rounded-3xl mx-auto mt-16 sm:mt-24 p-6'
                }`}
        >
            <div className="absolute top-4 left-4 z-20">
                <button onClick={toggleMinimize} className="p-2 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-md transition-all text-white" title="Minimize Call">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                </button>
            </div>

            {callType === 'video' && (
                <div className="absolute inset-0 bg-zinc-900 flex items-center justify-center">
                    {remoteStream && remoteStream.getVideoTracks().length > 0 ? (
                        <VideoTrack stream={remoteStream} isLocal={false} />
                    ) : (
                        <div className="flex flex-col items-center">
                            <Avatar src={remoteUser?.photoURL} name={remoteUser?.fullName || '?'} size="xl" />
                            <p className="mt-4 text-sm text-zinc-400">Waiting for remote video...</p>
                        </div>
                    )}
                </div>
            )}

            {callType === 'video' && isCameraEnabled && localStream && (
                <div className="absolute top-4 right-4 sm:top-6 sm:right-6 w-24 h-36 sm:w-32 sm:h-48 bg-black rounded-xl overflow-hidden shadow-xl ring-2 ring-white/20 z-10">
                    <VideoTrack stream={localStream} isLocal={true} />
                </div>
            )}

            <div className={`relative z-10 flex flex-col items-center ${callType === 'video' ? 'p-6 bg-gradient-to-b from-black/70 to-transparent' : ''}`}>
                {callType === 'audio' && (
                    <Avatar src={remoteUser?.photoURL} name={remoteUser?.fullName || 'User'} size="xl" className="mb-4 shadow-lg ring-4 ring-white/10" />
                )}
                <h2 className="text-xl font-bold tracking-tight text-white drop-shadow-md">
                    {remoteUser?.fullName || 'Unknown User'}
                </h2>
                <p className="text-sm font-medium mt-1 text-white/80 drop-shadow-md">
                    {callStatus === 'connecting' ? 'Connecting...' : formatTime(duration)}
                </p>
            </div>

            {callType === 'video' && <div className="flex-1" />}

            <div className={`relative z-10 flex items-center justify-center space-x-6 w-full ${callType === 'video' ? 'p-8 bg-gradient-to-t from-black/80 to-transparent' : 'mt-8'}`}>
                <button
                    onClick={toggleMute}
                    className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg backdrop-blur-md ${isMuted ? 'bg-red-600 text-white' : 'bg-white/20 text-white hover:bg-white/30'}`}
                    title={isMuted ? "Unmute" : "Mute"}
                >
                    {isMuted ? (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z M1 1l22 22" /></svg>
                    ) : (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                    )}
                </button>

                <button
                    onClick={toggleSpeaker}
                    className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg backdrop-blur-md ${isSpeakerOn ? 'bg-[var(--color-primary)] text-white' : 'bg-white/20 text-white hover:bg-white/30'}`}
                    title={isSpeakerOn ? "Speaker On" : "Speaker Off"}
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    </svg>
                </button>

                {callType === 'video' && (
                    <button
                        onClick={toggleCamera}
                        className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg backdrop-blur-md ${!isCameraEnabled ? 'bg-white text-black' : 'bg-white/20 text-white hover:bg-white/30'}`}
                        title={isCameraEnabled ? "Turn off camera" : "Turn on camera"}
                    >
                        {!isCameraEnabled ? (
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14v-4z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 6h8a2 2 0 012 2v8a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3l18 18" /></svg>
                        ) : (
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                        )}
                    </button>
                )}

                <button
                    onClick={endCall}
                    className="w-16 h-16 rounded-full bg-red-600 text-white flex items-center justify-center hover:bg-red-700 active:scale-95 transition-all shadow-lg shadow-red-500/30"
                    title="End Call"
                >
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 15c.66.66 1.48 1.15 2.37 1.44a1.002 1.002 0 001.21-.61l.88-2.65a1.001 1.001 0 00-.47-1.2l-2.02-1.01c-.69-.35-1.52-.08-1.85.62A9.975 9.975 0 014 9c0-.7.31-1.35.84-1.82l2.02-1.01a1.001 1.001 0 00.47-1.2l-.88-2.65a1.002 1.002 0 00-1.21-.61A8.966 8.966 0 003 4.08C3 9.02 7.02 13 11.96 13h.04z" /></svg>
                </button>
            </div>
        </motion.div>
    );
};

export const BoundGlobalCallManager = () => {
    const context = useContext(CallContext) || {};
    const { callStatus, isMinimized, remoteUser, callType, acceptCall, rejectCall, cancelCall, isMuted, isSpeakerOn, toggleMute, toggleSpeaker, toggleMinimize, endCall, localStream, remoteStream, isCameraEnabled, toggleCamera } = context;

    if (!callStatus || callStatus === 'idle') return null;

    return (
        <>
            {isMinimized && ['connecting', 'connected'].includes(callStatus) ? (
                null
            ) : (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none select-none bg-black/60 backdrop-blur-md">
                    <AnimatePresence mode="wait">
                        {callStatus === 'ringing' && (
                            <IncomingCallView key="incoming" remoteUser={remoteUser} callType={callType} acceptCall={acceptCall} rejectCall={rejectCall} />
                        )}
                        {callStatus === 'calling' && (
                            <OutgoingCallView key="outgoing" remoteUser={remoteUser} callStatus={callStatus} callType={callType} cancelCall={cancelCall} />
                        )}
                        {['connecting', 'connected'].includes(callStatus) && (
                            <ActiveCallView
                                key="active"
                                callStatus={callStatus} callType={callType} remoteUser={remoteUser}
                                localStream={localStream} remoteStream={remoteStream}
                                isMuted={isMuted} isCameraEnabled={isCameraEnabled} isSpeakerOn={isSpeakerOn}
                                toggleMute={toggleMute} toggleCamera={toggleCamera} toggleSpeaker={toggleSpeaker} endCall={endCall} toggleMinimize={toggleMinimize}
                            />
                        )}
                    </AnimatePresence>
                </div>
            )}
        </>
    );
};

export default BoundGlobalCallManager;