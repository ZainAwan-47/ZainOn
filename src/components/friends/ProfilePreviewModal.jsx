// React
import React, { useEffect, useState } from 'react';

// Hooks & Services
import { useAuth } from '../../hooks/useAuth';
import { friendService } from '../../services/friendService';

// Components
import Avatar from '../ui/Avatar';
import PresenceIndicator from '../ui/PresenceIndicator';
import IconButton from '../ui/IconButton';

export const ProfilePreviewModal = ({ targetUser, onClose, onStartChat }) => {
    const { user: currentUser } = useAuth();
    const [friendshipStatus, setFriendshipStatus] = useState('NOT_FRIENDS');
    const [activeRequestMeta, setActiveRequestMeta] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

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

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    if (!targetUser) return null;

    const handleSendRequest = async () => {
        setIsProcessing(true);
        setErrorMessage('');
        try {
            await friendService.sendFriendRequest(currentUser.uid, targetUser.uid);
        } catch (err) {
            setErrorMessage(err.message || 'Failed to send request.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleCancelRequest = async () => {
        setIsProcessing(true);
        setErrorMessage('');
        try {
            await friendService.cancelFriendRequest(currentUser.uid, targetUser.uid);
        } catch (err) {
            setErrorMessage(err.message || 'Failed to cancel request.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleAcceptRequest = async () => {
        if (!activeRequestMeta?.id) return;
        setIsProcessing(true);
        setErrorMessage('');
        try {
            await friendService.acceptFriendRequest(
                activeRequestMeta.id,
                targetUser.uid,
                currentUser.uid
            );
        } catch (err) {
            setErrorMessage(err.message || 'Failed to accept request.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDeclineRequest = async () => {
        if (!activeRequestMeta?.id) return;
        setIsProcessing(true);
        setErrorMessage('');
        try {
            await friendService.declineFriendRequest(activeRequestMeta.id);
        } catch (err) {
            setErrorMessage(err.message || 'Failed to decline request.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleRemoveFriend = async () => {
        setIsProcessing(true);
        setErrorMessage('');
        try {
            await friendService.removeFriend(currentUser.uid, targetUser.uid);
        } catch (err) {
            setErrorMessage(err.message || 'Failed to remove friend.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm select-none">
            <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 relative flex flex-col items-center text-center animate-auth-card">
                {/* Close Button */}
                <div className="absolute top-4 right-4">
                    <IconButton onClick={onClose} title="Close Profile" size="sm">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </IconButton>
                </div>

                {/* Avatar */}
                <div className="mb-3 mt-2">
                    <Avatar
                        src={targetUser.photoURL}
                        name={targetUser.fullName}
                        size="lg"
                        isOnline={targetUser.isOnline}
                    />
                </div>

                {/* Name & Username */}
                <h3 className="text-lg font-extrabold text-white tracking-tight">
                    {targetUser.fullName}
                </h3>
                <span className="text-xs font-semibold text-slate-400">
                    @{targetUser.username}
                </span>

                {/* Realtime Presence */}
                <div className="mt-2 mb-4">
                    <PresenceIndicator
                        isOnline={targetUser.isOnline}
                        lastSeen={targetUser.lastSeen}
                        size="md"
                    />
                </div>

                {/* Bio */}
                {targetUser.bio && (
                    <p className="text-xs text-slate-300 bg-slate-800/50 p-3 rounded-2xl border border-slate-700/40 mb-4 w-full leading-relaxed">
                        &ldquo;{targetUser.bio}&rdquo;
                    </p>
                )}

                {/* Error Notification */}
                {errorMessage && (
                    <p className="text-[11px] text-rose-400 bg-rose-950/40 p-2 rounded-xl border border-rose-900/60 mb-3 w-full">
                        {errorMessage}
                    </p>
                )}

                {/* Contextual Info Banner */}
                {friendshipStatus === 'REQUEST_SENT' && (
                    <div className="w-full p-2.5 mb-3 rounded-xl bg-amber-950/30 border border-amber-900/50 text-amber-300 text-xs flex items-center justify-center space-x-2">
                        <svg className="w-4 h-4 shrink-0 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Friend request sent. Waiting for response...</span>
                    </div>
                )}

                {friendshipStatus === 'REQUEST_RECEIVED' && (
                    <div className="w-full p-2.5 mb-3 rounded-xl bg-indigo-950/30 border border-indigo-900/50 text-indigo-300 text-xs flex items-center justify-center space-x-2">
                        <svg className="w-4 h-4 shrink-0 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                        <span>This user sent you a friend request.</span>
                    </div>
                )}

                {/* Dynamic Action Buttons */}
                <div className="w-full pt-1 space-y-2">
                    {friendshipStatus === 'NOT_FRIENDS' && (
                        <button
                            type="button"
                            onClick={handleSendRequest}
                            disabled={isProcessing}
                            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50"
                        >
                            {isProcessing ? 'Sending...' : 'Add Friend'}
                        </button>
                    )}

                    {friendshipStatus === 'REQUEST_SENT' && (
                        <button
                            type="button"
                            onClick={handleCancelRequest}
                            disabled={isProcessing}
                            className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/30 font-bold text-xs rounded-xl transition-all active:scale-95 disabled:opacity-50"
                        >
                            {isProcessing ? 'Cancelling...' : 'Cancel Friend Request'}
                        </button>
                    )}

                    {friendshipStatus === 'REQUEST_RECEIVED' && (
                        <div className="flex space-x-2 w-full">
                            <button
                                type="button"
                                onClick={handleAcceptRequest}
                                disabled={isProcessing}
                                className="flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50"
                            >
                                Accept
                            </button>
                            <button
                                type="button"
                                onClick={handleDeclineRequest}
                                disabled={isProcessing}
                                className="flex-1 py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-rose-400 border border-rose-900/40 font-bold text-xs rounded-xl transition-all active:scale-95 disabled:opacity-50"
                            >
                                Decline
                            </button>
                        </div>
                    )}

                    {friendshipStatus === 'FRIENDS' && (
                        <>
                            <button
                                type="button"
                                onClick={() => onStartChat && onStartChat(targetUser)}
                                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center space-x-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                                <span>Start Chat</span>
                            </button>

                            <button
                                type="button"
                                onClick={handleRemoveFriend}
                                disabled={isProcessing}
                                className="w-full py-2 px-4 bg-slate-800 hover:bg-rose-950/30 text-slate-400 hover:text-rose-400 border border-slate-700/60 font-semibold text-[11px] rounded-xl transition-all active:scale-95 disabled:opacity-50"
                            >
                                Remove Friend
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProfilePreviewModal;