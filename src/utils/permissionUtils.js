// Shared Authorization & Privacy Utility Layer

export const permissionUtils = {
    // 1. Relationship Check (Validates using existing ZainOn subcollection schema)
    isFriend: async (db, currentUid, targetUid) => {
        if (!currentUid || !targetUid || currentUid === targetUid) return false;
        try {
            const { doc, getDoc } = await import('firebase/firestore');
            const friendSnap = await getDoc(doc(db, 'users', currentUid, 'friends', targetUid));
            return friendSnap.exists();
        } catch (error) {
            console.error('[permissionUtils.isFriend] Error:', error);
            return false;
        }
    },

    // 2. Presence Visibility Check (Fail-closed, explicit positive matching)
    canViewPresence: (viewerUid, targetUser, isFriend) => {
        if (!targetUser || !viewerUid) return false;
        if (targetUser.uid === viewerUid) return true; // Self can always see own presence
        if (!isFriend) return false; // Strangers NEVER see presence

        const privacy = targetUser.privacy;
        if (!privacy) return false; // Fail-closed if privacy object is missing/undefined

        const onlineStatusVal = privacy.onlineStatus;

        // Explicit positive rules: allowed only if true or "everyone"
        if (onlineStatusVal === true || onlineStatusVal === 'everyone') {
            return true;
        }

        // Denied for false, "nobody", undefined, null, or any unknown value
        return false;
    },

    // 3. Last Seen Visibility Check (Fail-closed, explicit positive matching)
    canViewLastSeen: (viewerUid, targetUser, isFriend) => {
        if (!targetUser || !viewerUid) return false;
        if (targetUser.uid === viewerUid) return true;
        if (!isFriend) return false;

        const privacy = targetUser.privacy;
        if (!privacy) return false; // Fail-closed if privacy object is missing/undefined

        const lastSeenSetting = privacy.lastSeen;

        // Explicit positive rules: allowed only if true, "everyone", or "friends" (since viewer is verified friend)
        if (lastSeenSetting === true || lastSeenSetting === 'everyone' || lastSeenSetting === 'friends') {
            return true;
        }

        // Denied for false, "nobody", undefined, null, or any unknown value
        return false;
    },

    // 4. Call Authorization Check (Calls allowed ONLY between friends, never self, never strangers)
    canCall: (viewerUid, targetUid, isFriend) => {
        if (!viewerUid || !targetUid) return false;
        if (viewerUid === targetUid) return false;
        return Boolean(isFriend);
    },

    // 5. Profile Visibility Check (Nobody restricts strangers, but preserves existing friends' access)
    canViewProfile: (viewerUid, targetUser, isFriend, isFoF = false) => {
        if (!targetUser || !viewerUid) return false;
        if (targetUser.uid === viewerUid) return true;
        if (isFriend) return true; // Existing friends ALWAYS retain access regardless of profile visibility settings

        const targetVisibility = targetUser.privacy?.profileVisibility || 'everyone';
        if (targetVisibility === 'nobody') return false;
        if (targetVisibility === 'friends_of_friends' && !isFoF) return false;
        return true;
    }
};

export default permissionUtils;