// React
import React from 'react';

// Third Party Libraries
import { Outlet } from 'react-router-dom';

export const ProtectedRoute = () => {
    return <Outlet />;
};

export default ProtectedRoute;