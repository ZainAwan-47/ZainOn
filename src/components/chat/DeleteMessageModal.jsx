// React
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const DeleteMessageModal = ({ isOpen, onClose, onDelete, canDeleteForEveryone }) => {
    if (!isOpen) return null;

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.92, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: 16 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                onClick={(e) => e.stopPropagation()}
                className="relative bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-3xl w-full max-w-sm p-6 shadow-2xl text-center space-y-4 z-10"
            >
                <div className="w-12 h-12 rounded-2xl bg-[var(--color-danger)]/10 text-[var(--color-danger)] flex items-center justify-center mx-auto">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </div>
                <h3 className="text-base font-bold text-[var(--text-primary)]">Delete Message?</h3>
                <p className="text-xs text-[var(--text-secondary)]">Choose how you want this message to be removed.</p>

                <div className="flex flex-col space-y-2 pt-2">
                    {canDeleteForEveryone && (
                        <button
                            type="button"
                            onClick={() => onDelete(true)}
                            className="w-full py-2.5 px-4 bg-[var(--color-danger)] text-white text-xs font-bold rounded-xl hover:opacity-90 transition-all cursor-pointer"
                        >
                            Delete for Everyone
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={() => onDelete(false)}
                        className="w-full py-2.5 px-4 bg-[var(--bg-surface-hover)] text-[var(--text-primary)] border border-[var(--border-color)] text-xs font-bold rounded-xl hover:bg-[var(--border-color)] transition-all cursor-pointer"
                    >
                        Delete for Me
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-full py-2 px-4 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                    >
                        Cancel
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default DeleteMessageModal;