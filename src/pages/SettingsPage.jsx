// React
import React from 'react';

// Context
import { useTheme } from '../context/ThemeContext';

export const SettingsPage = () => {
    const { theme, setTheme } = useTheme();

    const themeOptions = [
        {
            id: 'light',
            label: 'Light Mode',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
            )
        },
        {
            id: 'dark',
            label: 'Pure Black',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
            )
        },
        {
            id: 'navy',
            label: 'System Auto',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
            )
        }
    ];

    return (
        <div className="flex-1 flex flex-col h-full bg-[var(--bg-main)] text-[var(--text-primary)] transition-colors duration-300 overflow-y-auto p-4 sm:p-8">
            <div className="max-w-3xl w-full mx-auto space-y-8">
                <header>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Settings</h1>
                    <p className="text-[var(--text-secondary)] text-sm mt-1">
                        Manage your application preferences and appearance.
                    </p>
                </header>

                <section className="space-y-4">
                    <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)]">
                        Appearance
                    </h2>

                    <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-3xl p-6 shadow-sm transition-colors duration-300">
                        <h3 className="text-base font-bold mb-1">Theme Preference</h3>
                        <p className="text-xs text-[var(--text-secondary)] mb-6">
                            Select how you would like the application interface to look. System auto uses the original system navy blue theme.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {themeOptions.map(option => (
                                <button
                                    key={option.id}
                                    onClick={() => setTheme(option.id)}
                                    className={`flex flex-col items-center justify-center p-5 rounded-2xl border-2 transition-all duration-200 cursor-pointer ${theme === option.id || (option.id === 'navy' && theme === 'system')
                                            ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)] shadow-inner'
                                            : 'border-[var(--border-color)] bg-[var(--bg-main)] hover:border-[var(--text-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                                        }`}
                                >
                                    <div className="mb-3">
                                        {option.icon}
                                    </div>
                                    <span className="text-sm font-bold">{option.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default SettingsPage;