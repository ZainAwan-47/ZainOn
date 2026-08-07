// React
import React from 'react';
import { Link } from 'react-router-dom';

export const NotFoundPage = () => {
    return (
        <div className="flex-1 flex flex-col items-center justify-center h-screen bg-[var(--bg-main)] text-[var(--text-primary)] p-6 text-center transition-colors duration-300 select-none">
            <h1 className="text-6xl font-black text-[var(--color-primary)] mb-2">404</h1>
            <h2 className="text-xl font-bold tracking-tight mb-1">Page Not Found</h2>
            <p className="text-xs text-[var(--text-secondary)] max-w-sm mb-6">
                The page you are looking for does not exist or has been moved.
            </p>
            <Link
                to="/"
                className="px-5 py-2.5 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white text-xs font-bold rounded-xl transition-all shadow-md"
            >
                Return Home
            </Link>
        </div>
    );
};

export default NotFoundPage;