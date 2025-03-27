'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { useGoogleLogin } from '@react-oauth/google';
import { auth } from '@/utils/api';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import axios from 'axios';

export default function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useAuth();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await login({ username, password });
        } catch (error) {
            console.error('Login error:', error);
            toast.error('Login failed. Please check your credentials.');
        }
    };

    const googleLogin = useGoogleLogin({
        onSuccess: async (codeResponse) => {
            try {
                console.log('Google OAuth success:', codeResponse);
                
                // Get user info and ID token from Google
                const userInfo = await axios.get(
                    'https://www.googleapis.com/oauth2/v3/userinfo',
                    {
                        headers: { Authorization: `Bearer ${codeResponse.access_token}` },
                    }
                );
                
                // Get ID token
                const tokenInfo = await axios.get(
                    'https://oauth2.googleapis.com/tokeninfo',
                    {
                        params: { access_token: codeResponse.access_token }
                    }
                );

                console.log('User info:', userInfo.data);
                console.log('Token info:', tokenInfo.data);

                const { access_token } = await auth.googleLogin({ 
                    token: tokenInfo.data.sub,
                    email: userInfo.data.email,
                    name: userInfo.data.name
                });
                
                localStorage.setItem('token', access_token);
                toast.success('Login successful!');
                router.push('/dashboard');
            } catch (error: any) {
                console.error('Google login error:', error);
                console.error('Error response:', error.response?.data);
                toast.error(error.response?.data?.detail || 'Login with Google failed. Please try again.');
            }
        },
        onError: (error) => {
            console.error('Google Login Failed:', error);
            toast.error('Login with Google failed. Please try again.');
        },
        flow: 'implicit'
    });

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Sign in to your account
                    </h2>
                </div>

                <div>
                    <button
                        type="button"
                        onClick={() => googleLogin()}
                        className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        <img
                            className="h-5 w-5 mr-2"
                            src="https://www.svgrepo.com/show/475656/google-color.svg"
                            alt="Google Logo"
                        />
                        Sign in with Google
                    </button>
                </div>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-gray-50 text-gray-500">Or continue with</span>
                    </div>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="rounded-md shadow-sm -space-y-px">
                        <div>
                            <label htmlFor="username" className="sr-only">
                                Username
                            </label>
                            <input
                                id="username"
                                name="username"
                                type="text"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                placeholder="Username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="sr-only">
                                Password
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Sign in
                        </button>
                    </div>

                    <div className="text-sm text-center">
                        <Link
                            href="/register"
                            className="font-medium text-indigo-600 hover:text-indigo-500"
                        >
                            Don&apos;t have an account? Register
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
} 