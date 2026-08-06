// React
import React, { useEffect, useRef, useState, memo } from 'react';

// Third Party Libraries
import { motion, AnimatePresence } from 'framer-motion';

// Services & Hooks
import { friendService } from '../../services/friendService';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../context/ToastContext';

// Components
import Avatar from '../ui/Avatar';
import PresenceIndicator from '../ui/PresenceIndicator';

export const ProfilePreviewModal = memo(({
    targetUser,
    onClose,
    onStartChat,
    isMobile = false,
    onMobileClose,
}) => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const modalRef = useRef(null);

    const [friendshipStatus, setFriendshipStatus] = useState('NOT_FRIENDS');
    const [loadingAction, setLoadingAction] = useState(false);

    // Subscribe to real-time friendship status doc
    useEffect(() => {
        if (!user?.uid || !targetUser?.uid) return () => { };

        const unsub = friendService.subscribeToFriendshipStatus(
            user.uid,
            targetUser.uid,
            (status) => {
                setFriendshipStatus(status);
            }
        );

        return () => unsub();
    }, [user?.uid, targetUser?.uid]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                handleCloseModal();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    const handleCloseModal = () => {
        onClose();
        if (isMobile && onMobileClose) {
            onMobileClose();
        }
    };

    const handleRemoveFriend = async () => {
        if (!user?.uid || !targetUser?.uid) return;

        try {
            setLoadingAction(true);
            await friendService.removeFriend(user.uid, targetUser.uid);
            showToast(`Removed ${targetUser.fullName || 'User'} from friends`, 'info');
            handleCloseModal();
        } catch (error) {
            showToast('Failed to remove friend. Please try again.', 'error');
        } finally {
            setLoadingAction(false);
        }
    };

    if (!targetUser) return null;

    const isFriend = friendshipStatus === 'FRIENDS';

    return (
        <AnimatePresence>
            <div
                className="absolute inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-hidden min-w-0"
                onClick={handleCloseModal}
            >
                <motion.div
                    ref={modalRef}
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full max-w-[380px] min-w-0 bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-2xl flex flex-col space-y-3.5 sm:space-y-4 relative max-h-[calc(100%-1.5rem)] overflow-y-auto select-none my-auto"
                >
                    {/* Close Button */}
                    <button
                        type="button"
                        onClick={handleCloseModal}
                        className="absolute top-3 right-3 sm:top-4 sm:right-4 p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-all focus:outline-none active:scale-95 cursor-pointer z-10"
                        title="Close"
                    >
                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    {/* Profile Header */}
                    <div className="flex flex-col items-center text-center space-y-2 pt-1 min-w-0">
                        <Avatar
                            src={targetUser.photoURL}
                            name={targetUser.fullName || 'User'}
                            size="lg"
                            isOnline={targetUser.isOnline}
                        />

                        <div className="flex flex-col items-center space-y-0.5 w-full min-w-0 px-2">
                            <h3 className="text-sm sm:text-base font-bold text-white tracking-tight truncate w-full">
                                {targetUser.fullName || 'User Profile'}
                            </h3>
                            <span className="text-[11px] sm:text-xs text-indigo-400 font-medium truncate w-full">
                                @{targetUser.username || 'username'}
                            </span>
                        </div>

                        <PresenceIndicator
                            isOnline={targetUser.isOnline}
                            lastSeen={targetUser.lastSeen}
                            size="sm"
                        />
                    </div>

                    {/* User Bio Box */}
                    <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3 sm:p-3.5 flex flex-col space-y-1 text-xs min-w-0">
                        <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                            About User
                        </span>
                        <p className="text-slate-300 leading-relaxed break-words text-[11px] sm:text-xs">
                            {targetUser.bio || 'No bio provided.'}
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-2 pt-1 min-w-0">
                        <div className="flex items-center gap-2">
                            {onStartChat && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        onStartChat(targetUser);
                                        handleCloseModal();
                                    }}
                                    className="flex-1 py-2 sm:py-2.5 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold text-xs transition-all shadow-md active:scale-95 flex items-center justify-center space-x-1.5 cursor-pointer min-w-0"
                                >
                                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                    <span className="truncate">Message</span>
                                </button>
                            )}

                            <button
                                type="button"
                                onClick={handleCloseModal}
                                className="flex-1 py-2 sm:py-2.5 px-3 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-xl font-semibold text-xs border border-slate-700/60 transition-all active:scale-95 cursor-pointer min-w-0 truncate"
                            >
                                Close
                            </button>
                        </div>

                        {isFriend && (
                            <button
                                type="button"
                                disabled={loadingAction}
                                onClick={handleRemoveFriend}
                                className="w-full py-2 sm:py-2.5 px-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl font-semibold text-xs transition-all active:scale-95 flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
                            >
                                <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6h12a6 6 0 00-6-6zM21 12h-6" />
                                </svg>
                                <span>{loadingAction ? 'Removing...' : 'Remove Friend'}</span>
                            </button>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
});

ProfilePreviewModal.displayName = 'ProfilePreviewModal';
export default ProfilePreviewModal;