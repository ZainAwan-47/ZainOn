/**
 * Formats a timestamp into a compact 12-hour time string (e.g., "10:42 AM").
 * @param {Object|Date|number} timestamp
 * @returns {string}
 */
export const formatMessageTime = (timestamp) => {
    if (!timestamp) {
        return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    }
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
};

/**
 * Generates a human-readable date label for chat feed separators.
 * @param {Object|Date|number} timestamp
 * @returns {string}
 */
export const getDateSeparatorLabel = (timestamp) => {
    const date = !timestamp
        ? new Date()
        : timestamp.toDate
            ? timestamp.toDate()
            : new Date(timestamp);

    const now = new Date();

    const isToday =
        date.getDate() === now.getDate() &&
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear();

    if (isToday) return 'Today';

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday =
        date.getDate() === yesterday.getDate() &&
        date.getMonth() === yesterday.getMonth() &&
        date.getFullYear() === yesterday.getFullYear();

    if (isYesterday) return 'Yesterday';

    const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    if (diffInDays < 7) {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return days[date.getDay()];
    }

    const day = date.getDate();
    const month = date.toLocaleString('default', { month: 'long' });
    const year = date.getFullYear();

    if (year === now.getFullYear()) {
        return `${day} ${month}`;
    }

    return `${day} ${month} ${year}`;
};

/**
 * Checks whether a date separator should be rendered between two adjacent messages.
 * @param {Object} currentMsg
 * @param {Object} previousMsg
 * @returns {boolean}
 */
export const shouldShowDateSeparator = (currentMsg, previousMsg) => {
    if (!previousMsg) return true;

    const currentDate = !currentMsg?.createdAt
        ? new Date()
        : currentMsg.createdAt.toDate
            ? currentMsg.createdAt.toDate()
            : new Date(currentMsg.createdAt);

    const prevDate = !previousMsg?.createdAt
        ? new Date()
        : previousMsg.createdAt.toDate
            ? previousMsg.createdAt.toDate()
            : new Date(previousMsg.createdAt);

    return currentDate.toDateString() !== prevDate.toDateString();
};