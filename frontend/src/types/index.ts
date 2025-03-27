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
    b64_json?: string;
}

export interface BookContent {
    book_content: BookPage[];
    book_type: string;
    pages: number;
    book_cover?: string;
    title_cover?: string;
    cover_file?: string;
    cover_b64_json?: string;
}

export interface Book {
    pages: number;
    book_type: string;
    book_content: BookPage[];
    title?: string;
    title_cover?: string;
    book_cover?: string;
    cover_file?: string;
    cover_b64_json?: string;
    saved_book_id?: string;
}

export interface SavedBook {
    id: string;
    user_id: string;
    title: string;
    content: BookContent;
    created_at?: string;
} 