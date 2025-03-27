'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { books } from '@/utils/api';
import BookViewer from '@/components/BookViewer';
import toast from 'react-hot-toast';
import { use } from 'react';
import { SavedBook } from '@/types';

interface Props {
  params: Promise<{
    bookId: string;
  }>;
}

export default function BookPage({ params }: Props) {
  const router = useRouter();
  const { user } = useAuth();
  const [book, setBook] = useState<SavedBook | null>(null);
  const [loading, setLoading] = useState(true);
  const resolvedParams = use(params);

  useEffect(() => {
    if (!user) {
      router.replace('/login');
      return;
    }

    const loadBook = async () => {
      try {
        const bookData = await books.getBookById(resolvedParams.bookId);
        if (!bookData) {
          throw new Error('No book data received');
        }

        setBook(bookData);
      } catch (error) {
        console.error('Error loading book:', error);
        toast.error('Failed to load book');
        router.push('/dashboard');
      } finally {
        setLoading(false);
      }
    };

    loadBook();
  }, [resolvedParams.bookId, router, user]);

  const handleExportPDF = async (bookId: string) => {
    try {
      toast.loading('Generating PDF...');
      const blob = await books.generatePdf(bookId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `book-${bookId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.dismiss();
      toast.success('PDF downloaded successfully!');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.dismiss();
      toast.error('Failed to download PDF. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!book || !book.content?.book_content) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-800">Book not found</h2>
          <button 
            onClick={() => router.push('/dashboard')}
            className="mt-4 text-indigo-600 hover:text-indigo-700"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <BookViewer 
        bookData={{
          book_content: book.content.book_content,
          book_type: book.content.book_type,
          pages: book.content.pages,
          title: book.title,
          title_cover: book.content.title_cover,
          book_cover: book.content.book_cover,
          saved_book_id: book.id
        }} 
        onExportPDF={handleExportPDF}
      />
    </div>
  );
} 