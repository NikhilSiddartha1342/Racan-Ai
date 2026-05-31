import React, { useState, useEffect } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Sidebar from './components/Sidebar';
import WardrobeCanvas from './components/WardrobeCanvas';
import LoginModal from './components/LoginModal';
import LogoutModal from './components/LogoutModal';
import { WardrobeItem } from './types';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com";

const App: React.FC = () => {
  const [items, setItems] = useState<WardrobeItem[]>([]);
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'wardrobe' | 'chat'>('wardrobe');
  const [isTyping, setIsTyping] = useState(false); // Shared state for AI processing/scanning
  const [isLoaded, setIsLoaded] = useState(false); // Track if hydration is complete
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);

  // Theme Management
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    // Check local storage or system preference
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('theme');
      if (stored) return stored === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return true; // Default to dark
  });

  // Load user from local storage
  useEffect(() => {
    const storedUser = localStorage.getItem('racan_user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser) {
          setUser(parsedUser);
        } else {
          setIsLoginOpen(true);
        }
      } catch (e) {
        console.error("Failed to parse stored user", e);
        localStorage.removeItem('racan_user');
        setIsLoginOpen(true); // Force login if data is corrupt
      }
    } else {
      setIsLoginOpen(true); // Force login if no data
    }
  }, []);

  // Save user to local storage
  useEffect(() => {
    if (user) {
      localStorage.setItem('racan_user', JSON.stringify(user));
      setIsLoginOpen(false); // Close modal on successful login
    } else {
      // If user becomes null (e.g. logout or initial state), ensure modal opens
      setIsLoginOpen(true);
    }
  }, [user]);

  // Force login check on mount (Backup)
  useEffect(() => {
    if (!user) {
      setIsLoginOpen(true);
    }
  }, []);

  // --- PERSISTENCE LOGIC FOR WARDROBE ITEMS ---

  // Helper to convert Base64 back to File object
  const base64ToFile = (base64: string, filename: string): File => {
    const arr = base64.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/png';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  };

  // Load items from LocalStorage on mount
  useEffect(() => {
    const loadItems = async () => {
      try {
        const storedItems = localStorage.getItem('racan_wardrobe_items');
        if (storedItems) {
          const parsedItems: any[] = JSON.parse(storedItems);
          // Hydrate: Convert stored base64 back to Files and Object URLs
          const hydratedItems: WardrobeItem[] = parsedItems.map(item => ({
            ...item,
            file: base64ToFile(item.base64, `restored-${item.id}.png`),
            url: item.base64 // Use base64 directly for src to avoid revoking issues with objectURLs on refresh logic
          }));
          setItems(hydratedItems);
        }
      } catch (e) {
        console.error("Failed to load wardrobe:", e);
      } finally {
        setIsLoaded(true);
      }
    };
    loadItems();
  }, []);

  // Save items to LocalStorage whenever they change
  useEffect(() => {
    if (!isLoaded) return; // Don't save empty state before loading finishes
    try {
      // We store the base64, id, and type. We don't store the File object or Object URL string.
      const itemsToStore = items.map(({ id, base64, type }) => ({ id, base64, type }));
      localStorage.setItem('racan_wardrobe_items', JSON.stringify(itemsToStore));
    } catch (e) {
      console.warn("Storage quota exceeded, could not save wardrobe.", e);
    }
  }, [items, isLoaded]);

  // --- THEME LOGIC ---

  useEffect(() => {
    const html = document.documentElement;
    if (darkMode) {
      html.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      html.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const toggleTheme = () => setDarkMode(!darkMode);

  const handleLogout = () => {
    setIsLogoutOpen(true);
  };

  const confirmLogout = () => {
    setUser(null);
    localStorage.removeItem('racan_user');
    setIsLogoutOpen(false);
    setIsLoginOpen(true);
  };

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <div className={`flex flex-col md:flex-row h-[100dvh] w-screen bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white overflow-hidden font-sans transition-colors duration-300 ${!user ? 'filter blur-md pointer-events-none' : ''}`}>

        {/* HEADER (Mobile & Desktop shared styles, slightly different content) */}
        <header className="h-16 flex-shrink-0 border-b border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-6 flex items-center justify-between z-30 md:hidden">
          <div className="flex items-center gap-3">
            <img src="https://i.postimg.cc/VsFmP0Fm/Racan-ai.jpg" alt="Racan ai+" className="w-8 h-8 rounded-lg object-cover" />
            <span className="font-bold text-lg tracking-tight font-mono">Racan ai+</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={user ? handleLogout : () => setIsLoginOpen(true)}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors text-gray-500 dark:text-gray-400 cursor-pointer"
              title={user ? "Logout" : "Login"}
            >
              {user && user.avatar ? (
                <img src={user.avatar} referrerPolicy="no-referrer" className="w-6 h-6 rounded-full border border-gray-200 dark:border-neutral-700" alt="Profile" />
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              )}
            </button>
            <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-500 dark:text-gray-400 cursor-pointer">
              {darkMode ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
              )}
            </button>
          </div>
        </header>

        {/* Desktop Sidebar Container (Always visible on MD+, handles its own header) */}
        <div className="hidden md:flex md:w-[420px] md:flex-col h-full z-20 border-r border-gray-200 dark:border-neutral-800">
          {/* Desktop Header - Fixed Height, No Shrink */}
          <div className="h-20 flex-shrink-0 p-6 border-b border-gray-200 dark:border-neutral-800 flex items-center justify-between bg-white dark:bg-neutral-900 transition-colors">
            <div className="flex items-center gap-3">
              <img src="https://i.postimg.cc/VsFmP0Fm/Racan-ai.jpg" alt="Racan ai+" className="w-10 h-10 rounded-xl object-cover shadow-sm" />
              <div>
                <h1 className="font-bold text-lg leading-none font-mono">Racan ai+</h1>
                <span className="text-xs text-gray-500 dark:text-neutral-500 font-medium">Personal Stylist</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={user ? handleLogout : () => setIsLoginOpen(true)}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors text-gray-500 dark:text-gray-400 cursor-pointer"
                title={user ? "Logout" : "Login"}
              >
                {user && user.avatar ? (
                  <img src={user.avatar} referrerPolicy="no-referrer" className="w-6 h-6 rounded-full border border-gray-200 dark:border-neutral-700" alt="Profile" />
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                )}
              </button>
              <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors text-gray-500 dark:text-gray-400 cursor-pointer">
                {darkMode ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
                )}
              </button>
            </div>
          </div>

          {/* Sidebar Content Wrapper - Takes remaining height */}
          <div className="flex-1 min-h-0 relative">
            <Sidebar items={items} isTyping={isTyping} setIsTyping={setIsTyping} user={user} />
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col h-full overflow-hidden relative">
          {/* Mobile Content Switcher */}
          <div className="flex-1 overflow-hidden relative flex flex-col min-h-0">
            <div className={`w-full h-full ${activeTab === 'wardrobe' ? 'block' : 'hidden'} md:block relative`}>
              <WardrobeCanvas items={items} setItems={setItems} isScanning={isTyping} />
            </div>
            {/* Mobile Sidebar Wrapper - Explicit Height Control */}
            <div className={`w-full h-full ${activeTab === 'chat' ? 'flex flex-col' : 'hidden'} md:hidden bg-white dark:bg-neutral-900`}>
              <Sidebar items={items} isTyping={isTyping} setIsTyping={setIsTyping} user={user} />
            </div>
          </div>

          {/* Mobile Bottom Navigation - Fixed Height */}
          <div className="md:hidden flex-shrink-0 flex items-center justify-around h-16 bg-white dark:bg-neutral-900 border-t border-gray-200 dark:border-neutral-800 z-40">
            <button
              onClick={() => setActiveTab('wardrobe')}
              className={`flex flex-col items-center justify-center gap-1.5 w-full h-full ${activeTab === 'wardrobe' ? 'text-neutral-900 dark:text-white' : 'text-gray-400 dark:text-neutral-600'} cursor-pointer`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
              <span className="text-[10px] font-bold uppercase tracking-widest font-mono">Lookbook</span>
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex flex-col items-center justify-center gap-1.5 w-full h-full ${activeTab === 'chat' ? 'text-neutral-900 dark:text-white' : 'text-gray-400 dark:text-neutral-600'} cursor-pointer`}
            >
              <div className="relative">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                {items.length > 0 && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-500 rounded-full border-2 border-white dark:border-neutral-900"></span>}
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest font-mono">Stylist</span>
            </button>
          </div>
        </div>
      </div>

      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => {
          if (user) setIsLoginOpen(false);
        }}
        onLoginSuccess={(u) => setUser(u)}
        canClose={!!user}
      />
      <LogoutModal
        isOpen={isLogoutOpen}
        onClose={() => setIsLogoutOpen(false)}
        onConfirm={confirmLogout}
      />
    </GoogleOAuthProvider>
  );
};

export default App;