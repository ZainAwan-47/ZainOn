// React
import React, { useState, useContext } from 'react';
// Third Party Libraries
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
// Context & Hooks
import { ThemeContext } from '../context/ThemeContext';
import { useAuth } from '../hooks/useAuth';
import { useUserSearch } from '../hooks/useUserSearch';
import { useFriends } from '../hooks/useFriends';
import { useConversations } from '../hooks/useConversations';
import { usePresence } from '../hooks/usePresence';
// Components
import Avatar from '../components/ui/Avatar';
import IconButton from '../components/ui/IconButton';
import UserSearchResults from '../components/search/UserSearchResults';
import FriendsList from '../components/friends/FriendsList';
import FriendRequestsTab from '../components/friends/FriendRequestsTab';
import ConversationList from '../components/chat/ConversationList';
import ProfilePreviewModal from '../components/friends/ProfilePreviewModal';

export const MainAppLayout = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const themeContext = useContext(ThemeContext);

    // Activate presence tracking for logged-in user
    usePresence(user?.uid);

    // Tab & Menu State
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('chats');
    const [selectedPreviewUser, setSelectedPreviewUser] = useState(null);

    // Hooks
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

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error('[MainAppLayout] Logout failed:', error);
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
        closeMobileMenu(); // Automatically close mobile drawer when friend profile is tapped
    };

    const isSearchActive = Boolean(searchQuery.trim());

    return (
        <div className="fixed inset-0 h-screen w-screen overflow-hidden bg-slate-900 text-slate-100 font-sans flex select-none">
            {/* Mobile Drawer Overlay */}
            {isMobileMenuOpen && (
                <div
                    onClick={closeMobileMenu}
                    className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-40 md:hidden transition-opacity duration-200"
                    aria-hidden="true"
                />
            )}

            {/* 336px Sidebar Navigation Panel */}
            <aside
                className={`fixed md:static inset-y-0 left-0 z-50 w-[336px] min-w-[336px] bg-slate-900 border-r border-slate-800/90 flex flex-col shrink-0 transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
                    }`}
            >
                {/* Brand Header */}
                <div className="h-[72px] px-5 border-b border-slate-800/80 flex items-center justify-between shrink-0 bg-slate-900/90 backdrop-blur-md">
                    <div className="flex items-center space-x-3.5">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 ring-1 ring-white/10">
                            <svg className="w-5.5 h-5.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-lg font-bold tracking-tight text-white leading-tight">ZainOn</span>
                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mt-0.5">Realtime Workspace</span>
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

                {/* Global Search Input Bar */}
                <div className="p-3.5 border-b border-slate-800/60 shrink-0">
                    <div className="relative flex items-center">
                        <svg className="w-4 h-4 absolute left-3.5 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search users by name or @username..."
                            className="w-full pl-9.5 pr-8 py-2 bg-slate-800/70 border border-slate-700/40 focus:border-indigo-500/80 focus:ring-2 focus:ring-indigo-500/15 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none transition-all"
                        />
                        {isSearchActive && (
                            <button
                                type="button"
                                onClick={clearSearch}
                                className="absolute right-3 text-slate-400 hover:text-white focus:outline-none"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>

                {/* Sidebar Navigation Tabs */}
                {!isSearchActive && (
                    <div className="px-3 py-2 flex items-center space-x-1 border-b border-slate-800/80 shrink-0 bg-slate-900/60">
                        <button
                            type="button"
                            onClick={() => setActiveTab('chats')}
                            className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'chats'
                                ? 'bg-slate-800 text-indigo-400 ring-1 ring-slate-700/50'
                                : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                                }`}
                        >
                            Chats
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('friends')}
                            className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'friends'
                                ? 'bg-slate-800 text-indigo-400 ring-1 ring-slate-700/50'
                                : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                                }`}
                        >
                            Friends
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('requests')}
                            className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all relative ${activeTab === 'requests'
                                ? 'bg-slate-800 text-indigo-400 ring-1 ring-slate-700/50'
                                : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                                }`}
                        >
                            Requests
                            {(incomingRequests?.length || 0) > 0 && (
                                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-indigo-600 text-[9px] text-white font-extrabold flex items-center justify-center shadow-md animate-pulse">
                                    {incomingRequests.length}
                                </span>
                            )}
                        </button>
                    </div>
                )}

                {/* Dynamic Sidebar Content Body */}
                <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
                    {isSearchActive ? (
                        <UserSearchResults
                            results={searchResults}
                            isSearching={isSearching}
                            error={searchError}
                            searchQuery={searchQuery}
                            onViewProfile={handleViewProfile}
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
                    ) : activeTab === 'chats' ? (
                        <ConversationList
                            conversations={conversations}
                            loading={conversationsLoading}
                            activeConversationId={activeConversationId}
                            onSelectConversation={(conv) => {
                                setActiveConversationId(conv.id);
                                closeMobileMenu();
                                navigate('/chat');
                            }}
                        />
                    ) : (
                        <div className="p-3 text-xs text-slate-400 text-center">Group channels coming soon</div>
                    )}
                </div>

                {/* Quick Action Bar */}
                <div className="px-3.5 py-2 flex items-center space-x-1 bg-slate-900/60 border-t border-slate-800/80 shrink-0">
                    <NavLink
                        to="/chat"
                        onClick={closeMobileMenu}
                        className={({ isActive }) =>
                            `flex-1 text-center py-1.5 px-2 rounded-xl text-xs font-bold transition-all ${isActive ? 'text-indigo-400 bg-slate-800/80' : 'text-slate-400 hover:text-white'
                            }`
                        }
                    >
                        Chat
                    </NavLink>
                    <NavLink
                        to="/profile"
                        onClick={closeMobileMenu}
                        className={({ isActive }) =>
                            `flex-1 text-center py-1.5 px-2 rounded-xl text-xs font-bold transition-all ${isActive ? 'text-indigo-400 bg-slate-800/80' : 'text-slate-400 hover:text-white'
                            }`
                        }
                    >
                        Profile
                    </NavLink>
                    <NavLink
                        to="/settings"
                        onClick={closeMobileMenu}
                        className={({ isActive }) =>
                            `flex-1 text-center py-1.5 px-2 rounded-xl text-xs font-bold transition-all ${isActive ? 'text-indigo-400 bg-slate-800/80' : 'text-slate-400 hover:text-white'
                            }`
                        }
                    >
                        Settings
                    </NavLink>
                </div>

                {/* Current User Card */}
                <div className="h-[72px] px-4 border-t border-slate-800/90 bg-slate-900/95 backdrop-blur-md flex items-center justify-between shrink-0">
                    <div className="flex items-center space-x-3 min-w-0 pr-2">
                        <Avatar
                            src={user?.photoURL}
                            name={user?.fullName || user?.displayName || 'User'}
                            size="md"
                            isOnline={user?.isOnline ?? true}
                        />
                        <div className="flex flex-col min-w-0">
                            <span className="text-xs font-bold text-white truncate">
                                {user?.fullName || user?.displayName || 'Zainon User'}
                            </span>
                            <span className="text-[10px] font-medium text-slate-400 truncate">
                                @{user?.username || 'user'}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center space-x-1 shrink-0">
                        {themeContext && (
                            <IconButton
                                onClick={() => themeContext.toggleTheme && themeContext.toggleTheme()}
                                title="Toggle Theme"
                                size="sm"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                </svg>
                            </IconButton>
                        )}
                        <IconButton onClick={handleLogout} title="Sign Out" variant="danger" size="sm">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                        </IconButton>
                    </div>
                </div>
            </aside>

            {/* Main Workspace Canvas */}
            <div className="flex-1 flex flex-col min-w-0 min-h-0 bg-slate-950 transition-colors h-full relative">
                <header className="md:hidden h-14 border-b border-slate-800 px-4 flex items-center justify-between bg-slate-900 shrink-0">
                    <div className="flex items-center space-x-3">
                        <IconButton onClick={toggleMobileMenu} title="Open sidebar">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </IconButton>
                        <span className="text-base font-bold text-white">ZainOn</span>
                    </div>
                    <Avatar
                        src={user?.photoURL}
                        name={user?.fullName || user?.displayName || 'User'}
                        size="sm"
                        isOnline={user?.isOnline ?? true}
                    />
                </header>

                <main className="flex-1 flex flex-col min-h-0 relative h-full">
                    {/* Hosted strictly inside the main workspace canvas to prevent sidebar overlaps */}
                    {selectedPreviewUser && (
                        <ProfilePreviewModal
                            targetUser={selectedPreviewUser}
                            onClose={() => setSelectedPreviewUser(null)}
                            onStartChat={handleStartChatFromProfile}
                        />
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