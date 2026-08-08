// React
import React, { useState, useEffect, memo } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';

// Third Party
import { motion, AnimatePresence } from 'framer-motion';

// Services & Hooks
import { db } from '../../firebase/firestore';
import { useAuth } from '../../hooks/useAuth';
import { useFriends } from '../../hooks/useFriends';

// Components
import Avatar from '../ui/Avatar';
import PresenceIndicator from '../ui/PresenceIndicator';

// Helper to format Firebase timestamps into subtle time strings (e.g., "10:42 AM")
const formatTickTime = (ts) => {
    if (!ts) return '';
    const date = typeof ts.toDate === 'function' ? ts.toDate() : new Date(ts);
    if (isNaN(date)) return '';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// Live Participant Sub-Component to enforce real-time privacy
const LiveParticipantRow = memo(({ uid, initialParticipant, currentUserUid, friends, status, timestamp }) => {
    const isSelf = uid === currentUserUid;
    const [liveUser, setLiveUser] = useState(initialParticipant || {});

    // Attach real-time snapshot for this specific member
    useEffect(() => {
        if (isSelf) return;
        const unsub = onSnapshot(doc(db, 'users', uid), (snap) => {
            if (snap.exists()) setLiveUser({ ...snap.data(), uid: snap.id });
        });
        return () => unsub();
    }, [isSelf, uid]);

    const displayName = isSelf ? 'You' : (liveUser.fullName || 'Unknown User');

    // Strict Privacy Logic
    const isFriend = friends.some(f => (f.uid || f.id) === uid);

    // Is the user ACTUALLY online? (Used strictly for logic, regardless of privacy settings)
    const isActuallyOnline = isSelf ? true : liveUser.isOnline;

    // Does the user want others to SEE they are online? (Used for UI rendering)
    const onlineStatusEnabled = liveUser.privacy?.onlineStatus !== false;
    const isOnlineEffective = isSelf ? true : (onlineStatusEnabled ? liveUser.isOnline : false);

    // Visibility Rule: 
    // - If they have seen it, always show them.
    // - If it's just delivered, only show them if they are ACTUALLY online right now.
    const shouldShow = status === 'seen' || (status === 'delivered' && isActuallyOnline);

    const lastSeenSetting = liveUser.privacy?.lastSeen || 'everyone';
    let lastSeenEffective = liveUser.lastSeen;
    if (lastSeenSetting === 'nobody') lastSeenEffective = null;
    else if (lastSeenSetting === 'friends' && !isFriend) lastSeenEffective = null;
    if (isSelf) lastSeenEffective = null; // Don't show last seen for yourself

    const isSeen = status === 'seen';
    // Green single tick for seen, Orange single tick for delivered
    const tickColor = isSeen ? 'text-[var(--color-success)]' : 'text-[var(--color-warning)]';
    const timeString = formatTickTime(timestamp);

    return (
        <AnimatePresence initial={false}>
            {shouldShow && (
                <motion.div
                    layout
                    initial={{ opacity: 0, height: 0, scale: 0.95 }}
                    animate={{ opacity: 1, height: 'auto', scale: 1 }}
                    exit={{ opacity: 0, height: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                >
                    <div className="flex items-center space-x-3 p-2 hover:bg-[var(--bg-surface-hover)] rounded-xl transition-colors">
                        <Avatar src={liveUser.photoURL} name={displayName} size="sm" isOnline={isOnlineEffective} />
                        <div className="flex flex-col min-w-0 flex-1">
                            <span className="text-xs font-bold text-[var(--text-primary)] truncate">{displayName}</span>
                            <span className="text-[10px] text-[var(--text-secondary)] truncate">@{liveUser.username || 'user'}</span>
                            <div className="mt-0.5">
                                <PresenceIndicator
                                    isOnline={isOnlineEffective}
                                    lastSeen={lastSeenEffective}
                                    size="sm"
                                    onlineStatusEnabled={onlineStatusEnabled}
                                />
                            </div>
                        </div>
                        <div className="shrink-0 flex items-center justify-center space-x-1.5">
                            {timeString && (
                                <span className="text-[9px] font-medium text-[var(--text-secondary)] opacity-60 tracking-wider">
                                    {timeString}
                                </span>
                            )}
                            <svg className={`w-4 h-4 ${tickColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
});

export const SeenByModal = memo(({ message, participants = {}, onClose }) => {
    const { user } = useAuth();
    const { friends = [] } = useFriends() || {};

    // Live Message State for Real-Time Read/Delivered Updates
    const [liveMessage, setLiveMessage] = useState(message);

    useEffect(() => {
        if (!message?.id || !message?.conversationId) return;
        const unsub = onSnapshot(doc(db, 'conversations', message.conversationId, 'messages', message.id), (snap) => {
            if (snap.exists()) {
                setLiveMessage({ id: snap.id, ...snap.data() });
            }
        });
        return () => unsub();
    }, [message?.id, message?.conversationId]);

    if (!liveMessage) return null;

    // Filter out the sender and strictly deduplicate the read receipts list
    const seenByUids = Array.from(new Set(liveMessage.seenBy || [])).filter(uid => uid !== liveMessage.senderId);

    // Delivered To: Everyone in participants who isn't the sender AND hasn't seen it yet
    const deliveredToUids = Object.keys(participants).filter(
        uid => uid !== liveMessage.senderId && !seenByUids.includes(uid)
    );

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4 select-none"
            onClick={onClose}
        >
            <motion.div
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 100 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full sm:w-[320px] max-h-[70vh] bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden relative"
            >
                <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)] shrink-0">
                    <h3 className="text-sm font-bold text-[var(--text-primary)] tracking-tight">Message Info</h3>
                    <button onClick={onClose} className="p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors bg-[var(--bg-surface-hover)] rounded-full cursor-pointer">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-2 scrollbar-thin space-y-3 pb-4">

                    {/* READ BY SECTION */}
                    <div className="bg-[var(--bg-main)] rounded-2xl p-2 border border-[var(--border-color)]/50">
                        <div className="px-2 pb-1.5 pt-1 flex items-center space-x-2 border-b border-[var(--border-color)]/50 mb-1">
                            <svg className="w-3.5 h-3.5 text-[var(--color-success)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                            <span className="text-[10px] font-extrabold text-[var(--text-secondary)] uppercase tracking-wider">Read By</span>
                        </div>

                        <div className="space-y-0.5">
                            <AnimatePresence initial={false}>
                                {seenByUids.length === 0 ? (
                                    <motion.div
                                        layout
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="py-3 px-2 text-xs text-center text-[var(--text-secondary)] font-medium italic opacity-70"
                                    >
                                        No one has read this yet.
                                    </motion.div>
                                ) : (
                                    seenByUids.map(uid => (
                                        <LiveParticipantRow
                                            key={`seen-${uid}`}
                                            uid={uid}
                                            status="seen"
                                            initialParticipant={participants[uid]}
                                            currentUserUid={user?.uid}
                                            friends={friends}
                                            // Fallback to message creation time if exact read time map doesn't exist
                                            timestamp={liveMessage.seenAt?.[uid] || liveMessage.createdAt}
                                        />
                                    ))
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* DELIVERED TO SECTION */}
                    <div className="bg-[var(--bg-main)] rounded-2xl p-2 border border-[var(--border-color)]/50">
                        <div className="px-2 pb-1.5 pt-1 flex items-center space-x-2 border-b border-[var(--border-color)]/50 mb-1">
                            <svg className="w-3.5 h-3.5 text-[var(--color-warning)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                            <span className="text-[10px] font-extrabold text-[var(--text-secondary)] uppercase tracking-wider">Delivered To</span>
                        </div>

                        <div className="space-y-0.5">
                            <AnimatePresence initial={false}>
                                {deliveredToUids.length === 0 ? (
                                    <motion.div
                                        layout
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="py-3 px-2 text-center flex items-center justify-center"
                                    >
                                        <span className="text-xl font-bold text-[var(--text-secondary)] opacity-30">-</span>
                                    </motion.div>
                                ) : (
                                    deliveredToUids.map(uid => (
                                        <LiveParticipantRow
                                            key={`del-${uid}`}
                                            uid={uid}
                                            status="delivered"
                                            initialParticipant={participants[uid]}
                                            currentUserUid={user?.uid}
                                            friends={friends}
                                            timestamp={liveMessage.createdAt}
                                        />
                                    ))
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                </div>
            </motion.div>
        </motion.div>
    );
});

SeenByModal.displayName = 'SeenByModal';
export default SeenByModal;