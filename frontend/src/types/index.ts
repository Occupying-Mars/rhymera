export interface User {
    id: string;
    username: string;
    email: string;
    full_name?: string;
    google_id?: string;
}

export interface LoginCredentials {
    username: string;
    password: string;
}

export interface GoogleLoginCredentials {
    token: string;
    email: string;
    name: string;
}

export interface RegisterData extends LoginCredentials {
    email: string;
    full_name?: string;
}

export interface Token {
    access_token: string;
    token_type: string;
}

export interface BookRequest {
    pages: number;
    book_type: string;
    topic: string;
}

export interface BookPage {
    page: number;
    content: string;
    illustration: string;
    illustration_file?: string;
}

export interface SavedBook extends Book {
    id: string;
    user_id: string;
    created_at: string;
    title: string;
}

export interface Book {
    pages: number;
    book_type: string;
    book_content: BookPage[];
} 