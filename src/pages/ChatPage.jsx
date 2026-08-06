// React
import React from 'react';

// Components
import Avatar from '../components/ui/Avatar';
import IconButton from '../components/ui/IconButton';

export const ChatPage = () => {
    return (
        <div className="h-full w-full flex flex-col min-h-0 bg-slate-950 transition-colors select-none">
            {/* Refined Glassmorphism Chat Header (74px) */}
            <header className="h-[74px] px-6 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md flex items-center justify-between shrink-0 shadow-md">
                <div className="flex items-center space-x-4 min-w-0">
                    <Avatar
                        src=""
                        name="Select Conversation"
                        size="md"
                        isOnline={false}
                        showStatus={false}
                    />
                    <div className="flex flex-col min-w-0">
                        <h2 className="text-base font-bold text-white truncate tracking-tight">
                            No Conversation Selected
                        </h2>
                        <span className="text-xs text-slate-400 font-medium flex items-center space-x-1.5 mt-0.5">
                            <span className="w-2 h-2 rounded-full bg-slate-500 inline-block" />
                            <span>Offline</span>
                        </span>
                    </div>
                </div>

                {/* Call & Action Controls */}
                <div className="flex items-center space-x-1.5">
                    <IconButton title="Search message history" disabled size="md">
                        <svg
                            className="w-4.5 h-4.5"
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
                    </IconButton>

                    <IconButton title="Start Voice Call" disabled size="md">
                        <svg
                            className="w-4.5 h-4.5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                            />
                        </svg>
                    </IconButton>

                    <IconButton title="Start Video Call" disabled size="md">
                        <svg
                            className="w-4.5 h-4.5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                            />
                        </svg>
                    </IconButton>

                    <div className="w-px h-6 bg-slate-800 mx-2" />

                    <IconButton title="Close Active Conversation" disabled size="md">
                        <svg
                            className="w-4.5 h-4.5"
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
            </header>

            {/* Spacing Empty State Canvas */}
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <div className="relative mb-6">
                    <div className="w-28 h-28 rounded-[2.25rem] bg-gradient-to-tr from-indigo-600/20 via-indigo-500/10 to-violet-500/10 border border-indigo-700/40 flex items-center justify-center text-indigo-400 shadow-2xl ring-8 ring-indigo-950/40">
                        <svg
                            className="w-14 h-14"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="1.5"
                                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                            />
                        </svg>
                    </div>
                </div>

                <h3 className="text-2xl font-bold text-white tracking-tight">
                    No Conversation Selected
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 mt-2.5 max-w-md leading-relaxed font-normal">
                    Choose a conversation from the sidebar to start chatting.
                </p>
            </div>

            {/* Message Composer Footer Bar (76px) */}
            <footer className="h-[76px] px-6 border-t border-slate-800 bg-slate-900 flex items-center shrink-0">
                <div className="w-full h-14 flex items-center space-x-3 bg-slate-800/60 border border-slate-700/60 rounded-2xl px-4 py-2 focus-within:border-indigo-500/80 focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all duration-200">
                    <IconButton title="Attach File" disabled size="sm">
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
                                d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                            />
                        </svg>
                    </IconButton>

                    <IconButton title="Insert Emoji" disabled size="sm">
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
                                d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                    </IconButton>

                    <input
                        type="text"
                        placeholder="Select a conversation to type a message..."
                        disabled
                        className="flex-1 bg-transparent text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                    />

                    <IconButton title="Send Message" disabled variant="primary" size="sm">
                        <svg
                            className="w-4.5 h-4.5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                            />
                        </svg>
                    </IconButton>
                </div>
            </footer>
        </div>
    );
};

export default ChatPage;