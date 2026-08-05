// React
import React from 'react';

// Third Party Libraries
import { Outlet } from 'react-router-dom';

export const AuthLayout = () => {
    return <Outlet />;
};

export default AuthLayout;