export interface WardrobeItem {
    id: string;
    url: string; // Base64 or Object URL
    file: File;
    base64: string; // Keep pure base64 for API
    type: 'top' | 'bottom' | 'shoes' | 'accessory' | 'other';
}

export interface SearchResult {
    title: string;
    uri: string;
}

export interface ChatMessage {
    id: string;
    role: 'user' | 'model';
    text: string;
    searchResults?: SearchResult[];
    isLoading?: boolean;
}

// MongoDB Schema Definition based on user request
export interface MongoChatDocument {
    _id: string;
    sessionId: string;
    username: string;
    title: string;
    messages: ChatMessage[];
    images: string[]; // Base64 strings of the wardrobe
    createdAt: string;
    updatedAt: string;
    __v: number;
}