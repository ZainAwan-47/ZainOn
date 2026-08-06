// React
import { useEffect } from 'react';

// Services
import { presenceService } from '../services/presenceService';

export const usePresence = (uid) => {
    useEffect(() => {
        if (!uid) return;

        presenceService.setOnline(uid);

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') {
                presenceService.setOffline(uid);
            } else if (document.visibilityState === 'visible') {
                presenceService.setOnline(uid);
            }
        };

        const handleUnload = () => {
            presenceService.setOffline(uid);
        };

        window.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('pagehide', handleUnload);
        window.addEventListener('beforeunload', handleUnload);

        return () => {
            window.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('pagehide', handleUnload);
            window.removeEventListener('beforeunload', handleUnload);
            presenceService.setOffline(uid);
        };
    }, [uid]);
};

export default usePresence;