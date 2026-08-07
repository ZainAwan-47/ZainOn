// React
import React, { memo } from 'react';

// Third Party
import { motion } from 'framer-motion';

// Services & Hooks
import { useAuth } from '../../hooks/useAuth';

// Components
import Avatar from '../ui/Avatar';

export const ReactionDetailsModal = memo(({ message, participants = {}, onClose }) => {
    const { user } = useAuth();

    if (!message) return null;

    // Flatten reactions payload into [ { emoji, uid, participantData }, ... ]
    const reactionList = [];
    const reactionsMap = message.reactions || {};

    Object.entries(reactionsMap).forEach(([emoji, userIds]) => {
        // Deduplicate just in case
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
            // FIX: Changed from 'fixed' to 'absolute' to keep it scoped inside ChatRoom
            className="absolute inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4 select-none"
            onClick={onClose}
        >
            <motion.div
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 100 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full sm:w-[320px] max-h-[70vh] bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden relative"
            >
                <div className="flex items-center justify-between p-4 border-b border-slate-800 shrink-0">
                    <h3 className="text-sm font-bold text-white tracking-tight">Reactions</h3>
                    <button onClick={onClose} className="p-1 text-slate-400 hover:text-white transition-colors bg-slate-800/50 hover:bg-slate-800 rounded-full cursor-pointer">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-2 scrollbar-thin">
                    {reactionList.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center text-slate-400">
                            <p className="text-xs font-medium">No reactions on this message.</p>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {reactionList.map((item, idx) => {
                                const isSelf = item.uid === user?.uid;
                                const displayName = isSelf ? 'You' : (item.participant.fullName || 'Unknown User');

                                return (
                                    <div key={`${item.emoji}-${item.uid}-${idx}`} className="flex items-center space-x-3 p-2 hover:bg-slate-800/50 rounded-xl transition-colors">
                                        <span className="text-2xl drop-shadow-sm shrink-0 leading-none">{item.emoji}</span>
                                        <Avatar src={item.participant.photoURL} name={displayName} size="sm" isOnline={item.participant.isOnline} />
                                        <div className="flex flex-col min-w-0 flex-1">
                                            <span className="text-xs font-bold text-white truncate">{displayName}</span>
                                            <span className="text-[10px] text-slate-400 truncate">@{item.participant.username || 'user'}</span>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
});

ReactionDetailsModal.displayName = 'ReactionDetailsModal';
export default ReactionDetailsModal;