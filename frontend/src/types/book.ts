export interface BookMetadata {
  title: string;
  author_id: string;
  book_type: string;
  topic: string;
  total_pages: number;
  status: 'generating' | 'completed' | 'error';
  cover_file_id?: string;
  cover_prompt?: string;
  cover_b64?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface BookPage {
  page_number: number;
  content: string;
  illustration_prompt?: string;
  illustration_file_id?: string;
  illustration_b64?: string;
}

export interface Book {
  _id: string;
  metadata: BookMetadata;
  pages: BookPage[];
  raw_content?: any;
} 