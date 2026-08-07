// React
import React, { memo } from 'react';

// Third Party
import { motion, AnimatePresence } from 'framer-motion';

export const DeleteChatModal = memo(({ isOpen, onConfirm, onCancel, recipientName = 'User' }) => {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
                onClick={onCancel}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full max-w-sm bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-3xl p-6 shadow-2xl flex flex-col space-y-5 select-none transition-colors duration-300"
                >
                    <div className="flex items-center space-x-3 text-[var(--color-danger)]">
                        <div className="w-10 h-10 rounded-2xl bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/20 flex items-center justify-center shrink-0">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-[var(--text-primary)] tracking-tight">Delete Chat?</h3>
                            <p className="text-xs text-[var(--text-secondary)]">This action cannot be undone.</p>
                        </div>
                    </div>

                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                        Are you sure you want to delete your conversation with{' '}
                        <span className="font-bold text-[var(--text-primary)]">{recipientName}</span>? All shared message history will be permanently erased.
                    </p>

                    <div className="flex items-center space-x-3 pt-1">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="flex-1 py-2.5 px-4 bg-[var(--bg-surface-hover)] hover:opacity-90 text-[var(--text-primary)] rounded-xl font-semibold text-xs border border-[var(--border-color)] transition-all active:scale-95 cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={onConfirm}
                            className="flex-1 py-2.5 px-4 bg-[var(--color-danger)] hover:opacity-90 text-white rounded-xl font-semibold text-xs transition-all shadow-md active:scale-95 cursor-pointer"
                        >
                            Delete
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
});

DeleteChatModal.displayName = 'DeleteChatModal';
export default DeleteChatModal;