'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { SavedBook, BookPage } from '@/types';

interface BookViewerProps {
  bookData: {
    book_content: BookPage[];
    book_type: string;
    pages: number;
    title: string;
    title_cover?: string;
    book_cover?: string;
    saved_book_id?: string;
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

  // Otherwise, use the MongoDB image URL if available
  if (page.illustration_file) {
    return (
      <Image
        src={`${API_URL}/images/${page.illustration_file}`}
        alt="Book illustration"
        fill
        className="object-contain"
      />
    );
  }

  // Fallback if no image is available
  return (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 text-white p-4 text-center">
      <p className="text-sm md:text-base italic">{page.illustration}</p>
    </div>
  );
};

const SinglePage = ({ page }: { page: BookPage }) => (
  <div className="w-full h-full flex flex-col items-center justify-between p-4 md:p-6 lg:p-8">
    <div className="w-full h-[70%] relative rounded-lg overflow-hidden bg-gray-50">
      <IllustrationBox page={page} />
    </div>
    <div className="h-[25%] flex items-center">
      <p className="text-gray-800 text-center text-sm md:text-base lg:text-lg leading-relaxed">
        {page.content}
      </p>
    </div>
  </div>
);

export default function BookViewer({ bookData, onExportPDF }: BookViewerProps) {
  const [currentPage, setCurrentPage] = useState(0); // 0 represents cover, 1-n represents actual pages
  const [isExporting, setIsExporting] = useState(false);
  const [direction, setDirection] = useState(0); // -1 for left, 1 for right

  const handleExport = async () => {
    if (!bookData.saved_book_id) return;
    setIsExporting(true);
    try {
      await onExportPDF(bookData.saved_book_id);
    } finally {
      setIsExporting(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    setDirection(newPage > currentPage ? 1 : -1);
    setCurrentPage(newPage);
  };

  const totalPages = bookData.book_content.length;
  const showRightPage = currentPage < totalPages && currentPage > 0;
  
  // Calculate actual page numbers for display (2 pages at a time)
  const leftPageIndex = currentPage === 0 ? -1 : (currentPage - 1) * 2;
  const rightPageIndex = currentPage === 0 ? -1 : (currentPage - 1) * 2 + 1;

  return (
    <div className="mt-10 max-w-4xl mx-auto p-4">
      <div className="bg-gray-900 rounded-lg shadow-lg p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">
            {bookData.title || bookData.title_cover || 'My Book'}
          </h2>
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
            onClick={() => handlePageChange(Math.max(0, currentPage - 1))}
            disabled={currentPage === 0}
            className="p-2 bg-gray-700 text-white rounded-full disabled:opacity-50 hover:bg-gray-600"
          >
            ←
          </button>

          <AnimatePresence mode="wait" initial={false}>
            <motion.div 
              key={currentPage}
              className="flex-1 flex justify-center space-x-8"
              initial={{ opacity: 0, x: direction * 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -50 }}
              transition={{ duration: 0.3 }}
            >
              {/* Left Page (Cover or Content) */}
              <div className="w-1/2 aspect-[3/4] bg-gray-50 rounded-lg shadow p-4">
                {currentPage === 0 ? (
                  // Cover Page
                  <div className="h-full flex flex-col items-center justify-center">
                    {bookData.book_cover ? (
                      <div className="relative w-full h-full">
                        <Image
                          src={`${API_URL}/images/${bookData.book_cover}`}
                          alt="Book Cover"
                          fill
                          className="object-contain rounded"
                        />
                      </div>
                    ) : bookData.book_cover ? (
                      <div className="relative w-full h-full">
                        <Image
                          src={`data:image/png;base64,${bookData.book_cover}`}
                          alt="Book Cover"
                          fill
                          className="object-contain rounded"
                        />
                      </div>
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
                    {bookData.book_content[leftPageIndex]?.illustration_file ? (
                      <div className="relative w-full h-1/2 mb-4">
                        <Image
                          src={`${API_URL}/images/${bookData.book_content[leftPageIndex].illustration_file}`}
                          alt={`Page ${leftPageIndex + 1} Illustration`}
                          fill
                          className="object-contain rounded"
                        />
                      </div>
                    ) : bookData.book_content[leftPageIndex]?.b64_json ? (
                      <div className="relative w-full h-1/2 mb-4">
                        <Image
                          src={`data:image/png;base64,${bookData.book_content[leftPageIndex].b64_json}`}
                          alt={`Page ${leftPageIndex + 1} Illustration`}
                          fill
                          className="object-contain rounded"
                        />
                      </div>
                    ) : null}
                    <div className="prose flex-1 overflow-auto text-gray-800">
                      <p>{bookData.book_content[leftPageIndex]?.content}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Page (Only shown for content pages) */}
              {showRightPage && rightPageIndex < totalPages && (
                <div className="w-1/2 aspect-[3/4] bg-gray-50 rounded-lg shadow p-4">
                  <div className="h-full flex flex-col">
                    {bookData.book_content[rightPageIndex]?.illustration_file ? (
                      <div className="relative w-full h-1/2 mb-4">
                        <Image
                          src={`${API_URL}/images/${bookData.book_content[rightPageIndex].illustration_file}`}
                          alt={`Page ${rightPageIndex + 1} Illustration`}
                          fill
                          className="object-contain rounded"
                        />
                      </div>
                    ) : bookData.book_content[rightPageIndex]?.b64_json ? (
                      <div className="relative w-full h-1/2 mb-4">
                        <Image
                          src={`data:image/png;base64,${bookData.book_content[rightPageIndex].b64_json}`}
                          alt={`Page ${rightPageIndex + 1} Illustration`}
                          fill
                          className="object-contain rounded"
                        />
                      </div>
                    ) : null}
                    <div className="prose flex-1 overflow-auto text-gray-800">
                      <p>{bookData.book_content[rightPageIndex]?.content}</p>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <button
            onClick={() => handlePageChange(Math.min(Math.ceil(totalPages / 2), currentPage + 1))}
            disabled={currentPage === Math.ceil(totalPages / 2)}
            className="p-2 bg-gray-700 text-white rounded-full disabled:opacity-50 hover:bg-gray-600"
          >
            →
          </button>
        </div>

        <div className="mt-4 text-center text-white">
          {currentPage === 0 ? (
            'Cover'
          ) : (
            `Pages ${leftPageIndex + 1}-${Math.min(rightPageIndex + 1, totalPages)}`
          )}
        </div>
      </div>
    </div>
  );
} 