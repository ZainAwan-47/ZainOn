// React
import React from 'react';

// Context
import { CallContext } from '../context/CallContext';

export const CallProvider = ({ children }) => {
    return (
        <CallContext.Provider value={null}>
            {children}
        </CallContext.Provider>
    );
};

export default CallProvider;