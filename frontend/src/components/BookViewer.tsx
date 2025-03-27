'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface BookPage {
  page: number;
  content: string;
  illustration: string;
  illustration_file: string | null;
  b64_json?: string;
}

interface BookViewerProps {
  bookData: {
    book_content: BookPage[];
    book_type: string;
    pages: number;
    saved_book_id?: string;
    cover_file?: string | null;
    cover_b64_json?: string | null;
    title?: string;
  };
  onExportPDF: (bookId: string) => Promise<void>;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const IllustrationBox = ({ page }: { page: BookPage }) => {
  if (!page.illustration_file && !page.b64_json) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 text-white p-4 text-center">
        <p className="text-sm md:text-base italic">{page.illustration}</p>
      </div>
    );
  }

  // If we have base64 data, use it directly
  if (page.b64_json) {
    return (
      <Image
        src={`data:image/png;base64,${page.b64_json}`}
        alt="Book illustration"
        fill
        className="object-contain"
      />
    );
  }

  // Otherwise, use the MongoDB image URL
  return (
    <Image
      src={`${API_URL}/images/${page.illustration_file}`}
      alt="Book illustration"
      fill
      className="object-contain"
    />
  );
};

const SinglePage = ({ page }: { page: BookPage }) => (
  <div className="w-full h-full flex flex-col items-center justify-between p-4 md:p-6 lg:p-8">
    <div className="w-full h-[70%] relative rounded-lg overflow-hidden bg-gray-900">
      <IllustrationBox page={page} />
    </div>
    <div className="h-[25%] flex items-center">
      <p className="text-white text-center text-sm md:text-base lg:text-lg leading-relaxed">
        {page.content}
      </p>
    </div>
  </div>
);

export default function BookViewer({ bookData, onExportPDF }: BookViewerProps) {
  const [currentPage, setCurrentPage] = useState(0); // 0 represents cover, 1-n represents actual pages
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (!bookData.saved_book_id) return;
    setIsExporting(true);
    try {
      await onExportPDF(bookData.saved_book_id);
    } finally {
      setIsExporting(false);
    }
  };

  const totalPages = bookData.book_content.length;
  const showRightPage = currentPage < totalPages;

  return (
    <div className="mt-10 max-w-4xl mx-auto p-4">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">{bookData.title || 'My Book'}</h2>
          {bookData.saved_book_id && (
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              {isExporting ? 'Exporting...' : 'Export as PDF'}
            </button>
          )}
        </div>

        <div className="flex justify-between items-center space-x-8">
          <button
            onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
            disabled={currentPage === 0}
            className="p-2 bg-gray-200 rounded-full disabled:opacity-50"
          >
            ←
          </button>

          <div className="flex-1 flex justify-center space-x-8">
            {/* Left Page (Cover or Content) */}
            <div className="w-1/2 aspect-[3/4] bg-gray-50 rounded-lg shadow p-4">
              {currentPage === 0 ? (
                // Cover Page
                <div className="h-full flex flex-col items-center justify-center">
                  {bookData.cover_file ? (
                    <img
                      src={`/api/images/${bookData.cover_file}`}
                      alt="Book Cover"
                      className="w-full h-full object-contain rounded"
                    />
                  ) : bookData.cover_b64_json ? (
                    <img
                      src={`data:image/png;base64,${bookData.cover_b64_json}`}
                      alt="Book Cover"
                      className="w-full h-full object-contain rounded"
                    />
                  ) : (
                    <div className="text-center">
                      <h3 className="text-xl font-bold mb-2">{bookData.title || 'My Book'}</h3>
                      <p className="text-gray-500">Cover image not available</p>
                    </div>
                  )}
                </div>
              ) : (
                // Content Page
                <div className="h-full flex flex-col">
                  {bookData.book_content[currentPage - 1].illustration_file ? (
                    <img
                      src={`/api/images/${bookData.book_content[currentPage - 1].illustration_file}`}
                      alt={`Page ${currentPage} Illustration`}
                      className="w-full h-1/2 object-contain mb-4 rounded"
                    />
                  ) : bookData.book_content[currentPage - 1].b64_json ? (
                    <img
                      src={`data:image/png;base64,${bookData.book_content[currentPage - 1].b64_json}`}
                      alt={`Page ${currentPage} Illustration`}
                      className="w-full h-1/2 object-contain mb-4 rounded"
                    />
                  ) : null}
                  <div className="prose flex-1 overflow-auto">
                    <p>{bookData.book_content[currentPage - 1].content}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Right Page (Only shown for content pages) */}
            {showRightPage && currentPage > 0 && currentPage < totalPages && (
              <div className="w-1/2 aspect-[3/4] bg-gray-50 rounded-lg shadow p-4">
                <div className="h-full flex flex-col">
                  {bookData.book_content[currentPage].illustration_file ? (
                    <img
                      src={`/api/images/${bookData.book_content[currentPage].illustration_file}`}
                      alt={`Page ${currentPage + 1} Illustration`}
                      className="w-full h-1/2 object-contain mb-4 rounded"
                    />
                  ) : bookData.book_content[currentPage].b64_json ? (
                    <img
                      src={`data:image/png;base64,${bookData.book_content[currentPage].b64_json}`}
                      alt={`Page ${currentPage + 1} Illustration`}
                      className="w-full h-1/2 object-contain mb-4 rounded"
                    />
                  ) : null}
                  <div className="prose flex-1 overflow-auto">
                    <p>{bookData.book_content[currentPage].content}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="p-2 bg-gray-200 rounded-full disabled:opacity-50"
          >
            →
          </button>
        </div>

        <div className="mt-4 text-center text-gray-600">
          Page {currentPage} of {totalPages}
        </div>
      </div>
    </div>
  );
} 