import axios from 'axios';
import { getSession } from 'next-auth/react';
import { LoginCredentials, RegisterData, Token, User, BookRequest, Book, GoogleLoginCredentials, SavedBook } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add token to requests if it exists
api.interceptors.request.use(async (config) => {
    const session = await getSession();
    if (session?.accessToken) {
        config.headers.Authorization = `Bearer ${session.accessToken}`;
    }
    return config;
});

// Add error handling interceptor
api.interceptors.response.use(
    response => response,
    error => {
        console.error('API Error:', error.response?.data || error.message);
        throw error;
    }
);

export const auth = {
    login: async (credentials: LoginCredentials): Promise<Token> => {
        const formData = new FormData();
        formData.append('username', credentials.username);
        formData.append('password', credentials.password);
        
        const response = await api.post<Token>('/token', formData);
        return response.data;
    },

    googleLogin: async (credentials: GoogleLoginCredentials): Promise<Token> => {
        try {
            console.log('Sending Google token to backend:', credentials);
            const response = await api.post<Token>('/google-login', credentials);
            console.log('Backend response:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('Google login API error:', error.response?.data || error.message);
            throw error;
        }
    },

    register: async (data: RegisterData): Promise<User> => {
        const response = await api.post<User>('/register', data);
        return response.data;
    },

    getCurrentUser: async (): Promise<User> => {
        const response = await api.get<User>('/users/me');
        return response.data;
    },
};

export const books = {
    generateBook: async (request: BookRequest): Promise<any> => {
        const response = await api.post('/generate-book', request);
        // The response is already JSON, no need to parse
        return response.data;
    },

    saveBook: async (book: Book, title: string): Promise<SavedBook> => {
        const response = await api.post<SavedBook>('/books', {
            ...book,
            title,
        });
        return response.data;
    },

    getUserBooks: async (page: number = 0): Promise<SavedBook[]> => {
        const limit = 20;
        const skip = page * limit;
        const response = await api.get<SavedBook[]>(`/books?limit=${limit}&skip=${skip}`);
        return response.data;
    },

    getBookById: async (id: string): Promise<SavedBook> => {
        const response = await api.get<SavedBook>(`/books/${id}`);
        return response.data;
    },

    generatePdf: async (bookId: string): Promise<Blob> => {
        try {
            const response = await api.get(`/books/${bookId}/pdf`, {
                responseType: 'blob',
                headers: {
                    'Accept': 'application/pdf',
                    'Content-Type': 'application/pdf',
                },
                timeout: 30000, // 30 second timeout
            });
            
            if (response.status !== 200) {
                throw new Error('Failed to generate PDF');
            }
            
            return response.data;
        } catch (error) {
            console.error('PDF generation error:', error);
            throw new Error('Failed to generate PDF. Please try again.');
        }
    },
}; 