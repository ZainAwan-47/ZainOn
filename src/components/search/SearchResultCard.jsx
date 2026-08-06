// React
import React, { useEffect, useState } from 'react';

// Hooks & Services
import { useAuth } from '../../hooks/useAuth';
import { friendService } from '../../services/friendService';

// Components
import Avatar from '../ui/Avatar';
import PresenceIndicator from '../ui/PresenceIndicator';

export const SearchResultCard = ({ user: targetUser, onViewProfile }) => {
    const { user: currentUser } = useAuth();
    const [friendshipStatus, setFriendshipStatus] = useState('NOT_FRIENDS');
    const [activeRequestMeta, setActiveRequestMeta] = useState(null);

    useEffect(() => {
        if (!currentUser?.uid || !targetUser?.uid) return;

        const unsub = friendService.subscribeToFriendshipStatus(
            currentUser.uid,
            targetUser.uid,
            (status, meta) => {
                setFriendshipStatus(status);
                setActiveRequestMeta(meta);
            }
        );

        return () => unsub();
    }, [currentUser?.uid, targetUser?.uid]);

    const handleActionClick = async (e) => {
        e.stopPropagation();
        if (!currentUser?.uid || !targetUser?.uid) return;

        try {
            if (friendshipStatus === 'NOT_FRIENDS') {
                await friendService.sendFriendRequest(currentUser.uid, targetUser.uid);
            } else if (friendshipStatus === 'REQUEST_SENT') {
                await friendService.cancelFriendRequest(currentUser.uid, targetUser.uid);
            } else if (friendshipStatus === 'REQUEST_RECEIVED' && activeRequestMeta?.id) {
                await friendService.acceptFriendRequest(
                    activeRequestMeta.id,
                    targetUser.uid,
                    currentUser.uid
                );
            }
        } catch (err) {
            console.error('[SearchResultCard.handleActionClick]:', err);
        }
    };

    return (
        <div
            onClick={() => onViewProfile && onViewProfile(targetUser)}
            className="p-3 rounded-2xl bg-slate-800/40 hover:bg-slate-800/90 border border-slate-800/80 hover:border-slate-700/60 transition-all duration-150 flex items-center justify-between group space-x-3 cursor-pointer select-none"
        >
            <div className="flex items-center space-x-3 min-w-0 flex-1">
                <Avatar
                    src={targetUser.photoURL}
                    name={targetUser.fullName}
                    size="md"
                    isOnline={targetUser.isOnline}
                />

                <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-xs font-bold text-white truncate group-hover:text-indigo-300 transition-colors">
                        {targetUser.fullName}
                    </span>
                    <span className="text-[11px] font-medium text-slate-400 truncate">
                        @{targetUser.username}
                    </span>

                    {/* Inline Request Info Text */}
                    {friendshipStatus === 'REQUEST_SENT' && (
                        <span className="text-[10px] text-amber-400/90 font-medium mt-0.5">
                            Request sent
                        </span>
                    )}

                    <div className="mt-1">
                        <PresenceIndicator
                            isOnline={targetUser.isOnline}
                            lastSeen={targetUser.lastSeen}
                            size="sm"
                        />
                    </div>
                </div>
            </div>

            {/* Reactive Action Button */}
            <div className="flex items-center space-x-1.5 shrink-0">
                <button
                    type="button"
                    onClick={handleActionClick}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all active:scale-95 focus:outline-none ${friendshipStatus === 'NOT_FRIENDS'
                            ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm'
                            : friendshipStatus === 'REQUEST_SENT'
                                ? 'bg-amber-950/40 text-amber-400 border border-amber-500/40 hover:bg-amber-900/50'
                                : friendshipStatus === 'REQUEST_RECEIVED'
                                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                                    : 'bg-emerald-950/40 border border-emerald-900/50 text-emerald-400 cursor-default'
                        }`}
                >
                    {friendshipStatus === 'NOT_FRIENDS' && 'Add Friend'}
                    {friendshipStatus === 'REQUEST_SENT' && 'Sent'}
                    {friendshipStatus === 'REQUEST_RECEIVED' && 'Accept'}
                    {friendshipStatus === 'FRIENDS' && 'Friends'}
                </button>
            </div>
        </div>
    );
};

export default SearchResultCard;