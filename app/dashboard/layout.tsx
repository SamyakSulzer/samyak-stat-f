"use client";

import React from 'react';
import { usePathname } from 'next/navigation';
import { Search } from 'lucide-react';

export default function GlobalHeader() {
  const pathname = usePathname();

  // Mapping paths to Page Titles and Subtitles
  const getPageContext = () => {
    switch (pathname) {
      case '/assets':
        return { title: "Asset Inventory", sub: "Track hardware and equipment" };
      case '/employees':
        return { title: "Employee Details", sub: "Manage workforce directory" };
      default:
        return { title: "Dashboard", sub: "Real-time system overview" };
    }

  };

  const { title, sub } = getPageContext();

  return (
    <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-40">

      {/* 1. LEFT SIDE: Title and Search */}
      <div className="flex items-center gap-12">
        {/* Page Title */}
        <div>
          <h1 className="text-xl font-bold text-slate-800 leading-none">{title}</h1>
          <p className="text-[11px] text-slate-400 font-medium mt-1 uppercase tracking-wider">{sub}</p>
        </div>

        {/* Global Search Bar */}
        <div className="relative w-72 hidden lg:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Global search..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* 2. RIGHT SIDE: Profile and Notifications */}
      <div className="flex items-center">
      </div>
    </header>
  );
}