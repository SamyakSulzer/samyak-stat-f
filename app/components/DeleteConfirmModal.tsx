"use client";

import React from 'react';
import { Trash2 } from 'lucide-react';

interface DeleteConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: React.ReactNode;
    onCancel: () => void;
    onConfirm: () => void;
}

export default function DeleteConfirmModal({
    isOpen,
    title,
    message,
    onCancel,
    onConfirm,
}: DeleteConfirmModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="p-6 text-center">
                    <div className="bg-red-50 w-14 h-14 rounded-full flex items-center justify-center text-red-600 mx-auto mb-4">
                        <Trash2 size={28} />
                    </div>
                    <h3 className="text-lg font-black text-slate-900 mb-2">{title}</h3>
                    <p className="text-slate-500 text-sm mb-6 px-2">{message}</p>
                    <div className="flex gap-3">
                        <button
                            onClick={onCancel}
                            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs uppercase tracking-wide hover:bg-slate-50 cursor-pointer transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onConfirm}
                            className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white font-bold text-xs uppercase tracking-wide shadow-md shadow-red-100 hover:bg-red-700 cursor-pointer transition-all active:scale-95"
                        >
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
