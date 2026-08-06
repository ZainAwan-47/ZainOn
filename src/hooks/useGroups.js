// React
import { useState, useEffect, useCallback } from 'react';

// Services & Hooks
import { useAuth } from './useAuth';
import { groupService } from '../services/groupService';

export const useGroups = () => {
    const { user } = useAuth();
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user?.uid) {
            setGroups([]);
            setLoading(false);
            return () => { };
        }

        setLoading(true);
        const unsubscribe = groupService.subscribeToUserGroups(user.uid, (fetchedGroups) => {
            setGroups(fetchedGroups);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user?.uid]);

    const createGroup = useCallback(
        async ({ name, description, avatar, selectedFriends }) => {
            if (!user) return null;
            return await groupService.createGroup({
                name,
                description,
                avatar,
                owner: user,
                selectedFriends,
            });
        },
        [user]
    );

    return {
        groups,
        loading,
        createGroup,
    };
};

export default useGroups;