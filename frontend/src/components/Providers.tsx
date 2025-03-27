'use client';

import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "react-hot-toast";
import { GoogleOAuthProvider } from '@react-oauth/google';
import { useEffect } from 'react';
import toast from 'react-hot-toast';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

if (!GOOGLE_CLIENT_ID) {
    console.error('NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set');
}

export default function Providers({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        if (!GOOGLE_CLIENT_ID) {
            toast.error('Google authentication is not properly configured');
        }
    }, []);

    return (
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
            <AuthProvider>
                {children}
                <Toaster position="bottom-right" />
            </AuthProvider>
        </GoogleOAuthProvider>
    );
} 