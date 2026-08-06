// React
import { useState, useEffect, useRef } from 'react';

// Services & Context
import { friendService } from '../services/friendService';
import { useAuth } from './useAuth';
import { useToast } from '../context/ToastContext';

export const useFriends = () => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [friends, setFriends] = useState([]);
    const [incomingRequests, setIncomingRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    // Track previous request count to trigger toast alerts for incoming requests
    const prevIncomingCountRef = useRef(0);

    useEffect(() => {
        if (!user?.uid) {
            setFriends([]);
            setIncomingRequests([]);
            setLoading(false);
            return;
        }

        setLoading(true);

        const unsubFriends = friendService.subscribeToFriends(user.uid, (data) => {
            setFriends(data);
            setLoading(false);
        });

        const unsubIncoming = friendService.subscribeToIncomingRequests(user.uid, (data) => {
            if (data.length > prevIncomingCountRef.current && prevIncomingCountRef.current !== 0) {
                const newest = data[0];
                showToast(
                    `New friend request from ${newest.senderProfile?.fullName || 'a user'}`,
                    'info'
                );
            }
            prevIncomingCountRef.current = data.length;
            setIncomingRequests(data);
        });

        return () => {
            unsubFriends();
            unsubIncoming();
        };
    }, [user?.uid, showToast]);

    const sendRequest = async (targetUid, targetName = 'User') => {
        try {
            await friendService.sendFriendRequest(user.uid, targetUid);
            showToast(`Friend request sent to ${targetName}`, 'success');
        } catch (err) {
            showToast(err.message || 'Failed to send friend request.', 'error');
        }
    };

    const cancelRequest = async (targetUid) => {
        try {
            await friendService.cancelFriendRequest(user.uid, targetUid);
            showToast('Friend request cancelled', 'info');
        } catch (err) {
            showToast(err.message || 'Failed to cancel request.', 'error');
        }
    };

    const acceptRequest = async (requestId, senderUid, senderName = 'User') => {
        try {
            await friendService.acceptFriendRequest(requestId, senderUid, user.uid);
            showToast(`You are now friends with ${senderName}!`, 'success');
        } catch (err) {
            showToast(err.message || 'Failed to accept friend request.', 'error');
        }
    };

    const declineRequest = async (requestId) => {
        try {
            await friendService.declineFriendRequest(requestId);
            showToast('Friend request declined', 'info');
        } catch (err) {
            showToast(err.message || 'Failed to decline request.', 'error');
        }
    };

    const removeFriend = async (targetUid, targetName = 'User') => {
        try {
            await friendService.removeFriend(user.uid, targetUid);
            showToast(`Removed ${targetName} from friends`, 'info');
        } catch (err) {
            showToast(err.message || 'Failed to remove friend.', 'error');
        }
    };

    return {
        friends,
        incomingRequests,
        loading,
        sendRequest,
        cancelRequest,
        acceptRequest,
        declineRequest,
        removeFriend,
    };
};

export default useFriends;