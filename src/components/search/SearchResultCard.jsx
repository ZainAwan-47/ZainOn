// React
import React, { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';

// Hooks & Services
import { db } from '../../firebase/firestore';
import { useAuth } from '../../hooks/useAuth';
import { friendService } from '../../services/friendService';
import { permissionUtils } from '../../utils/permissionUtils';

// Components
import Avatar from '../ui/Avatar';
import PresenceIndicator from '../ui/PresenceIndicator';

export const SearchResultCard = ({ user: targetUser, onViewProfile }) => {
    const { user: currentUser } = useAuth();

    // Live Target User State
    const [liveTargetUser, setLiveTargetUser] = useState(targetUser);
    const [friendshipStatus, setFriendshipStatus] = useState('NOT_FRIENDS');
    const [activeRequestMeta, setActiveRequestMeta] = useState(null);
    const [isFoF, setIsFoF] = useState(false);

    const isFriend = friendshipStatus === 'FRIENDS';

    // Live Snapshot Listener for Target User (Reacts to privacy changes instantly)
    useEffect(() => {
        if (!targetUser?.uid) return;
        const unsub = onSnapshot(doc(db, 'users', targetUser.uid), (docSnap) => {
            if (docSnap.exists()) {
                setLiveTargetUser({ uid: docSnap.id, ...docSnap.data() });
            }
        });
        return () => unsub();
    }, [targetUser?.uid]);

    // Evaluate dynamic restriction logic based on LIVE user data
    const privacyReq = liveTargetUser?.privacy?.friendRequests || 'everyone';
    let isRestricted = false;

    if (privacyReq === 'nobody') {
        isRestricted = true;
    } else if (privacyReq === 'friends_of_friends' && !isFoF) {
        isRestricted = true;
    }

    useEffect(() => {
        if (!currentUser?.uid || !liveTargetUser?.uid) return;

        const checkFoF = async () => {
            if (privacyReq === 'friends_of_friends') {
                const result = await friendService.checkIsFriendOfFriend(currentUser.uid, liveTargetUser.uid);
                setIsFoF(result);
            }
        };
        checkFoF();

        const unsub = friendService.subscribeToFriendshipStatus(
            currentUser.uid,
            liveTargetUser.uid,
            (status, meta) => {
                setFriendshipStatus(status);
                setActiveRequestMeta(meta);
            }
        );

        return () => unsub();
    }, [currentUser?.uid, liveTargetUser?.uid, privacyReq]);

    const handleActionClick = async (e) => {
        e.stopPropagation();
        if (!currentUser?.uid || !liveTargetUser?.uid || isRestricted) return;

        try {
            if (friendshipStatus === 'NOT_FRIENDS') {
                await friendService.sendFriendRequest(currentUser.uid, liveTargetUser.uid);
            } else if (friendshipStatus === 'REQUEST_SENT') {
                await friendService.cancelFriendRequest(currentUser.uid, liveTargetUser.uid);
            } else if (friendshipStatus === 'REQUEST_RECEIVED' && activeRequestMeta?.id) {
                await friendService.acceptFriendRequest(
                    activeRequestMeta.id,
                    liveTargetUser.uid,
                    currentUser.uid
                );
            }
        } catch (err) {
            console.error('[SearchResultCard.handleActionClick]:', err);
        }
    };

    // Issue 4 Fixed: Strangers NEVER see presence data in search cards
    const onlineStatusEnabled = permissionUtils.canViewPresence(currentUser?.uid, liveTargetUser, isFriend);
    const isOnlineEffective = onlineStatusEnabled ? liveTargetUser.isOnline : false;

    const canSeeLastSeen = permissionUtils.canViewLastSeen(currentUser?.uid, liveTargetUser, isFriend);
    const lastSeenEffective = canSeeLastSeen ? liveTargetUser.lastSeen : null;

    return (
        <div
            onClick={() => onViewProfile && onViewProfile(liveTargetUser)}
            className="p-3 rounded-2xl bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-color)] transition-all duration-150 flex items-center justify-between group space-x-3 cursor-pointer select-none shadow-sm"
        >
            <div className="flex items-center space-x-3 min-w-0 flex-1">
                <Avatar
                    src={liveTargetUser.photoURL}
                    name={liveTargetUser.fullName}
                    size="md"
                    isOnline={isOnlineEffective}
                />

                <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-xs font-bold text-[var(--text-primary)] truncate group-hover:text-[var(--color-primary)] transition-colors">
                        {liveTargetUser.fullName}
                    </span>
                    <span className="text-[11px] font-medium text-[var(--text-secondary)] truncate">
                        @{liveTargetUser.username}
                    </span>

                    {friendshipStatus === 'REQUEST_SENT' && (
                        <span className="text-[10px] text-[var(--color-warning)] font-medium mt-0.5">
                            Request sent
                        </span>
                    )}

                    <div className="mt-1">
                        <PresenceIndicator
                            isOnline={isOnlineEffective}
                            lastSeen={lastSeenEffective}
                            size="sm"
                            onlineStatusEnabled={onlineStatusEnabled}
                        />
                    </div>
                </div>
            </div>

            <div className="flex items-center space-x-1.5 shrink-0 relative">
                {isRestricted ? (
                    <div className="relative overflow-hidden rounded-xl group w-full h-full min-w-[76px] min-h-[28px]">
                        <div className="absolute inset-0 bg-[var(--bg-main)]/60 backdrop-blur-[2px] z-10 flex items-center justify-center rounded-xl transition-all duration-300">
                            <svg className="w-4 h-4 text-[var(--text-secondary)] drop-shadow-md" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2C9.243 2 7 4.243 7 7v3H6c-1.103 0-2 .897-2 2v8c0 1.103.897 2 2 2h12c1.103 0 2-.897 2-2v-8c0-1.103-.897-2-2-2h-1V7c0-2.757-2.243-5-5-5zm0 2c1.654 0 3 1.346 3 3v3H9V7c0-1.654 1.346-3 3-3zm-1 11.82V18h2v-2.18c.313-.213.5-.558.5-.94 0-.663-.537-1.2-1.2-1.2-.663 0-1.2.537-1.2 1.2 0 .382.187.727.5.94z" />
                            </svg>
                        </div>
                        <button type="button" disabled className="w-full px-3 py-1.5 bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] rounded-xl border border-[var(--border-color)] text-[11px] font-bold opacity-50 select-none">
                            Add Friend
                        </button>
                    </div>
                ) : (
                    <button
                        type="button"
                        onClick={handleActionClick}
                        className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all active:scale-95 focus:outline-none ${friendshipStatus === 'NOT_FRIENDS'
                            ? 'bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white shadow-sm'
                            : friendshipStatus === 'REQUEST_SENT'
                                ? 'bg-[var(--color-warning)]/10 text-[var(--color-warning)] border border-[var(--color-warning)]/30 hover:bg-[var(--color-warning)]/20'
                                : friendshipStatus === 'REQUEST_RECEIVED'
                                    ? 'bg-[var(--color-success)] hover:opacity-90 text-white'
                                    : 'bg-[var(--color-success)]/10 border border-[var(--color-success)]/30 text-[var(--color-success)] cursor-default'
                            }`}
                    >
                        {friendshipStatus === 'NOT_FRIENDS' && 'Add Friend'}
                        {friendshipStatus === 'REQUEST_SENT' && 'Sent'}
                        {friendshipStatus === 'REQUEST_RECEIVED' && 'Accept'}
                        {friendshipStatus === 'FRIENDS' && 'Friends'}
                    </button>
                )}
            </div>
        </div>
    );
};

export default SearchResultCard;