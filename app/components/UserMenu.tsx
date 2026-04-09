"use client";
import { useState } from 'react';
import { User, Settings, LogOut, ChevronDown, Bell } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("userSession");
    router.push('/login');
  };

  return (
    <div className="flex items-center gap-4 relative">
      <Bell className="text-slate-400 cursor-pointer hover:text-blue-600" size={20} />

      <div className="h-10 w-[1px] bg-slate-200 mx-2" />

      <button onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-3 hover:bg-slate-50 p-1 rounded-lg transition-all">
        <div className="text-right hidden md:block">
          <p className="text-xs font-bold text-slate-800">Samyak Dahale</p>
          <p className="text-[10px] font-bold text-blue-600 uppercase tracking-tighter">Administrator</p>
        </div>
        <div className="bg-blue-600 h-10 w-10 rounded-full flex items-center justify-center text-white font-bold text-sm">SD</div>
      </button>

      {/* THE DROPDOWN FROM YOUR IMAGE */}
      {isOpen && (
        <div className="absolute top-14 right-0 w-64 bg-white rounded-xl shadow-2xl border border-slate-100 py-4 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-6 pb-4 border-b border-slate-50">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Account</p>

          </div>

          <div className="py-2">
            <button className="w-full px-6 py-2.5 flex items-center gap-3 text-slate-600 hover:bg-slate-50 text-sm">
              <User size={18} /> View Profile
            </button>
            <button className="w-full px-6 py-2.5 flex items-center gap-3 text-slate-600 hover:bg-slate-50 text-sm">
              <Settings size={18} /> Settings
            </button>
          </div>

          <div className="pt-2 border-t border-slate-50">
            <button onClick={handleLogout} className="w-full px-6 py-2.5 flex items-center gap-3 text-red-600 hover:bg-red-50 text-sm font-bold">
              <LogOut size={18} /> Logout System
            </button>
          </div>
        </div>
      )}
    </div>
  );
}