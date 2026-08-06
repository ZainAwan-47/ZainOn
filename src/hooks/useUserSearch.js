// React
import { useState, useEffect } from 'react';

// Services & Hooks
import { userService } from '../services/userService';
import { useDebounce } from './useDebounce';
import { useAuth } from './useAuth';

/**
 * Custom hook to manage user search query lifecycle, debouncing, and API results.
 * @returns {Object} Search control object containing query, results, loading state, and handlers.
 */
export const useUserSearch = () => {
    const { user } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [results, setResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [error, setError] = useState('');

    const debouncedQuery = useDebounce(searchQuery, 300);

    useEffect(() => {
        let isMounted = true;

        const executeSearch = async () => {
            if (!debouncedQuery.trim()) {
                setResults([]);
                setIsSearching(false);
                setError('');
                return;
            }

            if (!user?.uid) return;

            setIsSearching(true);
            setError('');

            try {
                const users = await userService.searchUsers(debouncedQuery, user.uid);
                if (isMounted) {
                    setResults(users);
                }
            } catch (err) {
                if (isMounted) {
                    setError(err.message || 'An error occurred while searching.');
                    setResults([]);
                }
            } finally {
                if (isMounted) {
                    setIsSearching(false);
                }
            }
        };

        executeSearch();

        return () => {
            isMounted = false;
        };
    }, [debouncedQuery, user?.uid]);

    const clearSearch = () => {
        setSearchQuery('');
        setResults([]);
        setError('');
    };

    return {
        searchQuery,
        setSearchQuery,
        results,
        isSearching,
        error,
        clearSearch,
    };
};

export default useUserSearch;