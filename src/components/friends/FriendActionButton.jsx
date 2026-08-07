// React
import React, { useState, useEffect, memo } from 'react';

// Hooks & Services
import { useAuth } from '../../hooks/useAuth';
import { friendService } from '../../services/friendService';
import { useToast } from '../../context/ToastContext';

export const FriendActionButton = memo(({ targetUser, fullWidth = false }) => {
    const { user } = useAuth();
    const { showToast } = useToast();

    const [status, setStatus] = useState('NOT_FRIENDS');
    const [loading, setLoading] = useState(false);
    const [isFoF, setIsFoF] = useState(false);

    // Evaluate dynamic restriction logic
    const privacyReq = targetUser?.privacy?.friendRequests || 'everyone';
    let isRestricted = false;

    if (privacyReq === 'nobody') {
        isRestricted = true;
    } else if (privacyReq === 'friends_of_friends' && !isFoF) {
        isRestricted = true;
    }

    useEffect(() => {
        if (!user?.uid || !targetUser?.uid) return () => { };

        const checkFoF = async () => {
            if (privacyReq === 'friends_of_friends') {
                const result = await friendService.checkIsFriendOfFriend(user.uid, targetUser.uid);
                setIsFoF(result);
            }
        };
        checkFoF();

        const unsub = friendService.subscribeToFriendshipStatus(
            user.uid,
            targetUser.uid,
            (newStatus) => {
                setStatus(newStatus);
            }
        );

        return () => unsub();
    }, [user?.uid, targetUser?.uid, privacyReq]);

    const handleSendRequest = async (e) => {
        e.stopPropagation();
        if (!user?.uid || !targetUser?.uid || loading || isRestricted) return;

        try {
            setLoading(true);
            await friendService.sendFriendRequest(user.uid, targetUser.uid);
            showToast(`Friend request sent to ${targetUser.fullName || 'User'}`, 'info');
        } catch (error) {
            showToast(error.message || 'Failed to send friend request.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleCancelRequest = async (e) => {
        e.stopPropagation();
        if (!user?.uid || !targetUser?.uid || loading) return;

        try {
            setLoading(true);
            await friendService.cancelFriendRequest(user.uid, targetUser.uid);
            showToast('Friend request cancelled.', 'info');
        } catch (error) {
            showToast('Failed to cancel friend request.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const containerClasses = fullWidth ? 'w-full' : '';

    if (status === 'FRIENDS') {
        return (
            <div className={containerClasses}>
                <span className="w-full py-2 px-3 rounded-xl bg-[var(--color-success)]/10 border border-[var(--color-success)]/20 text-[var(--color-success)] text-xs font-bold flex items-center justify-center space-x-1 select-none">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Friends</span>
                </span>
            </div>
        );
    }

    if (status === 'REQUEST_SENT') {
        return (
            <div className={containerClasses}>
                <button
                    type="button"
                    disabled={loading}
                    onClick={handleCancelRequest}
                    className="w-full py-2 px-3 bg-[var(--color-warning)]/10 hover:bg-[var(--color-warning)]/20 text-[var(--color-warning)] border border-[var(--color-warning)]/20 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer disabled:opacity-50 select-none flex items-center justify-center"
                    title="Click to cancel request"
                >
                    {loading ? 'Cancelling...' : 'Sent'}
                </button>
            </div>
        );
    }

    if (status === 'REQUEST_RECEIVED') {
        return (
            <div className={containerClasses}>
                <span className="w-full py-2 px-3 rounded-xl bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 text-[var(--color-primary)] text-xs font-bold select-none flex items-center justify-center">
                    Request Pending
                </span>
            </div>
        );
    }

    // Locked Blurred Overlay UI
    if (isRestricted) {
        return (
            <div className={`relative ${containerClasses} overflow-hidden rounded-xl group`}>
                <div className="absolute inset-0 bg-[var(--bg-main)]/60 backdrop-blur-[2px] z-10 flex items-center justify-center rounded-xl transition-all duration-300">
                    <svg className="w-4 h-4 text-[var(--text-secondary)] drop-shadow-md" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C9.243 2 7 4.243 7 7v3H6c-1.103 0-2 .897-2 2v8c0 1.103.897 2 2 2h12c1.103 0 2-.897 2-2v-8c0-1.103-.897-2-2-2h-1V7c0-2.757-2.243-5-5-5zm0 2c1.654 0 3 1.346 3 3v3H9V7c0-1.654 1.346-3 3-3zm-1 11.82V18h2v-2.18c.313-.213.5-.558.5-.94 0-.663-.537-1.2-1.2-1.2-.663 0-1.2.537-1.2 1.2 0 .382.187.727.5.94z" />
                    </svg>
                </div>
                <button
                    type="button"
                    disabled
                    className="w-full py-2 px-3 bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] rounded-xl border border-[var(--border-color)] text-xs font-bold opacity-50 select-none flex items-center justify-center"
                >
                    Add Friend
                </button>
            </div>
        );
    }

    return (
        <div className={containerClasses}>
            <button
                type="button"
                disabled={loading}
                onClick={handleSendRequest}
                className="w-full py-2 px-3 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50 select-none flex items-center justify-center space-x-1.5"
            >
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                <span>{loading ? 'Sending...' : 'Add Friend'}</span>
            </button>
        </div>
    );
});

FriendActionButton.displayName = 'FriendActionButton';
export default FriendActionButton;