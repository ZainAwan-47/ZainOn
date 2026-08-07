// React
import React, { useState } from 'react';

// Hooks & Services
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../context/ToastContext';
import { userService } from '../services/userService';

export const ProfilePage = () => {
    const { user } = useAuth();
    const { showToast } = useToast();

    const [isEditing, setIsEditing] = useState(false);
    const [fullName, setFullName] = useState(user?.fullName || '');
    const [username, setUsername] = useState(user?.username || '');
    const [bio, setBio] = useState(user?.bio || '');
    const [photoURL, setPhotoURL] = useState(user?.photoURL || '');
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async (e) => {
        e.preventDefault();
        if (!user?.uid) return;

        setIsSaving(true);
        try {
            await userService.updateUserProfile(user.uid, {
                fullName: fullName.trim(),
                username: username.trim(),
                bio: bio.trim(),
                photoURL: photoURL.trim(),
            });
            showToast('Profile updated successfully!', 'info');
            setIsEditing(false);
        } catch (error) {
            showToast(error.message || 'Failed to update profile.', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="flex-1 flex flex-col h-full bg-[var(--bg-main)] text-[var(--text-primary)] transition-colors duration-300 overflow-y-auto p-4 sm:p-8">
            <div className="max-w-3xl w-full mx-auto space-y-6">
                <header>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Profile Center</h1>
                    <p className="text-[var(--text-secondary)] text-sm mt-1">
                        View and manage your account details and public identity.
                    </p>
                </header>

                <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-3xl p-6 shadow-sm space-y-6 transition-colors duration-300">
                    <div className="flex items-center space-x-4">
                        <img
                            src={user?.photoURL || 'https://via.placeholder.com/150'}
                            alt={user?.fullName || 'User'}
                            className="w-20 h-20 rounded-full object-cover border-2 border-[var(--border-color)]"
                        />
                        <div>
                            <h2 className="text-lg font-bold">{user?.fullName || user?.displayName || 'Zainon User'}</h2>
                            <p className="text-xs text-[var(--text-secondary)]">@{user?.username || 'user'}</p>
                            <p className="text-xs text-[var(--text-secondary)] mt-1">{user?.email}</p>
                        </div>
                    </div>

                    {!isEditing ? (
                        <div className="space-y-4 pt-4 border-t border-[var(--border-color)]">
                            <div>
                                <span className="text-[11px] font-bold uppercase text-[var(--text-secondary)]">Bio</span>
                                <p className="text-sm mt-1 p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)]">
                                    {user?.bio || user?.status || 'No bio provided.'}
                                </p>
                            </div>
                            <button
                                onClick={() => setIsEditing(true)}
                                className="px-5 py-2.5 bg-[var(--color-primary)] text-white text-xs font-bold rounded-xl hover:opacity-90 transition-all shadow-md cursor-pointer"
                            >
                                Edit Profile
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSave} className="space-y-4 pt-4 border-t border-[var(--border-color)]">
                            <div>
                                <label className="text-xs font-bold text-[var(--text-secondary)]">Full Name</label>
                                <input
                                    type="text"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    className="w-full mt-1 px-3.5 py-2.5 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                                    required
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-[var(--text-secondary)]">Username</label>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full mt-1 px-3.5 py-2.5 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                                    required
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-[var(--text-secondary)]">Avatar Photo URL</label>
                                <input
                                    type="url"
                                    value={photoURL}
                                    onChange={(e) => setPhotoURL(e.target.value)}
                                    placeholder="https://example.com/avatar.jpg"
                                    className="w-full mt-1 px-3.5 py-2.5 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-[var(--text-secondary)]">Bio</label>
                                <textarea
                                    value={bio}
                                    onChange={(e) => setBio(e.target.value)}
                                    rows={3}
                                    className="w-full mt-1 px-3.5 py-2.5 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] resize-none"
                                />
                            </div>

                            <div className="flex space-x-3 pt-2">
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="px-5 py-2.5 bg-[var(--color-primary)] text-white text-xs font-bold rounded-xl hover:opacity-90 transition-all shadow-md cursor-pointer disabled:opacity-50"
                                >
                                    {isSaving ? 'Saving...' : 'Save Changes'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsEditing(false)}
                                    className="px-5 py-2.5 bg-[var(--bg-surface-hover)] text-[var(--text-primary)] border border-[var(--border-color)] text-xs font-bold rounded-xl transition-all cursor-pointer"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;