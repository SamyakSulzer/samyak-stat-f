"use client";

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationFooterProps {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    pageSize: number;
    startIndex: number;
    setCurrentPage: (page: number | ((prev: number) => number)) => void;
    setPageSize: (size: number) => void;
}

export default function PaginationFooter({
    currentPage,
    totalPages,
    totalItems,
    pageSize,
    startIndex,
    setCurrentPage,
    setPageSize,
}: PaginationFooterProps) {
    return (
        <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="text-sm text-slate-500 font-medium">
                Showing <span className="text-slate-900">{startIndex + 1}</span> to <span className="text-slate-900">{Math.min(startIndex + pageSize, totalItems)}</span> of <span className="text-slate-900">{totalItems}</span> entries
            </div>

            <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 mr-4">
                    <span className="text-xs text-slate-400 font-bold uppercase">Rows:</span>
                    <select
                        value={pageSize}
                        onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                        className="bg-transparent text-sm font-bold text-slate-600 outline-none cursor-pointer"
                    >
                        {[5, 10, 20, 50].map(size => (
                            <option key={size} value={size}>{size}</option>
                        ))}
                    </select>
                </div>

                <nav className="flex items-center gap-1">
                    <button
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage((prev: number) => prev - 1)}
                        className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                        <ChevronLeft size={16} />
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`w-9 h-9 text-sm font-bold rounded-lg transition-all ${currentPage === page
                                ? 'bg-blue-600 text-white shadow-md shadow-blue-100'
                                : 'text-slate-600 hover:bg-white border border-transparent hover:border-slate-200'
                                }`}
                        >
                            {page}
                        </button>
                    ))}

                    <button
                        disabled={currentPage === totalPages || totalPages === 0}
                        onClick={() => setCurrentPage((prev: number) => prev + 1)}
                        className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                        <ChevronRight size={16} />
                    </button>
                </nav>
            </div>
        </div>
    );
}
