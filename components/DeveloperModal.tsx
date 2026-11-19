import React from 'react';

interface DeveloperModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const DeveloperModal: React.FC<DeveloperModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md animate-fade-in p-4">
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 md:p-8 w-full max-w-[440px] shadow-2xl flex flex-col items-center text-center relative animate-scale-in">
                
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                    ✕
                </button>

                {/* Profile Photo */}
                <div className="relative mb-5">
                    <div className="w-36 h-36 rounded-full overflow-hidden border-4 border-indigo-500/30 p-1 shadow-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500">
                        <img
                            src="/developer.jpg"
                            alt="Nikhil Siddartha - Sole Developer"
                            className="w-full h-full object-cover rounded-full"
                        />
                    </div>
                    <span className="absolute bottom-1 right-2 bg-emerald-500 w-4 h-4 rounded-full border-2 border-white dark:border-neutral-900"></span>
                </div>

                {/* Developer Info */}
                <span className="text-[11px] font-mono font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-1">
                    Creator & Sole Developer
                </span>
                <h3 className="text-2xl font-bold text-neutral-900 dark:text-white mb-1">
                    Nikhil Siddartha
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4 font-mono">
                    Full-Stack AI & System Architect
                </p>

                <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed mb-6 px-2">
                    Designed, built, and deployed the entire <strong className="text-neutral-900 dark:text-white font-semibold">Racan AI+</strong> platform — encompassing Gemini AI integration, multi-model fallback, intelligent lookbook canvas, and real-time wardrobe synchronization.
                </p>

                {/* Links / Badges */}
                <div className="flex items-center gap-3 w-full justify-center">
                    <a
                        href="https://github.com/NikhilSiddartha1342"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 rounded-full bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold flex items-center gap-2 transition-colors"
                    >
                        GitHub Profile
                    </a>
                    <a
                        href="https://github.com/NikhilSiddartha1342/Racan-Ai"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 rounded-full bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-semibold flex items-center gap-2 transition-colors border border-neutral-300 dark:border-neutral-700"
                    >
                        Project Repo
                    </a>
                </div>
            </div>
        </div>
    );
};

export default DeveloperModal;
