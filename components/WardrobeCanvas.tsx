import React, { useRef, useState } from 'react';
import { WardrobeItem } from '../types';

interface WardrobeCanvasProps {
    items: WardrobeItem[];
    setItems: React.Dispatch<React.SetStateAction<WardrobeItem[]>>;
    isMobileHidden?: boolean;
    isScanning?: boolean;
}

const WardrobeCanvas: React.FC<WardrobeCanvasProps> = ({ items, setItems, isMobileHidden = false, isScanning = false }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const [previewImage, setPreviewImage] = useState<string | null>(null);

    // Helper: Compress and resize image before storing
    // This is CRITICAL for LocalStorage persistence (limit is ~5MB)
    const processImage = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target?.result as string;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;

                    // Max dimension 1024px to ensure it fits in storage
                    const MAX_SIZE = 1024;
                    if (width > height) {
                        if (width > MAX_SIZE) {
                            height *= MAX_SIZE / width;
                            width = MAX_SIZE;
                        }
                    } else {
                        if (height > MAX_SIZE) {
                            width *= MAX_SIZE / height;
                            height = MAX_SIZE;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, width, height);

                    // Compress to JPEG with 0.7 quality
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                    resolve(dataUrl);
                };
                img.onerror = (err) => reject(err);
            };
            reader.onerror = (err) => reject(err);
        });
    };

    const handleFiles = async (files: FileList | null) => {
        if (!files) return;
        setIsProcessing(true);

        const newItems: WardrobeItem[] = [];

        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                if (file.type.startsWith('image/')) {
                    // Compress image so it survives refresh in LocalStorage
                    const base64 = await processImage(file);

                    newItems.push({
                        id: Date.now().toString() + i,
                        url: base64, // Use the compressed base64 for display immediately
                        file: file,  // Keep original file in memory for this session
                        base64: base64, // Store compressed version
                        type: 'other'
                    });
                }
            }
            setItems(prev => [...prev, ...newItems]);
        } catch (error) {
            console.error("Error processing images:", error);
            alert("Some images could not be processed. Please try again.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        handleFiles(e.dataTransfer.files);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        if (e.currentTarget.contains(e.relatedTarget as Node)) return;
        setIsDragging(false);
    };

    const removeItem = (id: string) => {
        setItems(prev => prev.filter(item => item.id !== id));
    };

    if (isMobileHidden) return null;

    return (
        <div className="flex-1 h-full bg-gray-50 dark:bg-neutral-950 relative overflow-hidden flex flex-col transition-colors duration-300 font-sans">

            {/* Mobile Top Actions */}
            <div className="absolute top-4 right-4 z-10 md:hidden">
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-10 h-10 rounded-full bg-[#CCFF00] text-black flex items-center justify-center shadow-lg hover:bg-[#b3e600] transition-colors"
                    disabled={isProcessing}
                >
                    {isProcessing ? (
                        <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
                    )}
                </button>
            </div>

            {/* Desktop Top Bar */}
            <div className="hidden md:flex absolute top-0 left-0 right-0 p-8 justify-between items-start z-10 pointer-events-none">
                <div>
                    <h2 className="text-3xl font-bold text-neutral-900 dark:text-white tracking-tight">Lookbook</h2>
                    <p className="text-gray-500 dark:text-neutral-500 mt-1">Drag & drop to curate</p>
                </div>
                <div className="pointer-events-auto">
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isProcessing}
                        className="cursor-pointer bg-[#CCFF00] text-black px-6 py-2.5 rounded-full font-medium text-sm hover:bg-[#b3e600] transition-colors shadow-xl flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isProcessing ? (
                            <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                        )}
                        {isProcessing ? 'Optimizing...' : 'Upload'}
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        multiple
                        accept="image/*"
                        onChange={(e) => handleFiles(e.target.files)}
                    />
                </div>
            </div>

            {/* Main Canvas Area */}
            <div
                className={`flex-1 p-4 md:p-8 md:pt-32 overflow-y-auto transition-all duration-300 relative ${isDragging
                    ? 'bg-green-50/50 dark:bg-green-900/10'
                    : ''
                    }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
            >
                {isDragging && (
                    <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none bg-white/50 dark:bg-black/50 backdrop-blur-sm animate-pulse-slow border-4 border-[#CCFF00] rounded-xl m-4">
                        <div className="bg-[#CCFF00] text-black px-8 py-4 rounded-full shadow-2xl scale-110 font-bold tracking-widest uppercase font-mono">
                            Drop to Upload
                        </div>
                    </div>
                )}

                {items.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-50 px-6">
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="w-20 h-20 rounded-3xl bg-gray-200 dark:bg-neutral-900 flex items-center justify-center mb-6 border border-gray-300 dark:border-neutral-800 cursor-pointer hover:scale-105 transition-transform"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 dark:text-neutral-500"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"></path><path d="M12 12v9"></path><path d="m16 16-4-4-4 4"></path></svg>
                        </div>
                        <p className="text-neutral-800 dark:text-neutral-200 font-semibold text-lg">Your Canvas is Empty</p>
                        <p className="text-gray-500 dark:text-neutral-500 text-sm mt-2 max-w-xs">Tap icon or drag items here to start your styling session.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-8 md:gap-12 pb-20 md:pb-0">
                        {items.map((item) => (
                            <div key={item.id} className="group relative aspect-[3/4] flex items-center justify-center animate-scale-in">

                                {isScanning && (
                                    <div className="absolute inset-0 z-20 pointer-events-none rounded-[1px] overflow-hidden border-2 border-[#CCFF00]/50 shadow-[0_0_15px_rgba(204,255,0,0.3)]">
                                        <div className="absolute w-full h-[4px] bg-[#CCFF00] shadow-[0_0_10px_#CCFF00] animate-scan opacity-80"></div>
                                        <div className="absolute inset-0 bg-[#CCFF00]/5"></div>
                                    </div>
                                )}

                                <img
                                    src={item.url}
                                    alt="Wardrobe item"
                                    onClick={() => setPreviewImage(item.url)}
                                    className="max-w-full max-h-full object-contain drop-shadow-xl rounded-[20px] hover:scale-[1.02] transition-transform duration-300 cursor-zoom-in"
                                />

                                <button
                                    onClick={(e) => { e.stopPropagation(); removeItem(item.id); }}
                                    className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-gray-200 dark:bg-neutral-800 text-gray-500 dark:text-neutral-400 flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity hover:bg-red-100 hover:text-red-500 z-30"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                </button>
                            </div>
                        ))}

                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="aspect-[3/4] rounded-2xl border-2 border-dashed border-gray-200 dark:border-neutral-800 hover:border-gray-400 dark:hover:border-neutral-600 flex flex-col items-center justify-center text-gray-300 dark:text-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-900/50 transition-all"
                            disabled={isProcessing}
                        >
                            {isProcessing ? (
                                <div className="w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                            )}
                        </button>
                    </div>
                )}
            </div>

            {/* Full Screen Image Preview Modal */}
            {previewImage && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm animate-in fade-in duration-200"
                    onClick={() => setPreviewImage(null)}
                >
                    <button
                        onClick={() => setPreviewImage(null)}
                        className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                    <img
                        src={previewImage}
                        alt="Full screen preview"
                        className="max-w-[95vw] max-h-[95vh] object-contain shadow-2xl rounded-lg animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking the image itself
                    />
                </div>
            )}
        </div>
    );
};

export default WardrobeCanvas;