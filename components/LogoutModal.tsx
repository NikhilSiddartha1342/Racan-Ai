import React from 'react';

interface LogoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

const LogoutModal: React.FC<LogoutModalProps> = ({ isOpen, onClose, onConfirm }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-md animate-fade-in">
            <div className="bg-white dark:bg-neutral-900 rounded-[50px] p-8 w-full max-w-sm shadow-2xl flex flex-col items-center text-center relative animate-scale-in mx-4 border border-gray-100 dark:border-neutral-800">

                <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">
                    Log out?
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
                    Are you sure you want to log out of your account?
                </p>

                <div className="flex gap-3 w-full">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 px-6 rounded-full bg-gray-100 dark:bg-neutral-800 text-neutral-900 dark:text-white font-medium hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 py-3 px-6 rounded-full bg-black dark:bg-white text-white dark:text-black font-medium hover:bg-neutral-800 dark:hover:bg-gray-200 transition-colors cursor-pointer"
                    >
                        Log out
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LogoutModal;
