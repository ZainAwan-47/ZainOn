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

    useEffect(() => {
        if (!user?.uid || !targetUser?.uid) return () => { };

        const unsub = friendService.subscribeToFriendshipStatus(
            user.uid,
            targetUser.uid,
            (newStatus) => {
                setStatus(newStatus);
            }
        );

        return () => unsub();
    }, [user?.uid, targetUser?.uid]);

    const handleSendRequest = async (e) => {
        e.stopPropagation();
        if (!user?.uid || !targetUser?.uid || loading) return;

        try {
            setLoading(true);
            await friendService.sendFriendRequest(user.uid, targetUser.uid);
            showToast(`Friend request sent to ${targetUser.fullName || 'User'}`, 'info');
        } catch (error) {
            showToast('Failed to send friend request.', 'error');
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