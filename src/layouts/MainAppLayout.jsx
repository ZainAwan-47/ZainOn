// React
import React, { useState, useContext, useRef, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';

// Context & Hooks
import { ThemeContext } from '../context/ThemeContext';
import { useAuth } from '../hooks/useAuth';
import { useUserSearch } from '../hooks/useUserSearch';
import { useFriends } from '../hooks/useFriends';
import { useConversations } from '../hooks/useConversations';
import { usePresence } from '../hooks/usePresence';
import { useGroups } from '../hooks/useGroups';
import { useGlobalDeliveryAck } from '../hooks/useGlobalDeliveryAck';
import { useToast } from '../context/ToastContext';

// Components
import Avatar from '../components/ui/Avatar';
import IconButton from '../components/ui/IconButton';
import UserSearchResults from '../components/search/UserSearchResults';
import FriendsList from '../components/friends/FriendsList';
import FriendRequestsTab from '../components/friends/FriendRequestsTab';
import ConversationList from '../components/chat/ConversationList';
import ProfilePreviewModal from '../components/friends/ProfilePreviewModal';
import GroupsTab from '../components/groups/GroupsTab';

export const MainAppLayout = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const themeContext = useContext(ThemeContext);
    const { showToast } = useToast();

    usePresence(user?.uid);

    const [activeTab, setActiveTab] = useState('chats');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [selectedPreviewUser, setSelectedPreviewUser] = useState(null);
    const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
    const themeMenuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (themeMenuRef.current && !themeMenuRef.current.contains(e.target)) {
                setIsThemeMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const {
        searchQuery = '',
        setSearchQuery,
        results: searchResults = [],
        isSearching,
        error: searchError,
        clearSearch,
    } = useUserSearch() || {};

    const {
        friends = [],
        incomingRequests = [],
        loading: friendsLoading,
        acceptRequest,
        declineRequest,
    } = useFriends() || {};

    const {
        conversations = [],
        activeConversationId,
        setActiveConversationId,
        loading: conversationsLoading,
        startConversation,
    } = useConversations() || {};

    const { groups = [], loading: groupsLoading } = useGroups() || {};

    useGlobalDeliveryAck(user?.uid, conversations);

    const handleLogout = async () => {
        try {
            localStorage.removeItem('zainon_active_conversation_id');
            await logout();
        } catch (error) {
            console.warn('[MainAppLayout] Handled non-critical logout exception:', error);
        } finally {
            navigate('/login', { replace: true });
        }
    };

    const closeMobileMenu = () => setIsMobileMenuOpen(false);
    const toggleMobileMenu = () => setIsMobileMenuOpen((prev) => !prev);

    const handleStartChatFromProfile = async (targetUser) => {
        setSelectedPreviewUser(null);
        const convId = await startConversation(targetUser);
        if (convId) {
            setActiveConversationId(convId);
            setActiveTab('chats');
            closeMobileMenu();
            navigate('/chat');
        }
    };

    const handleViewProfile = (targetUser) => {
        setSelectedPreviewUser(targetUser);
        closeMobileMenu();
    };

    const handleDeleteConversation = (deletedId) => {
        if (deletedId === activeConversationId) {
            setActiveConversationId(null);
        }
    };

    const isSearchActive = Boolean(searchQuery.trim());

    // Respect the user's own onlineStatus privacy setting for the bottom-left avatar
    const myOnlineStatusEnabled = user?.privacy?.onlineStatus !== false;

    return (
        <div className="fixed inset-0 h-screen w-screen overflow-hidden bg-[var(--bg-main)] text-[var(--text-primary)] font-sans flex select-none transition-colors duration-300">
            {isMobileMenuOpen && (
                <div
                    onClick={closeMobileMenu}
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity duration-200"
                    aria-hidden="true"
                />
            )}

            <aside className={`fixed md:static inset-y-0 left-0 z-50 w-[336px] min-w-[336px] bg-[var(--bg-surface)] border-r border-[var(--border-color)] flex flex-col shrink-0 transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>

                <div className="h-[72px] px-5 border-b border-[var(--border-color)] flex items-center justify-between shrink-0 bg-[var(--bg-surface)]/90 backdrop-blur-md">
                    <div className="flex items-center space-x-3.5">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-[var(--color-primary)]/20 ring-1 ring-white/10">
                            <svg className="w-5.5 h-5.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-lg font-bold tracking-tight text-[var(--text-primary)] leading-tight">ZainOn</span>
                            <span className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-widest mt-0.5">Realtime Workspace</span>
                        </div>
                    </div>
                    <div className="md:hidden">
                        <IconButton onClick={closeMobileMenu} title="Close menu" size="sm">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </IconButton>
                    </div>
                </div>

                <div className="p-3.5 border-b border-[var(--border-color)] shrink-0">
                    <div className="relative flex items-center">
                        <svg className="w-4 h-4 absolute left-3.5 text-[var(--text-secondary)] pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search users by name or @username..."
                            className="w-full pl-9.5 pr-8 py-2 bg-[var(--bg-surface-hover)] border border-[var(--border-color)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 rounded-xl text-xs text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none transition-all"
                        />
                        {isSearchActive && (
                            <button
                                type="button"
                                onClick={clearSearch}
                                className="absolute right-3 text-[var(--text-secondary)] hover:text-[var(--text-primary)] focus:outline-none cursor-pointer"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>

                {!isSearchActive && (
                    <div className="px-2 py-2 flex items-center space-x-1 border-b border-[var(--border-color)] shrink-0 bg-[var(--bg-surface)]">
                        <button type="button" onClick={() => setActiveTab('chats')} className={`flex-1 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${activeTab === 'chats' ? 'bg-[var(--bg-surface-hover)] text-[var(--color-primary)] ring-1 ring-[var(--border-color)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]/60'}`}>
                            Chats
                        </button>
                        <button type="button" onClick={() => setActiveTab('groups')} className={`flex-1 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${activeTab === 'groups' ? 'bg-[var(--bg-surface-hover)] text-[var(--color-primary)] ring-1 ring-[var(--border-color)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]/60'}`}>
                            Groups
                        </button>
                        <button type="button" onClick={() => setActiveTab('friends')} className={`flex-1 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${activeTab === 'friends' ? 'bg-[var(--bg-surface-hover)] text-[var(--color-primary)] ring-1 ring-[var(--border-color)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]/60'}`}>
                            Friends
                        </button>
                        <button type="button" onClick={() => setActiveTab('requests')} className={`flex-1 py-1.5 rounded-xl text-[11px] font-bold transition-all relative cursor-pointer ${activeTab === 'requests' ? 'bg-[var(--bg-surface-hover)] text-[var(--color-primary)] ring-1 ring-[var(--border-color)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]/60'}`}>
                            Reqs
                            {(incomingRequests?.length || 0) > 0 && (
                                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[var(--color-primary)] text-[9px] text-white font-extrabold flex items-center justify-center shadow-md animate-pulse">
                                    {incomingRequests.length}
                                </span>
                            )}
                        </button>
                    </div>
                )}

                <div className="flex-1 overflow-y-auto p-3 space-y-1.5 bg-[var(--bg-surface)]">
                    {isSearchActive ? (
                        <UserSearchResults
                            results={searchResults}
                            isSearching={isSearching}
                            error={searchError}
                            searchQuery={searchQuery}
                            onViewProfile={handleViewProfile}
                        />
                    ) : activeTab === 'groups' ? (
                        <GroupsTab
                            groups={groups}
                            loading={groupsLoading}
                            activeGroupId={activeConversationId}
                            onSelectGroup={(groupId) => {
                                setActiveConversationId(groupId);
                                closeMobileMenu();
                                navigate('/chat');
                            }}
                        />
                    ) : activeTab === 'friends' ? (
                        <FriendsList
                            friends={friends}
                            loading={friendsLoading}
                            onViewProfile={handleViewProfile}
                        />
                    ) : activeTab === 'requests' ? (
                        <FriendRequestsTab
                            requests={incomingRequests}
                            onAccept={(reqId, senderUid, senderProfile) =>
                                acceptRequest(reqId, senderUid, senderProfile?.fullName || 'User')
                            }
                            onDecline={declineRequest}
                        />
                    ) : (
                        <ConversationList
                            conversations={conversations}
                            loading={conversationsLoading}
                            activeConversationId={activeConversationId}
                            onSelectConversation={(conv) => {
                                setActiveConversationId(conv.id);
                                closeMobileMenu();
                                navigate('/chat');
                            }}
                            onDeleteConversation={handleDeleteConversation}
                        />
                    )}
                </div>

                <div className="px-3.5 py-2 flex items-center space-x-1 bg-[var(--bg-surface)] border-t border-[var(--border-color)] shrink-0">
                    <NavLink to="/chat" onClick={closeMobileMenu} className={({ isActive }) => `flex-1 text-center py-1.5 px-2 rounded-xl text-xs font-bold transition-all ${isActive ? 'text-[var(--color-primary)] bg-[var(--bg-surface-hover)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}>Chat</NavLink>
                    <NavLink to="/profile" onClick={closeMobileMenu} className={({ isActive }) => `flex-1 text-center py-1.5 px-2 rounded-xl text-xs font-bold transition-all ${isActive ? 'text-[var(--color-primary)] bg-[var(--bg-surface-hover)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}>Profile</NavLink>
                    <NavLink to="/settings" onClick={closeMobileMenu} className={({ isActive }) => `flex-1 text-center py-1.5 px-2 rounded-xl text-xs font-bold transition-all ${isActive ? 'text-[var(--color-primary)] bg-[var(--bg-surface-hover)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}>Settings</NavLink>
                </div>

                <div className="h-[72px] px-4 border-t border-[var(--border-color)] bg-[var(--bg-surface)]/95 backdrop-blur-md flex items-center justify-between shrink-0">
                    <div className="flex items-center space-x-3 min-w-0 pr-2">
                        <Avatar
                            src={user?.photoURL}
                            name={user?.fullName || user?.displayName || 'User'}
                            size="md"
                            isOnline={myOnlineStatusEnabled ? (user?.isOnline ?? true) : false}
                        />
                        <div className="flex flex-col min-w-0">
                            <span className="text-xs font-bold text-[var(--text-primary)] truncate">{user?.fullName || user?.displayName || 'Zainon User'}</span>
                            <span className="text-[10px] font-medium text-[var(--text-secondary)] truncate">@{user?.username || 'user'}</span>
                        </div>
                    </div>
                    <div className="flex items-center space-x-1 shrink-0">
                        {themeContext && (
                            <div className="relative" ref={themeMenuRef}>
                                <IconButton onClick={() => setIsThemeMenuOpen((prev) => !prev)} title="Select Theme" size="sm">
                                    <svg className="w-4 h-4 text-[var(--text-secondary)] hover:text-[var(--text-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                    </svg>
                                </IconButton>

                                {isThemeMenuOpen && (
                                    <div className="absolute bottom-12 right-0 w-44 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl shadow-2xl p-1.5 z-50 flex flex-col space-y-1 animate-auth-card select-none">
                                        <div className="px-2.5 py-1.5 text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider border-b border-[var(--border-color)]">
                                            Select Theme
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (themeContext?.setTheme) themeContext.setTheme('light');
                                                setIsThemeMenuOpen(false);
                                            }}
                                            className={`w-full px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${themeContext?.theme === 'light'
                                                ? 'bg-[var(--color-primary)] text-white'
                                                : 'text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'
                                                }`}
                                        >
                                            <span>Light Mode</span>
                                            {themeContext?.theme === 'light' && (
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                                                </svg>
                                            )}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (themeContext?.setTheme) themeContext.setTheme('dark');
                                                setIsThemeMenuOpen(false);
                                            }}
                                            className={`w-full px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${themeContext?.theme === 'dark'
                                                ? 'bg-[var(--color-primary)] text-white'
                                                : 'text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'
                                                }`}
                                        >
                                            <span>Dark Mode</span>
                                            {themeContext?.theme === 'dark' && (
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                                                </svg>
                                            )}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (themeContext?.setTheme) themeContext.setTheme('navy');
                                                setIsThemeMenuOpen(false);
                                            }}
                                            className={`w-full px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${themeContext?.theme === 'navy' || themeContext?.theme === 'system'
                                                ? 'bg-[var(--color-primary)] text-white'
                                                : 'text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'
                                                }`}
                                        >
                                            <span>System Auto</span>
                                            {(themeContext?.theme === 'navy' || themeContext?.theme === 'system') && (
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                                                </svg>
                                            )}
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                        <IconButton onClick={handleLogout} title="Sign Out" variant="danger" size="sm">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                        </IconButton>
                    </div>
                </div>
            </aside>

            <div className="flex-1 flex flex-col min-w-0 min-h-0 bg-[var(--bg-main)] transition-colors duration-300 h-full relative">
                <header className="md:hidden h-14 border-b border-[var(--border-color)] px-4 flex items-center justify-between bg-[var(--bg-surface)] shrink-0">
                    <div className="flex items-center space-x-3">
                        <IconButton onClick={toggleMobileMenu} title="Open sidebar">
                            <svg className="w-5 h-5 text-[var(--text-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
                        </IconButton>
                        <span className="text-base font-bold text-[var(--text-primary)]">ZainOn</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Avatar
                            src={user?.photoURL}
                            name={user?.fullName || user?.displayName || 'User'}
                            size="sm"
                            isOnline={myOnlineStatusEnabled ? (user?.isOnline ?? true) : false}
                        />
                        <IconButton onClick={handleLogout} title="Sign Out" variant="danger" size="sm">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                        </IconButton>
                    </div>
                </header>

                <main className="flex-1 flex flex-col min-h-0 relative h-full">
                    {selectedPreviewUser && (
                        <ProfilePreviewModal targetUser={selectedPreviewUser} onClose={() => setSelectedPreviewUser(null)} onStartChat={handleStartChatFromProfile} />
                    )}

                    <Outlet
                        context={{
                            conversations,
                            activeConversationId,
                            setActiveConversationId,
                            conversationsLoading,
                            startConversation,
                            setSelectedPreviewUser: handleViewProfile,
                        }}
                    />
                </main>
            </div>
        </div>
    );
};

export default MainAppLayout;