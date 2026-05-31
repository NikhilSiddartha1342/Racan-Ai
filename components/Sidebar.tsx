import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, WardrobeItem } from '../types';
import { sendMessageToGemini } from '../services/geminiService';
import { syncToChatsCollection, fetchChatHistory } from '../services/mongoService';

interface SidebarProps {
    items: WardrobeItem[];
    isMobileHidden?: boolean;
    isTyping: boolean;
    setIsTyping: (isTyping: boolean) => void;
    user?: any;
}

const Sidebar: React.FC<SidebarProps> = ({ items, isMobileHidden = false, isTyping, setIsTyping, user }) => {
    const DEFAULT_MESSAGE: ChatMessage = {
        id: 'welcome',
        role: 'model',
        text: "Hi! I'm Racan ai+. I'm here to help with your style, skincare, and beauty questions. Upload a photo or just ask away!",
    };

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isShopMode, setIsShopMode] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    // Persistence: Load Messages
    useEffect(() => {
        setIsLoaded(false); // Reset loading state to prevent saving during transition
        const loadMessages = async () => {
            try {
                // Try fetching from DB first (Source of Truth)
                const dbMessages = await fetchChatHistory(user);

                if (dbMessages && dbMessages.length > 0) {
                    setMessages(dbMessages);
                } else {
                    // Fallback to LocalStorage (User-specific key)
                    const storageKey = user ? `racan_chat_history_${user._id}` : 'racan_chat_history';
                    const storedMessages = localStorage.getItem(storageKey);
                    if (storedMessages) {
                        setMessages(JSON.parse(storedMessages));
                    } else {
                        setMessages([DEFAULT_MESSAGE]);
                    }
                }
            } catch (e) {
                console.error("Failed to load chat history", e);
                setMessages([DEFAULT_MESSAGE]);
            } finally {
                setIsLoaded(true);
            }
        };
        loadMessages();
    }, [user]); // Reload when user changes

    // Persistence: Save Messages
    useEffect(() => {
        if (isLoaded) {
            // Safe storage: Keep only last 50 messages to ensure we don't break LocalStorage quotas
            const messagesToSave = messages.slice(-50);
            const storageKey = user ? `racan_chat_history_${user._id}` : 'racan_chat_history';
            try {
                localStorage.setItem(storageKey, JSON.stringify(messagesToSave));
            } catch (e) {
                console.warn("Chat history full, clearing old messages to save space.");
                localStorage.setItem(storageKey, JSON.stringify(messages.slice(-10)));
            }
        }
    }, [messages, isLoaded]); // Removed user from deps to prevent overwrite during transition

    // MongoDB Collection Sync Effect
    // Triggers whenever messages OR wardrobe items change
    useEffect(() => {
        if (isLoaded) {
            // This function structures the data exactly like your MongoDB schema
            // and saves it to the 'chats' collection simulation
            syncToChatsCollection(messages, items, user);
        }
    }, [messages, items, isLoaded, user]);

    // Scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    const handleClearChat = () => {
        if (window.confirm("Clear chat history?")) {
            const resetState = [DEFAULT_MESSAGE];
            setMessages(resetState);
            const storageKey = user ? `racan_chat_history_${user._id}` : 'racan_chat_history';
            localStorage.setItem(storageKey, JSON.stringify(resetState));
        }
    };

    const handleSend = async (overrideText?: string) => {
        const textToSend = overrideText || inputValue;
        if ((!textToSend.trim() && items.length === 0) || isTyping) return;

        const userMsg: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            text: textToSend || "What do you think of this?",
        };

        setMessages(prev => [...prev, userMsg]);
        setInputValue('');
        setIsTyping(true); // Start animation in WardrobeCanvas

        try {
            // Pass isShopMode to the service
            const response = await sendMessageToGemini(messages, userMsg.text, items, isShopMode);
            setMessages(prev => [...prev, response]);
        } catch (e) {
            console.error(e);
        } finally {
            setIsTyping(false); // Stop animation
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // Helper to get domain from URL
    const getDomain = (url: string) => {
        try {
            return new URL(url).hostname.replace('www.', '');
        } catch {
            return 'Online Store';
        }
    };

    // Simple Markdown Parser for H3 (###) and Bold (**)
    const renderMessageText = (text: string) => {
        const lines = text.split('\n');
        return lines.map((line, i) => {
            // Rating Parser - Enhanced Regex and Styling
            const ratingMatch = line.match(/Rating:\s*\**(\d+(\.\d+)?)\**\/10/i) || line.match(/Score:\s*\**(\d+(\.\d+)?)\**\/10/i);
            if (ratingMatch) {
                const score = ratingMatch[1];
                return (
                    <div key={i} className="flex items-center gap-4 my-4 p-4 bg-gradient-to-r from-neutral-50 to-white dark:from-neutral-900 dark:to-neutral-800 rounded-[18px] border border-neutral-200 dark:border-neutral-700 animate-fade-in">
                        <div className="relative flex items-center justify-center w-14 h-14 bg-[#CCFF00] text-black font-black text-2xl rounded-full shadow-[0_0_15px_rgba(204,255,0,0.3)] border-2 border-white dark:border-neutral-800 font-semibold">
                            {score}
                            <div className="absolute -bottom-1 -right-1 bg-black dark:bg-white text-[#CCFF00] dark:text-black text-[10px] font-semibold px-1.5 py-0.5 rounded-full border border-white dark:border-neutral-900">
                                /10
                            </div>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400 dark:text-neutral-500 mb-0.5">Racan Analysis</span>
                            <span className="text-lg font-semibold text-neutral-900 dark:text-white leading-tight">Style Score</span>
                        </div>
                    </div>
                );
            }

            if (line.trim().startsWith('###')) {
                return (
                    <h3 key={i} className="text-[15px] font-bold mt-4 mb-2 text-neutral-900 dark:text-white font-mono">
                        {line.replace(/###\s?/, '')}
                    </h3>
                );
            }
            const parts = line.split(/(\*\*.*?\*\*)/g);
            return (
                <p key={i} className={`min-h-[1em] ${line.trim() === '' ? 'mb-2' : 'mb-1'}`}>
                    {parts.map((part, j) => {
                        if (part.startsWith('**') && part.endsWith('**')) {
                            return <strong key={j} className="font-semibold text-neutral-900 dark:text-white">{part.slice(2, -2)}</strong>;
                        }
                        return part;
                    })}
                </p>
            );
        });
    };

    if (isMobileHidden) return null;

    return (
        <div className="w-full h-full flex flex-col bg-white dark:bg-neutral-900 transition-colors duration-300 relative overflow-hidden font-sans">

            {/* Clear Chat Button */}
            <button
                onClick={handleClearChat}
                className="absolute top-4 right-4 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-neutral-800 text-gray-400 dark:text-neutral-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors cursor-pointer"
                title="Clear Chat History"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2-2v2"></path></svg>
            </button>

            {/* Chat History */}
            <div className="flex-1 min-h-0 overflow-y-auto p-5 space-y-8 scroll-smooth" ref={scrollRef}>
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-fade-in-up`}>

                        {/* Message Bubble */}
                        <div
                            className={`max-w-[88%] md:max-w-[85%] px-5 py-4 text-[15px] leading-relaxed shadow-sm ${msg.role === 'user'
                                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 rounded-[24px] rounded-tr-sm'
                                : 'bg-gray-50 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200 rounded-[24px] rounded-tl-sm border border-gray-100 dark:border-neutral-700/50'
                                }`}
                        >
                            {msg.role === 'user' ? msg.text : renderMessageText(msg.text)}
                        </div>

                        {/* Shopping Cards */}
                        {msg.searchResults && msg.searchResults.length > 0 && (
                            <div className="mt-5 w-full max-w-[92%]">
                                <div className="text-[10px] font-mono font-medium text-gray-400 dark:text-neutral-500 uppercase tracking-widest mb-3 ml-1">Curated For You</div>
                                <div className="grid grid-cols-1 gap-2.5">
                                    {msg.searchResults.map((link, idx) => (
                                        <a
                                            key={idx}
                                            href={link.uri}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex flex-row items-center justify-between p-2 rounded-[12px] bg-white dark:bg-neutral-800 border border-gray-100 dark:border-neutral-700 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all group no-underline"
                                        >
                                            <div className="flex items-center gap-4 overflow-hidden flex-1">
                                                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors bg-gray-50 dark:bg-neutral-700/50 text-gray-400 dark:text-neutral-400 group-hover:bg-[#CCFF00] group-hover:text-black">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
                                                </div>
                                                <div className="flex flex-col overflow-hidden">
                                                    <span className="text-[15px] font-medium text-neutral-900 dark:text-neutral-100 truncate">
                                                        {link.title}
                                                    </span>
                                                    <span className="text-xs text-gray-400 dark:text-neutral-500 truncate font-mono mt-0.5">
                                                        {getDomain(link.uri)}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Right Action Arrow */}
                                            <div className="w-8 h-8 rounded-full flex items-center justify-center transition-all ml-2 text-gray-300 dark:text-neutral-600 group-hover:bg-neutral-900 group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-neutral-900">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="7" y1="17" x2="17" y2="7"></line><polyline points="7 7 17 7 17 17"></polyline></svg>
                                            </div>
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
                {isTyping && (
                    <div className="flex items-start animate-fade-in-up">
                        <div className="bg-gray-50 dark:bg-neutral-800/50 rounded-[20px] rounded-tl-sm px-5 py-4 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 bg-gray-400 dark:bg-neutral-500 rounded-full animate-bounce"></span>
                            <span className="w-1.5 h-1.5 bg-gray-400 dark:bg-neutral-500 rounded-full animate-bounce delay-75"></span>
                            <span className="w-1.5 h-1.5 bg-gray-400 dark:bg-neutral-500 rounded-full animate-bounce delay-150"></span>
                        </div>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white dark:bg-neutral-900 border-t border-gray-100 dark:border-neutral-800 z-10 relative">

                {/* Shop Mode Indicator */}
                {isShopMode && (
                    <div className="absolute top-2.5 right-0 -translate-y-full px-6 pb-0 flex justify-end pointer-events-none h-5">
                        <span className="mt-[-2px] pt-1 bg-neutral-900 text-[#CCFF00] text-[10px] pl-2 pr-2 font-semibold px-2 py-0.5 rounded-[4px]  uppercase tracking-widest font-mono animate-fade-in">
                            SHOPPING MODE
                        </span>
                    </div>
                )}

                {/* Review Action Chip */}
                {items.length > 0 && !isTyping && (
                    <div className="absolute top-0 left-0 right-0 -translate-y-full px-6 pb-2 flex justify-center pointer-events-none">
                        <button
                            onClick={() => handleSend("Review this look. Rate it out of 10, critique it, and suggest improvements.")}
                            className="pointer-events-auto bg-neutral-900 dark:bg-[#CCFF00] text-white dark:text-black px-4 py-1.5 rounded-full text-xs font-bold shadow-lg hover:scale-105 active:scale-95 transition-transform flex items-center gap-2 cursor-pointer border border-neutral-800 dark:border-transparent"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                            Review Fit
                        </button>
                    </div>
                )}

                <div className={`relative flex items-center rounded-2xl px-3 transition-colors duration-300 ${isShopMode ? 'bg-neutral-100 dark:bg-neutral-800 border border-[#CCFF00]/50' : 'bg-gray-50 dark:bg-neutral-800'}`}>

                    <button
                        onClick={() => setIsShopMode(!isShopMode)}
                        className={`p-2 rounded-xl transition-all duration-200 mr-1 cursor-pointer ${isShopMode
                            ? 'bg-[#CCFF00] text-black shadow-sm scale-105'
                            : 'text-gray-400 dark:text-neutral-500 hover:text-gray-600 dark:hover:text-neutral-300 hover:bg-gray-200 dark:hover:bg-neutral-700'
                            }`}
                        title={isShopMode ? "Shop Mode Active" : "Enable Shop Mode"}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
                    </button>

                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={isShopMode ? "What do you want to buy?" : (items.length > 0 ? "Ask Racan ai+..." : "Upload or ask for tips...")}
                        className="flex-1 bg-transparent border-none focus:ring-0 text-neutral-900 dark:text-white py-4 px-2 placeholder:text-gray-400 dark:placeholder:text-neutral-500 text-[15px] font-normal focus:outline-none"
                    />

                    <button
                        onClick={() => handleSend()}
                        disabled={(!inputValue && items.length === 0) || isTyping}
                        className={`p-2.5 rounded-xl flex items-center justify-center transition-all m-1.5 ${(!inputValue && items.length === 0)
                            ? 'text-gray-300 dark:text-neutral-600 cursor-not-allowed'
                            : 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-md hover:scale-105 active:scale-95 cursor-pointer'
                            }`}
                    >
                        {isTyping ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white dark:border-neutral-300 dark:border-t-neutral-900 rounded-full animate-spin"></div>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;