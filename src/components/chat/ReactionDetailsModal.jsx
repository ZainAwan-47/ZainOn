// React
import React, { useState, useEffect, memo } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';

// Third Party
import { motion } from 'framer-motion';

// Services & Hooks
import { db } from '../../firebase/firestore';
import { useAuth } from '../../hooks/useAuth';
import { useFriends } from '../../hooks/useFriends';

// Components
import Avatar from '../ui/Avatar';
import PresenceIndicator from '../ui/PresenceIndicator';

// Live Participant Sub-Component to enforce real-time privacy
const LiveReactionParticipant = memo(({ item, currentUserUid, friends }) => {
    const { emoji, uid, participant: initialParticipant } = item;
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
    const onlineStatusEnabled = liveUser.privacy?.onlineStatus !== false;
    const isOnlineEffective = isSelf ? true : (onlineStatusEnabled ? liveUser.isOnline : false);

    const lastSeenSetting = liveUser.privacy?.lastSeen || 'everyone';
    let lastSeenEffective = liveUser.lastSeen;
    if (lastSeenSetting === 'nobody') lastSeenEffective = null;
    else if (lastSeenSetting === 'friends' && !isFriend) lastSeenEffective = null;
    if (isSelf) lastSeenEffective = null; // Don't show last seen for yourself

    return (
        <div className="flex items-center space-x-3 p-2 hover:bg-[var(--bg-surface-hover)] rounded-xl transition-colors">
            <span className="text-2xl drop-shadow-sm shrink-0 leading-none">{emoji}</span>
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
        </div>
    );
});

export const ReactionDetailsModal = memo(({ message, participants = {}, onClose }) => {
    const { user } = useAuth();
    const { friends = [] } = useFriends() || {};

    if (!message) return null;

    // Flatten reactions payload into [ { emoji, uid, participantData }, ... ]
    const reactionList = [];
    const reactionsMap = message.reactions || {};

    Object.entries(reactionsMap).forEach(([emoji, userIds]) => {
        const uniqueIds = Array.from(new Set(userIds));
        uniqueIds.forEach(uid => {
            reactionList.push({
                emoji,
                uid,
                participant: participants[uid] || {}
            });
        });
    });

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
                    <h3 className="text-sm font-bold text-[var(--text-primary)] tracking-tight">Reactions</h3>
                    <button onClick={onClose} className="p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors bg-[var(--bg-surface-hover)] rounded-full cursor-pointer">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-2 scrollbar-thin">
                    {reactionList.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center text-[var(--text-secondary)]">
                            <p className="text-xs font-medium">No reactions on this message.</p>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {reactionList.map((item, idx) => (
                                <LiveReactionParticipant
                                    key={`${item.emoji}-${item.uid}-${idx}`}
                                    item={item}
                                    currentUserUid={user?.uid}
                                    friends={friends}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
});

ReactionDetailsModal.displayName = 'ReactionDetailsModal';
export default ReactionDetailsModal;