import { useRef, useState, useCallback, useLayoutEffect, useEffect } from 'react';
import { messageService } from '../services/messageService';

export const useChatScrollController = ({
    conversationId,
    user,
    isGroup,
    messages,
    loading,
    isOtherUserTyping
}) => {
    const chatContainerRef = useRef(null);

    // Highly accurate, DOM-independent trackers
    const distanceFromBottomRef = useRef(0);
    const isProgrammaticScrollRef = useRef(false);
    const scrollAnimationRef = useRef(null);
    const scrollTimeoutRef = useRef(null);

    const prevMessagesLengthRef = useRef(0);
    const prevTypingStateRef = useRef(false);
    const ackedDeliveredIdsRef = useRef(new Set());

    // Deterministic new-message state (drives both ↓ and the sidebar badge)
    const [hasNewMessagesBelow, setHasNewMessagesBelow] = useState(false);

    const processAcknowledgements = useCallback(() => {
        if (!conversationId || !user?.uid || messages.length === 0) return;

        const isAtBottom = distanceFromBottomRef.current <= 20;
        const readReceiptsEnabled = user?.privacy?.readReceipts ?? true;

        const incoming = messages.filter(m => m.senderId !== user.uid);

        const toMarkSeen = [];
        const toMarkDelivered = [];

        incoming.forEach(m => {
            const notSeen = !m.consumedBy || !m.consumedBy.includes(user.uid);
            const notDelivered = m.deliveryStatus === 'sent' && !ackedDeliveredIdsRef.current.has(m.id);

            if (isAtBottom && notSeen) {
                toMarkSeen.push(m);
                ackedDeliveredIdsRef.current.add(m.id);
            } else if (!isAtBottom && notDelivered) {
                toMarkDelivered.push(m);
                ackedDeliveredIdsRef.current.add(m.id);
            }
        });

        if (toMarkSeen.length > 0) {
            if (readReceiptsEnabled) {
                messageService.markAsSeen(conversationId, user.uid, toMarkSeen, isGroup);
            } else {
                messageService.markAsConsumedOnly(conversationId, user.uid, toMarkSeen);
            }
        }

        if (toMarkDelivered.length > 0) {
            messageService.markAsDelivered(conversationId, user.uid, toMarkDelivered, isGroup);
        }
    }, [conversationId, user?.uid, messages, isGroup, user?.privacy?.readReceipts]);

    const scrollToBottom = useCallback((instant = false) => {
        const container = chatContainerRef.current;
        if (!container) return;

        isProgrammaticScrollRef.current = true;
        if (scrollAnimationRef.current) cancelAnimationFrame(scrollAnimationRef.current);
        if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);

        scrollTimeoutRef.current = setTimeout(() => {
            isProgrammaticScrollRef.current = false;
        }, 500);

        if (instant) {
            container.scrollTo({ top: container.scrollHeight, behavior: 'auto' });
            setHasNewMessagesBelow(false);
            distanceFromBottomRef.current = 0;
            processAcknowledgements();
            isProgrammaticScrollRef.current = false;
            return;
        }

        const startTop = container.scrollTop;
        let startTime = null;
        const duration = 300; // Smooth 300ms drag up effect

        const animateScroll = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const progress = timestamp - startTime;
            const percent = Math.min(progress / duration, 1);

            // Premium cubic ease-out for the list dragging up
            const easeOutCubic = 1 - Math.pow(1 - percent, 3);

            // Dynamically tracks the DOM height as it animates
            const currentTargetTop = container.scrollHeight - container.clientHeight;
            const currentDistance = currentTargetTop - startTop;

            container.scrollTop = startTop + currentDistance * easeOutCubic;

            if (progress < duration) {
                scrollAnimationRef.current = requestAnimationFrame(animateScroll);
            } else {
                container.scrollTop = currentTargetTop;
                setHasNewMessagesBelow(false);
                distanceFromBottomRef.current = 0;
                processAcknowledgements();
                isProgrammaticScrollRef.current = false;
                scrollAnimationRef.current = null;
            }
        };

        scrollAnimationRef.current = requestAnimationFrame(animateScroll);
    }, [processAcknowledgements]);

    const handleScroll = useCallback(() => {
        const container = chatContainerRef.current;
        if (!container) return;

        const dist = Math.ceil(container.scrollHeight - container.scrollTop - container.clientHeight);
        distanceFromBottomRef.current = dist;

        if (isProgrammaticScrollRef.current) return;

        if (dist <= 10 && hasNewMessagesBelow) {
            setHasNewMessagesBelow(false);
            processAcknowledgements();
        }
    }, [hasNewMessagesBelow, processAcknowledgements]);

    useEffect(() => {
        const container = chatContainerRef.current;
        if (!container) return;

        const handleUserInteraction = () => {
            isProgrammaticScrollRef.current = false;
            if (scrollAnimationRef.current) cancelAnimationFrame(scrollAnimationRef.current);
            if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
            handleScroll();
        };

        container.addEventListener('wheel', handleUserInteraction, { passive: true });
        container.addEventListener('touchstart', handleUserInteraction, { passive: true });
        container.addEventListener('touchmove', handleUserInteraction, { passive: true });

        return () => {
            container.removeEventListener('wheel', handleUserInteraction);
            container.removeEventListener('touchstart', handleUserInteraction);
            container.removeEventListener('touchmove', handleUserInteraction);
        };
    }, [handleScroll]);

    useLayoutEffect(() => {
        if (!loading && messages.length > prevMessagesLengthRef.current) {
            const isInitialLoad = prevMessagesLengthRef.current === 0;
            const lastMsg = messages[messages.length - 1];
            const isOwnMsg = lastMsg?.senderId === user?.uid;

            const autoScrollEnabled = user?.chatPrefs?.autoScroll ?? true;
            const messageThreshold = autoScrollEnabled ? 400 : 200;

            const wasWithinThreshold = distanceFromBottomRef.current <= messageThreshold;

            requestAnimationFrame(() => {
                if (isInitialLoad) {
                    scrollToBottom(true);
                } else if (isOwnMsg || wasWithinThreshold) {
                    // EXACT FIX: Both Sender and Receiver get the smooth drag up animation
                    scrollToBottom(false);
                } else {
                    setHasNewMessagesBelow(true);
                }
            });

            prevMessagesLengthRef.current = messages.length;
        }
    }, [messages.length, loading, user?.uid, user?.chatPrefs?.autoScroll, scrollToBottom]);

    useLayoutEffect(() => {
        if (isOtherUserTyping !== prevTypingStateRef.current) {
            if (isOtherUserTyping && distanceFromBottomRef.current <= 50) {
                requestAnimationFrame(() => scrollToBottom(false));
            }
            prevTypingStateRef.current = isOtherUserTyping;
        }
    }, [isOtherUserTyping, scrollToBottom]);

    const handleBadgeClick = useCallback(() => {
        scrollToBottom(false);
    }, [scrollToBottom]);

    useEffect(() => {
        const detail = { hasNewMessagesBelow };
        window.dispatchEvent(new CustomEvent('zainon_chat_reading_state', { detail }));
    }, [hasNewMessagesBelow]);

    return {
        chatContainerRef,
        hasNewMessagesBelow,
        handleBadgeClick,
        handleScroll,
        scrollToBottom
    };
};