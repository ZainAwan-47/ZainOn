// React
import React, { useState, useEffect, memo } from 'react';

// Hooks & Services
import { useAuth } from '../../hooks/useAuth';
import { friendService } from '../../services/friendService';
import { useToast } from '../../context/ToastContext';

export const FriendActionButton = memo(({ targetUser }) => {
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

    if (status === 'FRIENDS') {
        return (
            <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center space-x-1 select-none">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                </svg>
                <span>Friends</span>
            </span>
        );
    }

    if (status === 'REQUEST_SENT') {
        return (
            <button
                type="button"
                disabled={loading}
                onClick={handleCancelRequest}
                className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer disabled:opacity-50 select-none"
                title="Click to cancel request"
            >
                {loading ? 'Cancelling...' : 'Sent'}
            </button>
        );
    }

    if (status === 'REQUEST_RECEIVED') {
        return (
            <span className="px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-bold select-none">
                Request Pending
            </span>
        );
    }

    return (
        <button
            type="button"
            disabled={loading}
            onClick={handleSendRequest}
            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50 select-none"
        >
            {loading ? 'Sending...' : 'Add Friend'}
        </button>
    );
});

FriendActionButton.displayName = 'FriendActionButton';
export default FriendActionButton;