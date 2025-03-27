'use client';

import { SessionProvider } from "next-auth/react";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "react-hot-toast";

export default function Providers({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            <AuthProvider>
                {children}
                <Toaster position="bottom-right" />
            </AuthProvider>
        </SessionProvider>
    );
} 