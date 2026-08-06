// React
import React, { useState, useContext } from 'react';

// Third Party Libraries
import { NavLink, Outlet, useNavigate } from 'react-router-dom';

// Context
import { ThemeContext } from '../context/ThemeContext';

// Hooks
import { useAuth } from '../hooks/useAuth';

// Components
import Avatar from '../components/ui/Avatar';
import IconButton from '../components/ui/IconButton';

export const MainAppLayout = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const themeContext = useContext(ThemeContext);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('chats');

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error('[MainAppLayout] Logout failed:', error);
        }
    };

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen((prev) => !prev);
    };

    const closeMobileMenu = () => {
        setIsMobileMenuOpen(false);
    };

    return (
        <div className="fixed inset-0 h-screen w-screen overflow-hidden bg-slate-900 text-slate-100 font-sans flex">
            {/* Mobile Drawer Overlay */}
            {isMobileMenuOpen && (
                <div
                    onClick={closeMobileMenu}
                    className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-40 md:hidden transition-opacity"
                    aria-hidden="true"
                />
            )}

            {/* 320px Sidebar Navigation */}
            <aside
                className={`fixed md:static inset-y-0 left-0 z-50 w-80 min-w-[320px] bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
                    }`}
            >
                {/* Brand Header */}
                <div className="h-16 px-4 border-b border-slate-800 flex items-center justify-between shrink-0">
                    <div className="flex items-center space-x-3">
                        <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                            <svg
                                className="w-5 h-5 text-white"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2.5"
                                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                                />
                            </svg>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-base font-bold tracking-tight text-white leading-none">
                                ZainOn
                            </span>
                            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mt-0.5">
                                Realtime Workspace
                            </span>
                        </div>
                    </div>

                    <div className="md:hidden">
                        <IconButton onClick={closeMobileMenu} title="Close menu">
                            <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </IconButton>
                    </div>
                </div>

                {/* Search Input Bar */}
                <div className="p-3 border-b border-slate-800/60 shrink-0">
                    <div className="relative flex items-center">
                        <svg
                            className="w-4 h-4 absolute left-3 text-slate-400 pointer-events-none"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search conversations..."
                            className="w-full pl-9 pr-4 py-2 bg-slate-800/70 border border-transparent focus:border-indigo-500 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none transition-all"
                        />
                    </div>
                </div>

                {/* Navigation Selector Tabs */}
                <div className="px-3 py-2 flex items-center space-x-1 border-b border-slate-800/80 shrink-0 bg-slate-900/50">
                    <button
                        type="button"
                        onClick={() => setActiveTab('chats')}
                        className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${activeTab === 'chats'
                                ? 'bg-slate-800 text-indigo-400 shadow-sm'
                                : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        Chats
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('groups')}
                        className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${activeTab === 'groups'
                                ? 'bg-slate-800 text-indigo-400 shadow-sm'
                                : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        Groups
                    </button>
                </div>

                {/* Conversation Placeholders List */}
                <div className="flex-1 overflow-y-auto p-2 space-y-1 divide-y divide-slate-800/40">
                    {activeTab === 'chats' ? (
                        <div className="space-y-1 pt-1">
                            <div className="p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 transition-colors cursor-pointer flex items-center space-x-3">
                                <Avatar name="Sarah Connor" isOnline={true} size="md" />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-0.5">
                                        <span className="text-xs font-bold text-white truncate">
                                            Sarah Connor
                                        </span>
                                        <span className="text-[10px] text-slate-400">10:42 AM</span>
                                    </div>
                                    <p className="text-xs text-slate-400 truncate">
                                        Let&apos;s sync on the new design specs later today!
                                    </p>
                                </div>
                            </div>

                            <div className="p-2.5 rounded-xl hover:bg-slate-800/60 transition-colors cursor-pointer flex items-center space-x-3">
                                <Avatar name="David Miller" isOnline={false} size="md" />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-0.5">
                                        <span className="text-xs font-bold text-white truncate">
                                            David Miller
                                        </span>
                                        <span className="text-[10px] text-slate-400">Yesterday</span>
                                    </div>
                                    <p className="text-xs text-slate-400 truncate">
                                        Have you reviewed the Firestore rules update?
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-1 pt-1">
                            <div className="p-2.5 rounded-xl hover:bg-slate-800/60 transition-colors cursor-pointer flex items-center space-x-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-sm">
                                    DEV
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-0.5">
                                        <span className="text-xs font-bold text-white truncate">
                                            Frontend Core Team
                                        </span>
                                        <span className="text-[10px] text-slate-400">Mon</span>
                                    </div>
                                    <p className="text-xs text-slate-400 truncate">
                                        Alex: Application Shell v1.1 is locked!
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Route Action Bar */}
                <div className="px-3 py-1.5 border-t border-slate-800 flex items-center space-x-1 bg-slate-900/60 shrink-0">
                    <NavLink
                        to="/chat"
                        onClick={closeMobileMenu}
                        className={({ isActive }) =>
                            `flex-1 text-center py-1.5 px-2 rounded-lg text-xs font-medium transition-colors ${isActive ? 'text-indigo-400 font-semibold' : 'text-slate-400 hover:text-white'
                            }`
                        }
                    >
                        Chat
                    </NavLink>
                    <NavLink
                        to="/profile"
                        onClick={closeMobileMenu}
                        className={({ isActive }) =>
                            `flex-1 text-center py-1.5 px-2 rounded-lg text-xs font-medium transition-colors ${isActive ? 'text-indigo-400 font-semibold' : 'text-slate-400 hover:text-white'
                            }`
                        }
                    >
                        Profile
                    </NavLink>
                    <NavLink
                        to="/settings"
                        onClick={closeMobileMenu}
                        className={({ isActive }) =>
                            `flex-1 text-center py-1.5 px-2 rounded-lg text-xs font-medium transition-colors ${isActive ? 'text-indigo-400 font-semibold' : 'text-slate-400 hover:text-white'
                            }`
                        }
                    >
                        Settings
                    </NavLink>
                </div>

                {/* User Profile Footer Card */}
                <div className="p-3 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between shrink-0">
                    <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                        <Avatar
                            src={user?.photoURL}
                            name={user?.fullName || user?.displayName || 'User'}
                            size="md"
                            isOnline={user?.isOnline ?? true}
                        />
                        <div className="flex flex-col min-w-0">
                            <span className="text-xs font-bold text-white truncate">
                                {user?.fullName || user?.displayName || 'ZainOn User'}
                            </span>
                            <span className="text-[10px] text-slate-400 truncate">
                                @{user?.username || 'user'}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center space-x-1 shrink-0">
                        {themeContext && (
                            <IconButton
                                onClick={() => {
                                    if (themeContext.toggleTheme) {
                                        themeContext.toggleTheme();
                                    }
                                }}
                                title="Toggle Theme"
                                size="sm"
                            >
                                <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                                    />
                                </svg>
                            </IconButton>
                        )}

                        <IconButton onClick={handleLogout} title="Sign Out" variant="danger" size="sm">
                            <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                                />
                            </svg>
                        </IconButton>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 min-h-0 bg-slate-950 transition-colors h-full">
                {/* Mobile Header Banner */}
                <header className="md:hidden h-14 border-b border-slate-800 px-4 flex items-center justify-between bg-slate-900 shrink-0">
                    <div className="flex items-center space-x-3">
                        <IconButton onClick={toggleMobileMenu} title="Open sidebar">
                            <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M4 6h16M4 12h16M4 18h16"
                                />
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

                {/* Viewport Canvas Outlet */}
                <main className="flex-1 flex flex-col min-h-0 relative h-full">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default MainAppLayout;