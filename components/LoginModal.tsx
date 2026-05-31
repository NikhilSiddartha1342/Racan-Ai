import React from 'react';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { jwtDecode } from "jwt-decode";

interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLoginSuccess: (user: any) => void;
    canClose?: boolean;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLoginSuccess, canClose = true }) => {
    if (!isOpen) return null;

    const handleSuccess = async (credentialResponse: CredentialResponse) => {
        if (credentialResponse.credential) {
            const decoded: any = jwtDecode(credentialResponse.credential);
            console.log('Google User:', decoded);

            try {
                const res = await fetch('/api/auth/google', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        token: credentialResponse.credential,
                        userInfo: decoded
                    }),
                });

                if (res.ok) {
                    const data = await res.json();
                    onLoginSuccess(data.user);
                    onClose();
                } else {
                    console.error('Login failed on server');
                }
            } catch (err) {
                console.error('Login error:', err);
            }
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md animate-fade-in">
            {/* Modal Card */}
            <div className="bg-white rounded-[8px] p-6 md:p-12 w-full max-w-[480px] shadow-2xl flex flex-col items-center text-center relative animate-scale-in mx-4">




                {/* Headline */}
                <h2 className="text-2xl md:text-[32px] leading-tight font-semibold text-neutral-900 mb-2">
                    Welcome to Racan AI
                </h2>
                <h2 className="text-2xl md:text-[32px] leading-tight font-semibold text-neutral-900 mb-8 md:mb-10">
                    your AI Fashion Assistant &<span className="text-black font-bold">personal Stylist.</span>
                </h2>

                {/* Permission Alert (Visual Only) */}
                <div className="w-full bg-white border border-gray-100 rounded-2xl p-4 mb-6 shadow-sm flex items-center gap-3 text-left">
                    <div className="text-neutral-900 flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z" /></svg>
                    </div>
                    <div>
                        <div className="text-[13px] font-semibold text-neutral-900"> Login and Get Started with Racan AI</div>
                        <div className="text-[12px] text-gray-500">Racana ai Lookbook helps you to plan your wardrobe and get the best outfit for the day.</div>
                    </div>
                </div>

                {/* Google Login Button Container */}
                <div className="w-full flex justify-center mb-6">
                    <div className="w-full flex justify-center">
                        <GoogleLogin
                            onSuccess={handleSuccess}
                            onError={() => {
                                console.log('Login Failed');
                            }}
                            theme="filled_black"
                            shape="pill"
                            text="continue_with"
                            width="300"
                            size="large"
                        />
                    </div>
                </div>

                {/* Footer Text */}
                <p className="text-[11px] text-gray-400 leading-relaxed max-w-[90%]">
                    By clicking "Continue with Google", you acknowledge that you have read and understood, and agree to LookBook's Terms & Conditions and Privacy Policy.
                </p>

            </div>

            {/* Bottom Branding (Outside Modal) */}
            <div className="absolute bottom-8 left-0 right-0 hidden md:flex justify-between px-12 pointer-events-none">
                <div className="text-xl font-bold text-neutral-900">Racan ai</div>
                <div className="text-lg text-neutral-600">AI Fashion Assistant <span className="mx-2">✦</span> your wardrobe</div>
            </div>
        </div>
    );
};

export default LoginModal;
