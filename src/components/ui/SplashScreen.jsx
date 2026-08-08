// React
import React from 'react';

export const SplashScreen = ({ message = 'Loading your workspace...' }) => {
    return (
        <div className="fixed inset-0 h-screen w-screen bg-[#0b0f19] text-white flex flex-col items-center justify-center select-none z-50 transition-opacity duration-300">
            {/* Brand Logo & Icon */}
            <div className="flex flex-col items-center space-y-4">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-violet-500 flex items-center justify-center shadow-2xl shadow-blue-500/30 ring-1 ring-white/10">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                </div>
                <div className="flex flex-col items-center">
                    <span className="text-2xl font-black tracking-tight text-white">ZainOn</span>
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest mt-1">Realtime Workspace</span>
                </div>
            </div>

            {/* Loadbar / Progress Indicator */}
            <div className="w-48 h-1.5 bg-slate-900 rounded-full overflow-hidden mt-8 border border-slate-800">
                <div className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-violet-500 rounded-full animate-indeterminate" />
            </div>

            {/* Status Message */}
            <span className="text-xs font-medium text-slate-400 mt-4 animate-pulse">
                {message}
            </span>
        </div>
    );
};

export default SplashScreen;