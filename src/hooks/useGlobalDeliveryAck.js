// React
import { useEffect, useRef } from 'react';

// Services
import { messageService } from '../services/messageService';

/**
 * Global background delivery receipt engine.
 * Acknowledges delivery (Grey -> Orange) whenever receiver is online in the app.
 */
export const useGlobalDeliveryAck = (currentUid, conversations = []) => {
    const ackedMessageIdsRef = useRef(new Set());

    useEffect(() => {
        if (!currentUid || !conversations || conversations.length === 0) return;

        conversations.forEach((conv) => {
            const lastMsg = conv.lastMessage;

            // If there is an incoming message that is still marked 'sent'
            if (
                lastMsg &&
                lastMsg.id &&
                lastMsg.senderId !== currentUid &&
                (lastMsg.deliveryStatus === 'sent' || !lastMsg.deliveryStatus) &&
                !ackedMessageIdsRef.current.has(lastMsg.id)
            ) {
                ackedMessageIdsRef.current.add(lastMsg.id);

                // Atomically acknowledge delivery in background
                messageService.markAsDelivered(conv.id, currentUid, [lastMsg]);
            }
        });
    }, [currentUid, conversations]);
};

export default useGlobalDeliveryAck;