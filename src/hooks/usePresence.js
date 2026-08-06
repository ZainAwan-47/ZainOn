// React
import { useEffect } from 'react';

// Services
import { presenceService } from '../services/presenceService';

export const usePresence = (uid) => {
    useEffect(() => {
        if (!uid) return;

        // Set online immediately on mount
        presenceService.setUserOnline(uid);

        // 30-second presence heartbeat
        const heartbeatInterval = setInterval(() => {
            presenceService.setUserOnline(uid);
        }, 30000);

        // Tab visibility changes
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                presenceService.setUserOnline(uid);
            }
        };

        // Window unload listener
        const handleBeforeUnload = () => {
            presenceService.setUserOffline(uid);
        };

        window.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            clearInterval(heartbeatInterval);
            window.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('beforeunload', handleBeforeUnload);
            presenceService.setUserOffline(uid);
        };
    }, [uid]);
};

export default usePresence;