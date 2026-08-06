/**
 * Formats a Firestore timestamp or JavaScript Date object into a readable "Last Seen" string.
 * @param {Object|Date|number} timestamp - Firestore Timestamp object, Date instance, or milliseconds.
 * @returns {string} Human-readable last seen string.
 */
export const formatLastSeen = (timestamp) => {
    if (!timestamp) return 'Offline';

    // Handle Firestore Timestamp objects with toDate()
    let date;
    if (typeof timestamp?.toDate === 'function') {
        date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
        date = timestamp;
    } else if (typeof timestamp === 'number') {
        date = new Date(timestamp);
    } else {
        return 'Offline';
    }

    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 0 || diffInSeconds < 60) {
        return 'Last seen just now';
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
        return `Last seen ${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24 && now.getDate() === date.getDate()) {
        return `Last seen ${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
    }

    // Check if date was yesterday
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (
        yesterday.getDate() === date.getDate() &&
        yesterday.getMonth() === date.getMonth() &&
        yesterday.getFullYear() === date.getFullYear()
    ) {
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `Last seen yesterday at ${hours}:${minutes}`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayName = days[date.getDay()];
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `Last seen ${dayName} at ${hours}:${minutes}`;
    }

    // Older than 7 days: return explicit date string
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `Last seen ${year}-${month}-${day}`;
};