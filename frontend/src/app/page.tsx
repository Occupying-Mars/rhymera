'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { books } from '@/utils/api';
import toast from 'react-hot-toast';
import BookViewer from '@/components/BookViewer';
import { useAuth } from '@/contexts/AuthContext';

interface BookViewerData {
  book_content: Array<{
    page: number;
    content: string;
    illustration: string;
    illustration_file?: string;
    b64_json?: string;
  }>;
  book_type: string;
  pages: number;
  title: string;
  title_cover?: string;
  book_cover?: string;
  saved_book_id?: string;
  cover_file?: string;
  cover_b64_json?: string;
}

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [bookRequest, setBookRequest] = useState({
    pages: 5,
    book_type: 'story',
    topic: '',
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedBook, setGeneratedBook] = useState<BookViewerData | null>(null);

  useEffect(() => {
    if (user) {
      router.replace('/dashboard');
    } else {
      setIsLoading(false);
    }
  }, [user, router]);

  if (isLoading || user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookRequest.topic) {
      toast.error('Please enter a topic for your book');
      return;
    }
    
    setIsGenerating(true);
    try {
      const response = await books.generateBook(bookRequest);
      
      if (user) {
        // If logged in, redirect to the book page
        toast.success('Book generated successfully!');
        router.push(`/dashboard/${response.id}`);
      } else {
        // If not logged in, show the book content inline
        const bookData: BookViewerData = {
          book_content: response.book_content.map((page: any) => ({
            page: page.page,
            content: page.content,
            illustration: page.illustration,
            illustration_file: page.illustration_file || undefined,
            b64_json: page.b64_json
          })),
          book_type: response.book_type,
          pages: response.pages,
          title: bookRequest.topic,
          title_cover: response.title_cover,
          book_cover: response.book_cover,
          cover_file: response.cover_file,
          cover_b64_json: response.cover_b64_json
        };
        
        setGeneratedBook(bookData);
        toast.success('Book generated successfully!');
      }
    } catch (error) {
      console.error('Error generating book:', error);
      toast.error('Failed to generate book. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportPDF = async (bookId: string) => {
    toast.error('Please log in to download books as PDF');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-indigo-600">Rhymera</h1>
          <div className="flex items-center space-x-4">
            <Link href="/login" className="text-gray-600 hover:text-gray-900">
              Login
            </Link>
            <Link
              href="/register"
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
            >
              Sign up
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
            <span className="block">Create Beautiful Books</span>
            <span className="block text-indigo-600">with AI</span>
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            Generate unique stories with custom illustrations in seconds. Sign up to save your books and access more features.
          </p>
        </div>

        <div className="max-w-xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-6 bg-white shadow-lg rounded-lg p-6">
            <div>
              <label htmlFor="topic" className="block text-sm font-medium text-gray-700">
                Book Topic
              </label>
              <input
                type="text"
                id="topic"
                value={bookRequest.topic}
                onChange={(e) => setBookRequest(prev => ({ ...prev, topic: e.target.value }))}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter a topic for your book"
              />
            </div>

            <div>
              <label htmlFor="book_type" className="block text-sm font-medium text-gray-700">
                Book Type
              </label>
              <select
                id="book_type"
                value={bookRequest.book_type}
                onChange={(e) => setBookRequest(prev => ({ ...prev, book_type: e.target.value }))}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="story">Story Book</option>
                <option value="poem">Poem</option>
                <option value="nursery_rhyme">Nursery Rhyme</option>
                <option value="propaganda">Propaganda (Satirical)</option>
                <option value="educational">Educational</option>
              </select>
            </div>

            <div>
              <label htmlFor="pages" className="block text-sm font-medium text-gray-700">
                Number of Pages
              </label>
              <input
                type="number"
                id="pages"
                min="1"
                max="20"
                value={bookRequest.pages}
                onChange={(e) => setBookRequest(prev => ({ ...prev, pages: parseInt(e.target.value) }))}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={isGenerating}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isGenerating ? 'Generating...' : 'Generate Book'}
            </button>
          </form>
        </div>

        {generatedBook && (
          <BookViewer
            bookData={generatedBook}
            onExportPDF={handleExportPDF}
          />
        )}
      </main>
    </div>
  );
}
