// React
import React, { memo } from 'react';

// Third Party
import { motion } from 'framer-motion';

// Services & Hooks
import { useAuth } from '../../hooks/useAuth';

// Components
import Avatar from '../ui/Avatar';

export const SeenByModal = memo(({ message, participants = {}, onClose }) => {
    const { user } = useAuth();

    if (!message) return null;

    // Filter out the sender and strictly deduplicate the read receipts list
    const seenByUids = Array.from(new Set(message.seenBy || [])).filter(uid => uid !== message.senderId);

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
                    <h3 className="text-sm font-bold text-white tracking-tight">Seen By</h3>
                    <button onClick={onClose} className="p-1 text-slate-400 hover:text-white transition-colors bg-slate-800/50 hover:bg-slate-800 rounded-full cursor-pointer">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-2 scrollbar-thin">
                    {seenByUids.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 px-4 text-center space-y-2 text-slate-400">
                            <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                            <p className="text-xs font-medium">No members have seen this message yet.</p>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {seenByUids.map(uid => {
                                const isSelf = uid === user?.uid;
                                const participant = participants[uid] || {};
                                const displayName = isSelf ? 'You' : (participant.fullName || 'Unknown User');

                                return (
                                    <div key={uid} className="flex items-center space-x-3 p-2 hover:bg-slate-800/50 rounded-xl transition-colors">
                                        <Avatar src={participant.photoURL} name={displayName} size="sm" isOnline={participant.isOnline} />
                                        <div className="flex flex-col min-w-0 flex-1">
                                            <span className="text-xs font-bold text-white truncate">{displayName}</span>
                                            <span className="text-[10px] text-slate-400 truncate">@{participant.username || 'user'}</span>
                                        </div>
                                        <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
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

SeenByModal.displayName = 'SeenByModal';
export default SeenByModal;