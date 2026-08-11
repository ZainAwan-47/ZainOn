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

    const distanceFromBottomRef = useRef(0);
    const isProgrammaticScrollRef = useRef(false);
    const scrollTimeoutRef = useRef(null);
    const scrollAnimationRef = useRef(null);

    const prevMessageIdsRef = useRef(new Set());
    const prevTypingStateRef = useRef(false);
    const seenInFlightRef = useRef(new Set());
    const deliveredInFlightRef = useRef(new Set());

    const [showBottomNavigator, setShowBottomNavigator] = useState(false);

    useEffect(() => {
        prevMessageIdsRef.current = new Set();
        setShowBottomNavigator(false);
        distanceFromBottomRef.current = 0;
        isProgrammaticScrollRef.current = false;
        if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
        if (scrollAnimationRef.current) cancelAnimationFrame(scrollAnimationRef.current);
        seenInFlightRef.current.clear();
        deliveredInFlightRef.current.clear();
    }, [conversationId]);

    const processAcknowledgements = useCallback(() => {
        if (!conversationId || !user?.uid || messages.length === 0) return;

        const isAtBottom = distanceFromBottomRef.current <= 50;
        const readReceiptsEnabled = user?.privacy?.readReceipts ?? true;

        const toMarkSeen = [];
        const toMarkDelivered = [];

        messages.forEach(m => {
            if (m.senderId === user.uid) return;

            const notSeen = !m.consumedBy || !m.consumedBy.includes(user.uid);
            const notDelivered = m.deliveryStatus === 'sent';

            if (isAtBottom && notSeen && !seenInFlightRef.current.has(m.id)) {
                toMarkSeen.push(m);
                seenInFlightRef.current.add(m.id);
            } else if (!isAtBottom && notDelivered && !deliveredInFlightRef.current.has(m.id)) {
                toMarkDelivered.push(m);
                deliveredInFlightRef.current.add(m.id);
            }
        });

        if (toMarkSeen.length > 0) {
            const promise = readReceiptsEnabled
                ? messageService.markAsSeen(conversationId, user.uid, toMarkSeen, isGroup)
                : messageService.markAsConsumedOnly(conversationId, user.uid, toMarkSeen);

            promise.catch(() => toMarkSeen.forEach(m => seenInFlightRef.current.delete(m.id)));
        }

        if (toMarkDelivered.length > 0) {
            messageService.markAsDelivered(conversationId, user.uid, toMarkDelivered, isGroup)
                .catch(() => toMarkDelivered.forEach(m => deliveredInFlightRef.current.delete(m.id)));
        }
    }, [conversationId, user?.uid, messages, isGroup, user?.privacy?.readReceipts]);

    useEffect(() => {
        processAcknowledgements();
    }, [messages, processAcknowledgements]);

    // THE PREMIUM SCROLL FIX: Syncs perfectly with the Framer Motion airy spring.
    const performScrollToBottom = useCallback((instant = false) => {
        const container = chatContainerRef.current;
        if (!container) return;

        isProgrammaticScrollRef.current = true;
        if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
        if (scrollAnimationRef.current) cancelAnimationFrame(scrollAnimationRef.current);

        if (instant) {
            container.scrollTop = container.scrollHeight;
            setShowBottomNavigator(false);
            distanceFromBottomRef.current = 0;
            processAcknowledgements();
            setTimeout(() => { isProgrammaticScrollRef.current = false; }, 50);
            return;
        }

        const startTop = container.scrollTop;
        let startTime = null;

        // Extended duration to 450ms to perfectly match the soft, floating tail of the new spring physics
        const duration = 450;

        // Premium "Airy" Ease-Out-Quint curve: Fast liftoff, extremely soft and weightless landing
        const airyEase = (t) => 1 - Math.pow(1 - t, 5);

        const animateScroll = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);
            const ease = airyEase(progress);

            // Fetch target iteratively so it adapts dynamically if the DOM height changes mid-animation
            const targetTop = container.scrollHeight - container.clientHeight;
            const distance = targetTop - startTop;

            container.scrollTop = startTop + (distance * ease);

            if (progress < 1) {
                scrollAnimationRef.current = requestAnimationFrame(animateScroll);
            } else {
                container.scrollTop = targetTop;
                setShowBottomNavigator(false);
                distanceFromBottomRef.current = 0;
                processAcknowledgements();
                isProgrammaticScrollRef.current = false;
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

        if (dist <= 50) {
            if (showBottomNavigator) setShowBottomNavigator(false);
            processAcknowledgements();
        }
    }, [showBottomNavigator, processAcknowledgements]);

    useEffect(() => {
        const container = chatContainerRef.current;
        if (!container) return;

        const handleUserInteraction = () => {
            if (isProgrammaticScrollRef.current) {
                isProgrammaticScrollRef.current = false;
                if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
                if (scrollAnimationRef.current) cancelAnimationFrame(scrollAnimationRef.current);
                handleScroll();
            }
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

    useEffect(() => {
        const container = chatContainerRef.current;
        if (!container) return;

        const resizeObserver = new ResizeObserver(() => {
            if (!isProgrammaticScrollRef.current && distanceFromBottomRef.current <= 60) {
                container.scrollTop = container.scrollHeight;
                distanceFromBottomRef.current = 0;
            }
        });

        resizeObserver.observe(container);
        if (container.firstElementChild) resizeObserver.observe(container.firstElementChild);
        return () => resizeObserver.disconnect();
    }, []);

    useLayoutEffect(() => {
        if (loading || messages.length === 0) return;

        const currentIds = new Set(messages.map(m => m.id));
        const prevIds = prevMessageIdsRef.current;

        if (prevIds.size === 0) {
            performScrollToBottom(true);
            prevMessageIdsRef.current = currentIds;
            return;
        }

        const newMessages = messages.filter(m => !prevIds.has(m.id));

        if (newMessages.length > 0) {
            const hasOwnNew = newMessages.some(m => m.senderId === user?.uid);
            const hasIncomingNew = newMessages.some(m => m.senderId !== user?.uid);
            const dist = distanceFromBottomRef.current;

            if (hasOwnNew) {
                performScrollToBottom(false);
            } else if (hasIncomingNew) {
                const autoScrollEnabled = user?.chatPrefs?.autoScroll ?? true;
                const threshold = autoScrollEnabled ? 400 : 200;

                if (dist <= threshold) {
                    performScrollToBottom(false);
                } else {
                    setShowBottomNavigator(true);
                }
            }
        }

        prevMessageIdsRef.current = currentIds;
    }, [messages, loading, user?.uid, user?.chatPrefs?.autoScroll, performScrollToBottom]);

    useLayoutEffect(() => {
        if (isOtherUserTyping !== prevTypingStateRef.current) {
            if (isOtherUserTyping && distanceFromBottomRef.current <= 50) {
                performScrollToBottom(false);
            }
            prevTypingStateRef.current = isOtherUserTyping;
        }
    }, [isOtherUserTyping, performScrollToBottom]);

    useEffect(() => {
        const detail = { conversationId, showBottomNavigator };
        window.dispatchEvent(new CustomEvent('zainon_chat_reading_state', { detail }));
    }, [conversationId, showBottomNavigator]);

    return {
        chatContainerRef,
        showBottomNavigator,
        handleBadgeClick: () => performScrollToBottom(false),
        handleScroll,
        scrollToBottom: performScrollToBottom
    };
};