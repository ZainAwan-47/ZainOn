// React
import React, { useEffect, useRef, useState, memo } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';

// Third Party Libraries
import { motion } from 'framer-motion'; // EXACT FIX: Removed AnimatePresence from inside since parent handles it now

// Services & Hooks
import { db } from '../../firebase/firestore';
import { friendService } from '../../services/friendService';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../context/ToastContext';

// Components
import Avatar from '../ui/Avatar';
import PresenceIndicator from '../ui/PresenceIndicator';
import FriendActionButton from './FriendActionButton';

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

    // Live Target User State
    const [liveTargetUser, setLiveTargetUser] = useState(targetUser);
    const [friendshipStatus, setFriendshipStatus] = useState('NOT_FRIENDS');
    const [loadingAction, setLoadingAction] = useState(false);
    const [isFoF, setIsFoF] = useState(false);

    const isFriend = friendshipStatus === 'FRIENDS';

    // Live Snapshot Listener for Target User
    useEffect(() => {
        if (!targetUser?.uid) return;
        const unsub = onSnapshot(doc(db, 'users', targetUser.uid), (docSnap) => {
            if (docSnap.exists()) {
                setLiveTargetUser({ uid: docSnap.id, ...docSnap.data() });
            }
        });
        return () => unsub();
    }, [targetUser?.uid]);

    // Respect target user's profileVisibility setting LIVE
    const targetVisibility = liveTargetUser?.privacy?.profileVisibility || 'everyone';
    let isRestricted = false;

    if (targetVisibility === 'nobody') {
        isRestricted = true;
    } else if (targetVisibility === 'friends_of_friends' && !isFriend && !isFoF) {
        isRestricted = true;
    }

    useEffect(() => {
        if (!user?.uid || !liveTargetUser?.uid) return () => { };

        const checkFoF = async () => {
            if (targetVisibility === 'friends_of_friends') {
                const result = await friendService.checkIsFriendOfFriend(user.uid, liveTargetUser.uid);
                setIsFoF(result);
            }
        };
        checkFoF();

        const unsub = friendService.subscribeToFriendshipStatus(
            user.uid,
            liveTargetUser.uid,
            (status) => {
                setFriendshipStatus(status);
            }
        );

        return () => unsub();
    }, [user?.uid, liveTargetUser?.uid, targetVisibility]);

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
        if (!user?.uid || !liveTargetUser?.uid) return;

        try {
            setLoadingAction(true);
            await friendService.removeFriend(user.uid, liveTargetUser.uid);
            showToast(`Removed ${liveTargetUser.fullName || 'User'} from friends`, 'info');
            handleCloseModal();
        } catch (error) {
            showToast('Failed to remove friend. Please try again.', 'error');
        } finally {
            setLoadingAction(false);
        }
    };

    if (!liveTargetUser) return null;

    const onlineStatusEnabled = liveTargetUser?.privacy?.onlineStatus !== false;
    const isOnlineEffective = onlineStatusEnabled ? liveTargetUser.isOnline : false;

    const lastSeenSetting = liveTargetUser?.privacy?.lastSeen || 'everyone';
    let lastSeenEffective = liveTargetUser.lastSeen;
    if (lastSeenSetting === 'nobody') {
        lastSeenEffective = null;
    } else if (lastSeenSetting === 'friends' && !isFriend) {
        lastSeenEffective = null;
    }

    // EXACT FIX 2: Replaced the standard <div> with <motion.div> and removed background colors entirely (0 blur/dimness).
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 z-[100] overflow-hidden min-w-0 flex items-center justify-center"
            onClick={handleCloseModal}
        >
            <motion.div
                ref={modalRef}
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                onClick={(e) => e.stopPropagation()}
                className="relative w-[calc(100%-1.5rem)] max-w-[350px] min-w-0 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-3xl p-4 sm:p-5 shadow-2xl flex flex-col space-y-3 sm:space-y-4 max-h-[calc(100%-1.5rem)] overflow-y-auto select-none shrink-0 transition-colors duration-300 scrollbar-thin"
            >
                <button
                    type="button"
                    onClick={handleCloseModal}
                    className="absolute top-3 right-3 sm:top-4 sm:right-4 p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] rounded-full transition-all focus:outline-none active:scale-95 cursor-pointer z-10"
                    title="Close"
                >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <div className="flex flex-col items-center text-center space-y-2 pt-1 min-w-0">
                    <Avatar
                        src={liveTargetUser.photoURL}
                        name={liveTargetUser.fullName || 'User'}
                        size="lg"
                        isOnline={isOnlineEffective}
                    />

                    <div className="flex flex-col items-center space-y-0.5 w-full min-w-0 px-2">
                        <h3 className="text-sm sm:text-base font-bold text-[var(--text-primary)] tracking-tight truncate w-full">
                            {liveTargetUser.fullName || 'User Profile'}
                        </h3>
                        <span className="text-[11px] sm:text-xs text-[var(--color-primary)] font-medium truncate w-full">
                            @{liveTargetUser.username || 'username'}
                        </span>
                    </div>

                    {!isRestricted && (
                        <PresenceIndicator
                            isOnline={isOnlineEffective}
                            lastSeen={lastSeenEffective}
                            size="sm"
                            onlineStatusEnabled={onlineStatusEnabled}
                        />
                    )}
                </div>

                <div className="bg-[var(--bg-main)] border border-[var(--border-color)] rounded-2xl p-3 sm:p-3.5 flex flex-col space-y-1 text-xs min-w-0">
                    <span className="text-[9px] sm:text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                        About User
                    </span>
                    <p className="text-[var(--text-primary)] leading-relaxed break-words text-[11px] sm:text-xs opacity-90">
                        {isRestricted ? 'This profile is private.' : (liveTargetUser.bio || 'No bio provided.')}
                    </p>
                </div>

                {!isRestricted && (
                    <div className="flex flex-col gap-2 pt-1 min-w-0">
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 min-w-0">
                            {onStartChat && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        onStartChat(liveTargetUser);
                                        handleCloseModal();
                                    }}
                                    className="flex-1 py-2 sm:py-2.5 px-3 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white rounded-xl font-semibold text-xs transition-all shadow-md active:scale-95 flex items-center justify-center space-x-1.5 cursor-pointer min-w-0"
                                >
                                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                    <span className="truncate">Message</span>
                                </button>
                            )}

                            <button
                                type="button"
                                onClick={handleCloseModal}
                                className="flex-1 py-2 sm:py-2.5 px-3 bg-[var(--bg-surface-hover)] hover:opacity-90 text-[var(--text-primary)] rounded-xl font-semibold text-xs border border-[var(--border-color)] transition-all active:scale-95 cursor-pointer min-w-0 truncate"
                            >
                                Close
                            </button>
                        </div>

                        <div className="w-full pt-1">
                            {isFriend ? (
                                <button
                                    type="button"
                                    disabled={loadingAction}
                                    onClick={handleRemoveFriend}
                                    className="w-full py-2 sm:py-2.5 px-3 bg-[var(--color-danger)]/10 hover:bg-[var(--color-danger)]/20 text-[var(--color-danger)] border border-[var(--color-danger)]/20 rounded-xl font-semibold text-xs transition-all active:scale-95 flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50 min-w-0"
                                >
                                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6h12a6 6 0 00-6-6zM21 12h-6" />
                                    </svg>
                                    <span className="truncate">
                                        {loadingAction ? 'Removing...' : 'Remove Friend'}
                                    </span>
                                </button>
                            ) : (
                                <FriendActionButton targetUser={liveTargetUser} fullWidth />
                            )}
                        </div>
                    </div>
                )}
            </motion.div>
        </motion.div>
    );
});

ProfilePreviewModal.displayName = 'ProfilePreviewModal';
export default ProfilePreviewModal;