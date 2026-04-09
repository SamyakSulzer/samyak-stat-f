"use client";

import React from 'react';
import { X, GripVertical } from 'lucide-react';

interface PersonalizeModalProps {
    isOpen: boolean;
    onClose: () => void;
    allFields: string[];
    columnLabels: Record<string, string>;
    visibleColumns: string[];
    setVisibleColumns: (cols: string[]) => void;
    defaultColumns: string[];
}

export default function PersonalizeModal({
    isOpen,
    onClose,
    allFields,
    columnLabels,
    visibleColumns,
    setVisibleColumns,
    defaultColumns,
}: PersonalizeModalProps) {
    if (!isOpen) return null;

    const toggleColumn = (col: string) => {
        setVisibleColumns(
            visibleColumns.includes(col)
                ? visibleColumns.filter(c => c !== col)
                : [...visibleColumns, col]
        );
    };

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-200">
                <div className="flex justify-between items-center p-5 border-b border-slate-100">
                    <h2 className="text-lg font-bold text-slate-800">Personalize fields</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6">
                    <p className="text-sm text-slate-500 mb-6">Select the columns you'd like and arrange how they're ordered</p>

                    <div className="grid grid-cols-2 gap-8 h-[400px]">
                        {/* Available Columns (Left) */}
                        <div className="flex flex-col gap-2 overflow-y-auto pr-2 custom-scrollbar">
                            <span className="text-xs font-bold text-slate-400 uppercase mb-2">Available columns ({allFields.length})</span>
                            <div className="flex gap-2 mb-2">
                                <button type="button" onClick={() => setVisibleColumns([...allFields])} className="text-[10px] font-bold text-blue-600 hover:text-blue-800 uppercase cursor-pointer hover:underline">Select All</button>
                                <span className="text-slate-300">|</span>
                                <button type="button" onClick={() => setVisibleColumns([])} className="text-[10px] font-bold text-slate-500 hover:text-red-500 uppercase cursor-pointer hover:underline">Unselect All</button>
                            </div>
                            {allFields.map(field => (
                                <label key={field} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors group">
                                    <input
                                        type="checkbox"
                                        checked={visibleColumns.includes(field)}
                                        onChange={() => toggleColumn(field)}
                                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                    />
                                    <span className="text-sm text-slate-700">{columnLabels[field]}</span>
                                </label>
                            ))}
                        </div>

                        {/* Selected Columns (Right) */}
                        <div className="flex flex-col gap-2 overflow-y-auto pr-2 custom-scrollbar">
                            <span className="text-xs font-bold text-slate-400 uppercase mb-4">Selected columns ({visibleColumns.length})</span>
                            <div className="space-y-2">
                                {visibleColumns.map((col) => (
                                    <div key={col} className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-200 shadow-sm group">
                                        <div className="flex items-center gap-3">
                                            <GripVertical size={14} className="text-slate-400" />
                                            <span className="text-sm font-medium text-slate-700">{columnLabels[col]}</span>
                                        </div>
                                        <button onClick={() => toggleColumn(col)} className="text-slate-400 hover:text-red-500 cursor-pointer">
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-between items-center p-6 border-t border-slate-100 bg-slate-50">
                    <button onClick={() => setVisibleColumns(defaultColumns)} className="text-sm text-slate-500 hover:text-slate-800 transition-colors underline cursor-pointer">
                        Reset all columns
                    </button>
                    <div className="flex gap-3">
                        <button onClick={onClose} className="px-6 py-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-bold transition-all cursor-pointer">Cancel</button>
                        <button onClick={onClose} className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-md transition-all cursor-pointer">Apply</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
