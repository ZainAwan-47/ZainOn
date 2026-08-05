// React
import React from 'react';

// Third Party Libraries
import { Outlet } from 'react-router-dom';

export const AuthLayout = () => {
    return (
        <div className="min-h-screen w-full bg-slate-50 dark:bg-slate-950 flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 transition-colors">
            <main className="w-full flex justify-center items-center">
                <Outlet />
            </main>
        </div>
    );
};

export default AuthLayout;