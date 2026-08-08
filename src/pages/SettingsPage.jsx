// React
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Context & Hooks
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../context/ToastContext';

// Services
import { userService } from '../services/userService';

export const SettingsPage = () => {
    const { theme, setTheme } = useTheme();
    const { user } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState('account');
    const [isSaving, setIsSaving] = useState(false);

    // Privacy States
    const [privacy, setPrivacy] = useState({
        lastSeen: user?.privacy?.lastSeen || 'everyone',
        onlineStatus: user?.privacy?.onlineStatus ?? true,
        readReceipts: user?.privacy?.readReceipts ?? true,
        profileVisibility: user?.privacy?.profileVisibility || 'everyone',
        friendRequests: user?.privacy?.friendRequests || 'everyone',
    });

    // Chat Preferences States
    const [chatPrefs, setChatPrefs] = useState({
        enterToSend: user?.chatPrefs?.enterToSend ?? true,
        autoScroll: user?.chatPrefs?.autoScroll ?? true,
        chatFontSize: user?.chatPrefs?.chatFontSize || 'medium',
        messagePreview: user?.chatPrefs?.messagePreview ?? true,
    });

    // CRITICAL FIX: Synchronize local form state whenever user object updates from Firestore context
    useEffect(() => {
        if (user) {
            setPrivacy({
                lastSeen: user.privacy?.lastSeen || 'everyone',
                onlineStatus: user.privacy?.onlineStatus ?? true,
                readReceipts: user.privacy?.readReceipts ?? true,
                profileVisibility: user.privacy?.profileVisibility || 'everyone',
                friendRequests: user.privacy?.friendRequests || 'everyone',
            });
            setChatPrefs({
                enterToSend: user.chatPrefs?.enterToSend ?? true,
                autoScroll: user.chatPrefs?.autoScroll ?? true,
                chatFontSize: user.chatPrefs?.chatFontSize || 'medium',
                messagePreview: user.chatPrefs?.messagePreview ?? true,
            });
        }
    }, [user]);

    const savePrivacySettings = async () => {
        if (!user?.uid) return;
        setIsSaving(true);
        try {
            await userService.updateUserSettings(user.uid, { privacy });
            // Optimistically update user context object locally if available
            if (user) user.privacy = privacy;
            showToast('Privacy settings saved successfully!', 'info');
        } catch (error) {
            showToast('Failed to save privacy settings.', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const saveChatPreferences = async () => {
        if (!user?.uid) return;
        setIsSaving(true);
        try {
            await userService.updateUserSettings(user.uid, { chatPrefs });
            // Optimistically update user context object locally so features (like enterToSend) apply immediately
            if (user) user.chatPrefs = chatPrefs;
            showToast('Chat preferences saved successfully!', 'info');
        } catch (error) {
            showToast('Failed to save chat preferences.', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const tabs = [
        { id: 'account', label: 'Account', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
        { id: 'appearance', label: 'Appearance', icon: 'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 73.5l2-2m2 2l2-2' },
        { id: 'privacy', label: 'Privacy', icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' },
        { id: 'chat', label: 'Chat', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
    ];

    const themeOptions = [
        { id: 'light', label: 'Light Mode' },
        { id: 'dark', label: 'Pure Black' },
        { id: 'navy', label: 'System Auto (Navy)' },
    ];

    return (
        <div className="flex-1 flex flex-col lg:flex-row h-full bg-[var(--bg-main)] text-[var(--text-primary)] transition-colors duration-300 overflow-hidden">
            <aside className="w-full lg:w-72 border-b lg:border-b-0 lg:border-r border-[var(--border-color)] bg-[var(--bg-surface)] p-4 sm:p-6 overflow-y-auto flex-shrink-0">
                <header className="mb-6">
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Settings</h1>
                    <p className="text-[var(--text-secondary)] text-xs mt-0.5">Manage your workspace and preferences</p>
                </header>

                <nav className="flex lg:flex-col space-x-2 lg:space-x-0 lg:space-y-1.5 overflow-x-auto pb-2 lg:pb-0">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer ${activeTab === tab.id
                                    ? 'bg-[var(--color-primary)] text-white shadow-md'
                                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)]'
                                }`}
                        >
                            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={tab.icon} />
                            </svg>
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </nav>
            </aside>

            <main className="flex-1 overflow-y-auto p-4 sm:p-8">
                <div className="max-w-3xl w-full mx-auto space-y-6">

                    {/* ACCOUNT */}
                    {activeTab === 'account' && (
                        <section className="space-y-4 animate-in fade-in duration-300">
                            <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)]">Account Details</h2>
                            <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-3xl p-6 shadow-sm space-y-6">
                                <div className="flex items-center space-x-4">
                                    <img
                                        src={user?.photoURL || 'https://via.placeholder.com/150'}
                                        alt={user?.fullName || 'User'}
                                        className="w-20 h-20 rounded-full object-cover border-2 border-[var(--border-color)]"
                                    />
                                    <div>
                                        <h3 className="text-lg font-bold">{user?.fullName || user?.displayName || 'Zainon User'}</h3>
                                        <p className="text-xs text-[var(--text-secondary)]">@{user?.username || 'username'}</p>
                                        <p className="text-xs text-[var(--color-primary)] font-medium mt-1">{user?.email}</p>
                                    </div>
                                </div>

                                <div className="space-y-3 pt-4 border-t border-[var(--border-color)]">
                                    <div>
                                        <label className="text-[11px] font-bold uppercase text-[var(--text-secondary)]">Bio / Status</label>
                                        <p className="text-sm mt-1 p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)]">
                                            {user?.status || user?.bio || 'Hey there! I am using ZainOn real-time messaging.'}
                                        </p>
                                    </div>
                                </div>

                                <div className="pt-2">
                                    <button
                                        onClick={() => navigate('/profile')}
                                        className="px-5 py-2.5 bg-[var(--color-primary)] text-white text-xs font-bold rounded-xl hover:opacity-90 transition-all shadow-md cursor-pointer"
                                    >
                                        Edit Profile Details
                                    </button>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* APPEARANCE */}
                    {activeTab === 'appearance' && (
                        <section className="space-y-4 animate-in fade-in duration-300">
                            <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)]">Appearance</h2>
                            <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-3xl p-6 shadow-sm space-y-6">
                                <div>
                                    <h3 className="text-base font-bold mb-1">Theme Preference</h3>
                                    <p className="text-xs text-[var(--text-secondary)] mb-4">Select your interface appearance mode.</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        {themeOptions.map(option => (
                                            <button
                                                key={option.id}
                                                onClick={() => setTheme(option.id)}
                                                className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all cursor-pointer ${theme === option.id || (option.id === 'navy' && theme === 'system')
                                                        ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)] shadow-inner'
                                                        : 'border-[var(--border-color)] bg-[var(--bg-main)] hover:border-[var(--text-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                                                    }`}
                                            >
                                                <span className="text-xs font-bold">{option.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* PRIVACY */}
                    {activeTab === 'privacy' && (
                        <section className="space-y-4 animate-in fade-in duration-300">
                            <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)]">Privacy Controls</h2>
                            <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-3xl p-6 shadow-sm space-y-5">
                                <div className="flex items-center justify-between py-2 border-b border-[var(--border-color)]">
                                    <div>
                                        <h4 className="text-sm font-bold">Last Seen</h4>
                                        <p className="text-xs text-[var(--text-secondary)]">Who can see your last seen timestamp</p>
                                    </div>
                                    <select
                                        value={privacy.lastSeen}
                                        onChange={(e) => setPrivacy({ ...privacy, lastSeen: e.target.value })}
                                        className="bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl px-3 py-1.5 text-xs font-medium focus:outline-none cursor-pointer"
                                    >
                                        <option value="everyone">Everyone</option>
                                        <option value="friends">Friends</option>
                                        <option value="nobody">Nobody</option>
                                    </select>
                                </div>

                                <div className="flex items-center justify-between py-2 border-b border-[var(--border-color)]">
                                    <div>
                                        <h4 className="text-sm font-bold">Online Status</h4>
                                        <p className="text-xs text-[var(--text-secondary)]">Share when you are active</p>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={privacy.onlineStatus}
                                        onChange={(e) => setPrivacy({ ...privacy, onlineStatus: e.target.checked })}
                                        className="w-4 h-4 rounded border-[var(--border-color)] text-[var(--color-primary)] cursor-pointer"
                                    />
                                </div>

                                <div className="flex items-center justify-between py-2 border-b border-[var(--border-color)]">
                                    <div>
                                        <h4 className="text-sm font-bold">Read Receipts</h4>
                                        <p className="text-xs text-[var(--text-secondary)]">Show when you have read messages</p>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={privacy.readReceipts}
                                        onChange={(e) => setPrivacy({ ...privacy, readReceipts: e.target.checked })}
                                        className="w-4 h-4 rounded border-[var(--border-color)] text-[var(--color-primary)] cursor-pointer"
                                    />
                                </div>

                                <div className="flex items-center justify-between py-2 border-b border-[var(--border-color)]">
                                    <div>
                                        <h4 className="text-sm font-bold">Profile Visibility</h4>
                                        <p className="text-xs text-[var(--text-secondary)]">Who can view your full profile</p>
                                    </div>
                                    <select
                                        value={privacy.profileVisibility}
                                        onChange={(e) => setPrivacy({ ...privacy, profileVisibility: e.target.value })}
                                        className="bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl px-3 py-1.5 text-xs font-medium focus:outline-none cursor-pointer"
                                    >
                                        <option value="everyone">Everyone</option>
                                        <option value="friends_of_friends">Friends of Friends</option>
                                        <option value="nobody">Nobody</option>
                                    </select>
                                </div>

                                <div className="flex items-center justify-between py-2">
                                    <div>
                                        <h4 className="text-sm font-bold">Friend Request Permissions</h4>
                                        <p className="text-xs text-[var(--text-secondary)]">Who can send you connection requests</p>
                                    </div>
                                    <select
                                        value={privacy.friendRequests}
                                        onChange={(e) => setPrivacy({ ...privacy, friendRequests: e.target.value })}
                                        className="bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl px-3 py-1.5 text-xs font-medium focus:outline-none cursor-pointer"
                                    >
                                        <option value="everyone">Everyone</option>
                                        <option value="friends_of_friends">Friends of Friends</option>
                                        <option value="nobody">Nobody</option>
                                    </select>
                                </div>

                                <div className="pt-4 border-t border-[var(--border-color)] flex justify-end">
                                    <button
                                        onClick={savePrivacySettings}
                                        disabled={isSaving}
                                        className="px-5 py-2.5 bg-[var(--color-primary)] text-white text-xs font-bold rounded-xl hover:opacity-90 transition-all shadow-md cursor-pointer disabled:opacity-50"
                                    >
                                        {isSaving ? 'Saving...' : 'Save Privacy Settings'}
                                    </button>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* CHAT PREFERENCES */}
                    {activeTab === 'chat' && (
                        <section className="space-y-4 animate-in fade-in duration-300">
                            <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)]">Chat Preferences</h2>
                            <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-3xl p-6 shadow-sm space-y-5">
                                <div className="flex items-center justify-between py-2 border-b border-[var(--border-color)]">
                                    <div>
                                        <h4 className="text-sm font-bold">Enter to Send</h4>
                                        <p className="text-xs text-[var(--text-secondary)]">Pressing Enter sends your message</p>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={chatPrefs.enterToSend}
                                        onChange={(e) => setChatPrefs({ ...chatPrefs, enterToSend: e.target.checked })}
                                        className="w-4 h-4 rounded border-[var(--border-color)] text-[var(--color-primary)] cursor-pointer"
                                    />
                                </div>

                                <div className="flex items-center justify-between py-2 border-b border-[var(--border-color)]">
                                    <div>
                                        <h4 className="text-sm font-bold">Auto Scroll</h4>
                                        <p className="text-xs text-[var(--text-secondary)]">Jump to bottom on new messages</p>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={chatPrefs.autoScroll}
                                        onChange={(e) => setChatPrefs({ ...chatPrefs, autoScroll: e.target.checked })}
                                        className="w-4 h-4 rounded border-[var(--border-color)] text-[var(--color-primary)] cursor-pointer"
                                    />
                                </div>

                                <div className="flex items-center justify-between py-2 border-b border-[var(--border-color)]">
                                    <div>
                                        <h4 className="text-sm font-bold">Chat Font Size</h4>
                                        <p className="text-xs text-[var(--text-secondary)]">Adjust message text scaling</p>
                                    </div>
                                    <select
                                        value={chatPrefs.chatFontSize}
                                        onChange={(e) => setChatPrefs({ ...chatPrefs, chatFontSize: e.target.value })}
                                        className="bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl px-3 py-1.5 text-xs font-medium focus:outline-none cursor-pointer"
                                    >
                                        <option value="small">Small</option>
                                        <option value="medium">Medium</option>
                                        <option value="large">Large</option>
                                    </select>
                                </div>

                                <div className="flex items-center justify-between py-2">
                                    <div>
                                        <h4 className="text-sm font-bold">Message Preview</h4>
                                        <p className="text-xs text-[var(--text-secondary)]">Show message content in conversation sidebar</p>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={chatPrefs.messagePreview}
                                        onChange={(e) => setChatPrefs({ ...chatPrefs, messagePreview: e.target.checked })}
                                        className="w-4 h-4 rounded border-[var(--border-color)] text-[var(--color-primary)] cursor-pointer"
                                    />
                                </div>

                                <div className="pt-4 border-t border-[var(--border-color)] flex justify-end">
                                    <button
                                        onClick={saveChatPreferences}
                                        disabled={isSaving}
                                        className="px-5 py-2.5 bg-[var(--color-primary)] text-white text-xs font-bold rounded-xl hover:opacity-90 transition-all shadow-md cursor-pointer disabled:opacity-50"
                                    >
                                        {isSaving ? 'Saving...' : 'Save Chat Preferences'}
                                    </button>
                                </div>
                            </div>
                        </section>
                    )}

                </div>
            </main>
        </div>
    );
};

export default SettingsPage;