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

    // State Machine Memory
    const prevMessageIdsRef = useRef(new Set());
    const prevTypingStateRef = useRef(false);
    const seenInFlightRef = useRef(new Set());
    const deliveredInFlightRef = useRef(new Set());

    // Deterministic ↓ Navigator State
    const [showBottomNavigator, setShowBottomNavigator] = useState(false);

    // Reset state strictly when conversation changes to prevent memory leaks across chats
    useEffect(() => {
        prevMessageIdsRef.current = new Set();
        setShowBottomNavigator(false);
        distanceFromBottomRef.current = 0;
        isProgrammaticScrollRef.current = false;
        if (scrollAnimationRef.current) cancelAnimationFrame(scrollAnimationRef.current);
        seenInFlightRef.current.clear();
        deliveredInFlightRef.current.clear();
    }, [conversationId]);

    // EXACT FIX: Mutually exclusive Seen vs Delivered logic with in-flight retry capabilities
    const processAcknowledgements = useCallback(() => {
        if (!conversationId || !user?.uid || messages.length === 0) return;

        const isAtBottom = distanceFromBottomRef.current <= 20;
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

    // Isolated pure scroll function. Only executes physics.
    const performScrollToBottom = useCallback((instant = false) => {
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
            setShowBottomNavigator(false);
            distanceFromBottomRef.current = 0;
            processAcknowledgements();
            setTimeout(() => { isProgrammaticScrollRef.current = false; }, 50);
            return;
        }

        const startTop = container.scrollTop;
        let startTime = null;
        const duration = 250;

        const animateScroll = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const progress = timestamp - startTime;
            const percent = Math.min(progress / duration, 1);

            const easeOutCubic = 1 - Math.pow(1 - percent, 3);
            const currentTargetTop = container.scrollHeight - container.clientHeight;
            const currentDistance = currentTargetTop - startTop;

            container.scrollTop = startTop + currentDistance * easeOutCubic;

            if (progress < duration) {
                scrollAnimationRef.current = requestAnimationFrame(animateScroll);
            } else {
                container.scrollTop = currentTargetTop;
                setShowBottomNavigator(false);
                distanceFromBottomRef.current = 0;
                processAcknowledgements();
                scrollAnimationRef.current = null;
                setTimeout(() => { isProgrammaticScrollRef.current = false; }, 50);
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

        // If user manually touches bottom, reliably clear new-message state and run acks
        if (dist <= 10 && showBottomNavigator) {
            setShowBottomNavigator(false);
            processAcknowledgements();
        }
    }, [showBottomNavigator, processAcknowledgements]);

    useEffect(() => {
        const container = chatContainerRef.current;
        if (!container) return;

        const handleUserInteraction = () => {
            if (isProgrammaticScrollRef.current) {
                isProgrammaticScrollRef.current = false;
                if (scrollAnimationRef.current) cancelAnimationFrame(scrollAnimationRef.current);
                if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
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

    // =========================================================================
    // INTENT CLASSIFIER: STRICT MESSAGE THRESHOLDS
    // =========================================================================
    useLayoutEffect(() => {
        if (loading || messages.length === 0) return;

        const currentIds = new Set(messages.map(m => m.id));
        const prevIds = prevMessageIdsRef.current;

        if (prevIds.size === 0) {
            performScrollToBottom(true);
            prevMessageIdsRef.current = currentIds;
            return;
        }

        // Identify genuinely new messages (ignores optimistic syncs/edits)
        const newMessages = messages.filter(m => !prevIds.has(m.id));

        if (newMessages.length > 0) {
            const hasOwnNew = newMessages.some(m => m.senderId === user?.uid);
            const hasIncomingNew = newMessages.some(m => m.senderId !== user?.uid);

            const dist = distanceFromBottomRef.current;

            if (hasOwnNew) {
                // Own messages instantly pan
                performScrollToBottom(false);
            } else if (hasIncomingNew) {
                // Determine Strict Active Threshold BEFORE DOM mutates
                const autoScrollEnabled = user?.chatPrefs?.autoScroll ?? true;
                const threshold = autoScrollEnabled ? 400 : 200;

                if (dist <= threshold) {
                    performScrollToBottom(false);
                } else {
                    // Beyond threshold: Strict layout lock. Flag badge.
                    setShowBottomNavigator(true);
                }
            }
        }

        prevMessageIdsRef.current = currentIds;
    }, [messages, loading, user?.uid, user?.chatPrefs?.autoScroll, performScrollToBottom]);

    // =========================================================================
    // INTENT CLASSIFIER: STRICT 50px TYPING THRESHOLD
    // =========================================================================
    useLayoutEffect(() => {
        if (isOtherUserTyping !== prevTypingStateRef.current) {
            // Typing ONLY auto-scrolls if explicitly within 50px. Does NOT flag badge.
            if (isOtherUserTyping && distanceFromBottomRef.current <= 50) {
                requestAnimationFrame(() => performScrollToBottom(false));
            }
            prevTypingStateRef.current = isOtherUserTyping;
        }
    }, [isOtherUserTyping, performScrollToBottom]);

    // Broadcast explicitly scoped unresolved new-message state to sidebar
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