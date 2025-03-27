'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { books } from '@/utils/api';
import { Book, SavedBook, BookPage } from '@/types';
import toast from 'react-hot-toast';

export default function DashboardPage() {
    const { user, logout } = useAuth();
    const [loading, setLoading] = useState(false);
    const [booksLoading, setBooksLoading] = useState(false);
    const [book, setBook] = useState<Book | null>(null);
    const [selectedBook, setSelectedBook] = useState<SavedBook | null>(null);
    const [savedBooks, setSavedBooks] = useState<SavedBook[]>([]);
    const [showSavedBooks, setShowSavedBooks] = useState(true);
    const [formData, setFormData] = useState({
        pages: 5,
        book_type: 'story',
        topic: '',
    });

    useEffect(() => {
        loadSavedBooks();
    }, []);

    const loadSavedBooks = async () => {
        try {
            setBooksLoading(true);
            const userBooks = await books.getUserBooks();
            setSavedBooks(userBooks);
        } catch (error) {
            console.error('Error loading saved books:', error);
            toast.error('Failed to load saved books');
        } finally {
            setBooksLoading(false);
        }
    };

    const handleViewBook = async (bookId: string) => {
        try {
            const bookData = await books.getBookById(bookId);
            setSelectedBook(bookData);
            setShowSavedBooks(false);
        } catch (error) {
            console.error('Error loading book:', error);
            toast.error('Failed to load book');
        }
    };

    const handleDownloadPdf = async (bookId: string) => {
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

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'pages' ? parseInt(value) : value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const generatedBook = await books.generateBook(formData);
            setBook(generatedBook);
            toast.success('Book generated successfully!');
            
            // Save the book with proper structure
            const bookToSave = {
                title: formData.topic,
                book_content: generatedBook.book_content,
                book_type: formData.book_type,
                pages: formData.pages
            };
            await books.saveBook(bookToSave, formData.topic);
            toast.success('Book saved successfully!');
            loadSavedBooks();
        } catch (error) {
            console.error('Error generating book:', error);
            toast.error('Failed to generate book. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-indigo-600">Rhymera</h1>
                    <div className="flex items-center space-x-4">
                        <span className="text-gray-600">Welcome, {user?.username}!</span>
                        <button
                            onClick={logout}
                            className="text-red-600 hover:text-red-700 font-medium"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="flex justify-end mb-6">
                    <button
                        onClick={() => {
                            setShowSavedBooks(!showSavedBooks);
                            setSelectedBook(null);
                            if (!showSavedBooks) {
                                loadSavedBooks();
                            }
                        }}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors duration-200"
                    >
                        {showSavedBooks ? 'Create New Book' : 'View Saved Books'}
                    </button>
                </div>

                {!showSavedBooks && !selectedBook && (
                    <div className="bg-white shadow-lg rounded-lg p-8 max-w-xl mx-auto">
                        <h2 className="text-3xl font-bold text-gray-900 mb-6">Generate a New Book</h2>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label htmlFor="topic" className="block text-sm font-medium text-gray-700">
                                    Book Topic
                                </label>
                                <input
                                    type="text"
                                    id="topic"
                                    name="topic"
                                    required
                                    placeholder="Enter a topic for your book"
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                    value={formData.topic}
                                    onChange={handleChange}
                                />
                            </div>

                            <div>
                                <label htmlFor="book_type" className="block text-sm font-medium text-gray-700">
                                    Book Type
                                </label>
                                <select
                                    id="book_type"
                                    name="book_type"
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-gray-900 bg-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                    value={formData.book_type}
                                    onChange={handleChange}
                                >
                                    <option value="story">Story Book</option>
                                    <option value="poem">Poem</option>
                                    <option value="nursery_rhyme">Nursery Rhyme</option>
                                    <option value="propaganda">Propaganda (Satirical)</option>
                                    <option value="educational">Educational</option>
                                </select>
                                {formData.book_type === 'propaganda' && (
                                    <p className="mt-1 text-sm text-gray-500 italic">
                                        Note: Propaganda mode is satirical and meant for entertainment purposes only.
                                    </p>
                                )}
                            </div>

                            <div>
                                <label htmlFor="pages" className="block text-sm font-medium text-gray-700">
                                    Number of Pages
                                </label>
                                <input
                                    type="number"
                                    id="pages"
                                    name="pages"
                                    min="1"
                                    max="20"
                                    required
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                    value={formData.pages}
                                    onChange={handleChange}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200 ${
                                    loading ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                            >
                                {loading ? 'Generating...' : 'Generate Book'}
                            </button>
                        </form>
                    </div>
                )}

                {showSavedBooks && (
                    <div className="bg-white shadow-lg rounded-lg p-8">
                        <h2 className="text-3xl font-bold text-gray-900 mb-6">Your Books</h2>
                        {booksLoading ? (
                            <div className="text-center py-12">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                                <p className="mt-4 text-gray-600">Loading your books...</p>
                            </div>
                        ) : savedBooks.length === 0 ? (
                            <div className="text-center py-12">
                                <p className="text-gray-600">You haven't created any books yet.</p>
                                <button
                                    onClick={() => setShowSavedBooks(false)}
                                    className="mt-4 text-indigo-600 hover:text-indigo-700 font-medium"
                                >
                                    Create your first book
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {savedBooks.map((book) => (
                                    <div
                                        key={book.id}
                                        onClick={() => handleViewBook(book.id)}
                                        className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition-shadow duration-200 cursor-pointer"
                                    >
                                        <h3 className="text-xl font-semibold text-gray-900 mb-2">{book.title}</h3>
                                        <p className="text-sm text-gray-600 mb-2">
                                            Created: {new Date(book.created_at).toLocaleDateString()}
                                        </p>
                                        <p className="text-sm text-gray-600 mb-4">
                                            {book.pages} pages • {book.book_type}
                                        </p>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDownloadPdf(book.id);
                                            }}
                                            className="text-indigo-600 hover:text-indigo-700 font-medium text-sm transition-colors duration-200"
                                        >
                                            Download PDF
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {selectedBook && !showSavedBooks && (
                    <div className="mt-8 bg-white shadow-lg rounded-lg p-8">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-3xl font-bold text-gray-900">{selectedBook.title}</h2>
                            <button
                                onClick={() => handleDownloadPdf(selectedBook.id)}
                                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors duration-200"
                            >
                                Download PDF
                            </button>
                        </div>
                        <div className="space-y-8">
                            {(selectedBook as any).book_content?.map((page: BookPage) => (
                                <div
                                    key={page.page}
                                    className="border-b border-gray-200 pb-8 last:border-b-0"
                                >
                                    <h3 className="text-xl font-semibold text-gray-900 mb-3">
                                        Page {page.page}
                                    </h3>
                                    <p className="text-gray-800 mb-6 leading-relaxed">{page.content}</p>
                                    {page.illustration_file && (
                                        <img
                                            src={`/images/${page.illustration_file}`}
                                            alt={page.illustration}
                                            className="w-full h-72 object-cover rounded-lg shadow-md"
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {book && !showSavedBooks && !selectedBook && (
                    <div className="mt-8 bg-white shadow-lg rounded-lg p-8">
                        <h2 className="text-3xl font-bold text-gray-900 mb-6">Your Generated Book</h2>
                        <div className="space-y-8">
                            {book.book_content.map((page) => (
                                <div
                                    key={page.page}
                                    className="border-b border-gray-200 pb-8 last:border-b-0"
                                >
                                    <h3 className="text-xl font-semibold text-gray-900 mb-3">
                                        Page {page.page}
                                    </h3>
                                    <p className="text-gray-800 mb-6 leading-relaxed">{page.content}</p>
                                    {page.illustration_file && (
                                        <img
                                            src={`/images/${page.illustration_file}`}
                                            alt={page.illustration}
                                            className="w-full h-72 object-cover rounded-lg shadow-md"
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
} 