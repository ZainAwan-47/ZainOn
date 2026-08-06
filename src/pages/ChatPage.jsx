// React
import React from 'react';

// Components
import Avatar from '../components/ui/Avatar';
import IconButton from '../components/ui/IconButton';

export const ChatPage = () => {
    return (
        <div className="h-full w-full flex flex-col min-h-0 bg-slate-950 transition-colors">
            {/* Chat Area Header (68px) */}
            <header className="h-[68px] px-5 border-b border-slate-800 bg-slate-900 flex items-center justify-between shrink-0 shadow-sm">
                <div className="flex items-center space-x-3.5 min-w-0">
                    <Avatar
                        src=""
                        name="Select Conversation"
                        size="md"
                        isOnline={false}
                        showStatus={false}
                    />
                    <div className="flex flex-col min-w-0">
                        <h2 className="text-sm font-bold text-white truncate tracking-tight">
                            No Conversation Selected
                        </h2>
                        <span className="text-xs text-slate-400 font-medium flex items-center space-x-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-500 inline-block" />
                            <span>Offline</span>
                        </span>
                    </div>
                </div>

                {/* Call & Search Controls */}
                <div className="flex items-center space-x-1">
                    <IconButton title="Search message history" disabled size="md">
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
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                        </svg>
                    </IconButton>

                    <IconButton title="Start Voice Call" disabled size="md">
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
                                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                            />
                        </svg>
                    </IconButton>

                    <IconButton title="Start Video Call" disabled size="md">
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
                                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                            />
                        </svg>
                    </IconButton>

                    <div className="w-px h-6 bg-slate-800 mx-1.5" />

                    <IconButton title="Close Conversation" disabled size="md">
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
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </IconButton>
                </div>
            </header>

            {/* Empty State Body Canvas */}
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center select-none">
                <div className="relative mb-6">
                    <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-indigo-500/20 to-violet-500/10 border border-indigo-800/40 flex items-center justify-center text-indigo-400 shadow-2xl ring-8 ring-indigo-950/30">
                        <svg
                            className="w-12 h-12"
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

                <h3 className="text-xl font-bold text-white tracking-tight">
                    No Conversation Selected
                </h3>
                <p className="text-xs text-slate-400 mt-2 max-w-sm leading-relaxed">
                    Choose a conversation from the sidebar to start chatting.
                </p>
            </div>

            {/* Message Composer Footer Bar (72px) */}
            <footer className="h-[72px] px-4 border-t border-slate-800 bg-slate-900 flex items-center shrink-0">
                <div className="w-full flex items-center space-x-2 bg-slate-800/50 border border-slate-700/60 rounded-2xl px-3 py-1.5 focus-within:ring-2 focus-within:ring-indigo-500/30 transition-all">
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
                        className="flex-1 bg-transparent py-2 text-xs text-white placeholder-slate-400 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                    />

                    <IconButton title="Send Message" disabled variant="primary" size="sm">
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