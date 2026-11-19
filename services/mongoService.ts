import { ChatMessage, WardrobeItem, MongoChatDocument } from "../types";

// Helper to get or create a session ID
export const getSessionId = (userId?: string): string => {
    // If we have a userId, we use a specific key for that user's session
    const storageKey = userId ? `racan_session_id_${userId}` : 'racan_session_id';

    let sessionId = localStorage.getItem(storageKey);
    if (!sessionId) {
        sessionId = 'sess_' + (userId ? userId + '_' : '') + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem(storageKey, sessionId);
    }
    return sessionId;
};

// Helper to get a username (mock or real)
const getUsername = (sessionId: string, user?: any): string => {
    if (user && user.name) return user.name;
    return "User_" + sessionId.substr(-4);
};

// Fetch Chat History from Backend
export const fetchChatHistory = async (user?: any): Promise<ChatMessage[] | null> => {
    try {
        const sessionId = getSessionId(user?._id);
        const response = await fetch(`/api/chats/${sessionId}`);

        if (response.status === 404) {
            return null; // No history yet
        }

        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }

        const data = await response.json();
        return data.messages || null;
    } catch (error) {
        console.error("Failed to fetch chat history:", error);
        return null;
    }
};

// Sync to Backend
export const syncToChatsCollection = async (
    messages: ChatMessage[],
    items: WardrobeItem[],
    user?: any
): Promise<void> => {
    try {
        const sessionId = getSessionId(user?._id);
        const username = getUsername(sessionId, user);

        // Construct the payload
        const payload = {
            sessionId,
            username,
            userId: user?._id,
            email: user?.email,
            title: messages.length > 0 ? messages[0].text.substring(0, 50) + "..." : "New Session",
            messages, // Save ALL messages so history is preserved on refresh
            Image: items.length > 0 ? items[0].base64 : "",
        };

        // Call the backend API
        const response = await fetch('/api/chats', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }

        const data = await response.json();
        console.log(`[MongoDB Sync] Chat saved to DB:`, data);

    } catch (error) {
        console.error("Failed to sync to chats collection:", error);
    }
};