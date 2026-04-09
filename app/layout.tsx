"use client";

import React, { useState, useRef, useEffect } from "react";
import "./globals.css";
import Link from "next/link";
import { usePathname } from "next/navigation";
// 1. IMPORT THE TOASTER HERE
import { Toaster } from 'react-hot-toast';
import {
  LayoutDashboard, Box, Users, ClipboardList,
  BarChart3, Bell, Menu, LogOut, User, Settings, ShieldCheck, HardDrive
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();

  const isLoginPage = pathname === "/" || pathname === "/login";

  useEffect(() => {
    // Check authentication
    const storedName = localStorage.getItem("user_name");
    const storedRole = localStorage.getItem("user_role");
    const storedUsername = localStorage.getItem("username");

    if (!storedName && !isLoginPage) {
      router.push("/");
    } else {
      setUserName(storedName || "Guest User");
      setUserRole(storedRole || "User");
    }
  }, [isLoginPage, router]);

  const handleLogout = () => {
    localStorage.removeItem("user_name");
    localStorage.removeItem("user_role");
    localStorage.removeItem("username");
    localStorage.removeItem("access_token");
    localStorage.removeItem("token_type");
    router.push("/");
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navItems = [
    { name: 'Dashboard', icon: <LayoutDashboard size={20} />, href: '/dashboard' },
    { name: 'Assets', icon: <Box size={20} />, href: '/assets' },
    { name: 'Employees', icon: <Users size={20} />, href: '/employees' },
    { name: 'Allocations', icon: <ClipboardList size={20} />, href: '/allocations' },
    { name: 'Master Data', icon: <ShieldCheck size={20} />, href: '/master' },
    { name: 'Mind Mapping', icon: <BarChart3 size={20} />, href: '/mind-mapping' },
    { name: 'Notifications', icon: <Bell size={20} />, href: '/notifications' },
    { name: 'Bulk Data', icon: <HardDrive size={20} />, href: '/bulk-data' },
    { name: 'Acknowledgement', icon: <ClipboardList size={20} />, href: '/acknowledgement' },
  ];

  return (
    <html lang="en">
      <body className="font-sans bg-slate-50 text-slate-900">
        {/* 2. ADD THE TOASTER COMPONENT HERE */}
        <Toaster position="top-right" reverseOrder={false} />

        {isLoginPage ? (
          children
        ) : !userName ? (
          <div className="h-screen w-full flex items-center justify-center bg-slate-50">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
          </div>
        ) : (
          <div className="flex h-screen flex-col overflow-hidden">
            {/* HEADER */}
            <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 z-30 shadow-sm">
              <div className="flex items-center gap-6">
                <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors">
                  <Menu size={24} />
                </button>

                <div className="flex items-center gap-2">
                  <span className="text-blue-900 font-black text-xl tracking-tighter uppercase">Sulzer</span>

                </div>
              </div>

              <div className="flex items-center gap-4">
                <Link href="/notifications" className="p-2 text-slate-400 hover:text-blue-600 transition-colors relative">
                  <Bell size={22} />
                  <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                </Link>

                <div className="relative" ref={dropdownRef}>
                  <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="flex items-center gap-3 border-l pl-4 border-slate-200 hover:opacity-80 transition-opacity outline-none">
                    <div className="text-right hidden md:block">
                      <p className="text-xs font-bold text-slate-800">{userName || "Loading..."}</p>
                      <p className="text-[10px] text-blue-600 font-bold uppercase tracking-widest">{userRole || "Accessing..."}</p>
                    </div>
                    <div className="w-9 h-9 bg-blue-700 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-md border-2 border-white">
                      {(userName || "U").split(" ").map(n => n[0]).join("").toUpperCase()}
                    </div>
                  </button>

                  {isProfileOpen && (
                    <div className="absolute right-0 mt-3 w-60 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                      <div className="px-4 py-3 border-b border-slate-50 mb-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Account</p>
                        <p className="text-sm font-bold text-slate-800 truncate">{(localStorage.getItem("username") || "user").toLowerCase()}</p>
                      </div>
                      <Link href="/profile" className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-blue-50 hover:text-blue-700 transition-all"><User size={16} />View Profile</Link>
                      <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-blue-50 hover:text-blue-700 transition-all"><Settings size={16} />Settings</button>
                      <div className="mt-2 pt-2 border-t border-slate-100">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-all font-bold"
                        >
                          <LogOut size={16} />Logout System
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
              <aside className={`bg-white border-r border-slate-200 transition-all duration-300 ease-in-out ${isSidebarOpen ? "w-64" : "w-0 overflow-hidden"}`}>
                <nav className="p-4 space-y-1">
                  {navItems.map((item) => (
                    <Link key={item.name} href={item.href} className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 hover:bg-blue-50 hover:text-blue-700 transition-all font-medium whitespace-nowrap overflow-hidden">
                      <div className="shrink-0 flex items-center justify-center">
                        {item.icon}
                      </div>
                      <span className="truncate">{item.name}</span>
                    </Link>
                  ))}
                </nav>
              </aside>

              <main className="flex-1 overflow-y-auto bg-slate-50">
                <div className="p-8 max-w-[1600px] mx-auto">
                  {children}
                </div>
              </main>
            </div>
          </div>
        )}
      </body>
    </html>
  );
}