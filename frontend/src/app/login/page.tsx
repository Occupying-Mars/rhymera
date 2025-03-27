'use client';

import { signIn } from 'next-auth/react';
import Image from 'next/image';
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function LoginPage() {
    const [isLoading, setIsLoading] = useState(false);

    const handleGoogleSignIn = async () => {
        try {
            setIsLoading(true);
            const result = await signIn('google', { 
                callbackUrl: '/dashboard',
                redirect: false,
            });
            
            if (result?.error) {
                toast.error('Failed to sign in with Google');
                console.error('Sign in error:', result.error);
            }
        } catch (error) {
            console.error('Google sign-in error:', error);
            toast.error('An error occurred during sign in');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Welcome to Rhymera
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Create beautiful children&apos;s books with AI
                    </p>
                </div>
                <div className="mt-8 space-y-6">
                    <button
                        onClick={handleGoogleSignIn}
                        disabled={isLoading}
                        className={`w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 border-gray-300 ${
                            isLoading ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                    >
                        {isLoading ? (
                            <div className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-indigo-600" />
                        ) : (
                            <Image
                                src="/google.svg"
                                alt="Google logo"
                                width={20}
                                height={20}
                                className="mr-2"
                            />
                        )}
                        {isLoading ? 'Signing in...' : 'Sign in with Google'}
                    </button>
                    <p className="mt-2 text-center text-xs text-gray-600">
                        By signing in, you agree to our{' '}
                        <a href="/terms" className="font-medium text-indigo-600 hover:text-indigo-500">
                            Terms of Service
                        </a>{' '}
                        and{' '}
                        <a href="/privacy" className="font-medium text-indigo-600 hover:text-indigo-500">
                            Privacy Policy
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
} 