'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BookCreateRequest } from '@/types/book';

export default function CreateBook() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<BookCreateRequest>({
    pages: 5,
    book_type: 'story',
    topic: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'pages' ? parseInt(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/books', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to create book');
      }

      const book = await response.json();
      router.push(`/books/${book.id}`);
    } catch (error) {
      console.error('Error creating book:', error);
      // You might want to show an error message to the user here
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Create a New Book</h1>

        <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-lg shadow-lg p-6">
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
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={formData.topic}
              onChange={handleChange}
            />
            <p className="mt-1 text-sm text-gray-500">
              What would you like your book to be about?
            </p>
          </div>

          <div>
            <label htmlFor="book_type" className="block text-sm font-medium text-gray-700">
              Book Type
            </label>
            <select
              id="book_type"
              name="book_type"
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-gray-900 bg-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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
              required
              min="1"
              max="20"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={formData.pages}
              onChange={handleChange}
            />
            <p className="mt-1 text-sm text-gray-500">
              Choose between 1 and 20 pages
            </p>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Book'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 