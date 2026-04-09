"use client";

import React, { useState, useEffect, useMemo } from 'react';
import {
    Plus, X, Trash2, Search, Loader2, Pencil,
    ChevronLeft, ChevronRight, RefreshCw, Layers,
    CheckCircle2, AlertCircle, MoreVertical
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
    getMasterKeys, createMasterKey, updateMasterKey, deleteMasterKey,
    getMasterValues, createMasterValue, updateMasterValue, deleteMasterValue
} from '@/services/masterService';
import { MasterKey, MasterValue } from '@/models/master';
import PaginationFooter from '@/app/components/PaginationFooter';
import DeleteConfirmModal from '@/app/components/DeleteConfirmModal';

export default function MasterDataPage() {
    // State for Master Keys
    const [keys, setKeys] = useState<MasterKey[]>([]);
    const [isLoadingKeys, setIsLoadingKeys] = useState(true);
    const [totalKeys, setTotalKeys] = useState(0);
    const [keysPage, setKeysPage] = useState(1);
    const [keysPageSize, setKeysPageSize] = useState(10);
    const [keySearchTerm, setKeySearchTerm] = useState('');

    // State for Master Values
    const [selectedKey, setSelectedKey] = useState<MasterKey | null>(null);
    const [values, setValues] = useState<MasterValue[]>([]);
    const [isLoadingValues, setIsLoadingValues] = useState(false);

    // Modals state
    const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
    const [isValueModalOpen, setIsValueModalOpen] = useState(false);
    const [editingKey, setEditingKey] = useState<MasterKey | null>(null);
    const [editingValue, setEditingValue] = useState<MasterValue | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<{ id: number; type: 'key' | 'value' } | null>(null);

    // Form states
    const [keyForm, setKeyForm] = useState({ key_name: '', is_active: true });
    const [valueForm, setValueForm] = useState({ value: '', order_id: 0, is_active: true });

    const [userRole, setUserRole] = useState<string | null>(null);

    useEffect(() => {
        setUserRole(localStorage.getItem("user_role"));
    }, []);

    const canCreateKey = userRole === 'master manager';
    const canEditKey = userRole !== 'viewer';
    const canEditValue = userRole !== 'viewer';

    const loadKeys = async () => {
        setIsLoadingKeys(true);
        try {
            const response = await getMasterKeys(keysPage, keysPageSize);
            setKeys(response.data);
            setTotalKeys(response.total);
        } catch (error) {
            toast.error("Failed to load master keys");
        } finally {
            setIsLoadingKeys(false);
        }
    };

    const loadValues = async (keyId: number) => {
        setIsLoadingValues(true);
        try {
            const response = await getMasterValues(keyId, 1, 100);
            setValues(response.data);
        } catch (error) {
            toast.error("Failed to load values");
        } finally {
            setIsLoadingValues(false);
        }
    };

    useEffect(() => {
        loadKeys();
    }, [keysPage, keysPageSize]);

    useEffect(() => {
        if (selectedKey) {
            loadValues(selectedKey.id);
        } else {
            setValues([]);
        }
    }, [selectedKey]);

    const handleCreateKey = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingKey) {
                await updateMasterKey(editingKey.id, keyForm);
                toast.success("Key updated successfully");
            } else {
                await createMasterKey(keyForm);
                toast.success("Key created successfully");
            }
            setIsKeyModalOpen(false);
            loadKeys();
        } catch (error: any) {
            toast.error(error.message || "Failed to save key");
        }
    };

    const handleCreateValue = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedKey) return;
        try {
            // Backend expects value as array of strings
            const payload = {
                ...valueForm,
                key_id: selectedKey.id,
                value: [valueForm.value]
            };

            if (editingValue) {
                await updateMasterValue(editingValue.id, payload);
                toast.success("Value updated successfully");
            } else {
                await createMasterValue(payload);
                toast.success("Value created successfully");
            }
            setIsValueModalOpen(false);
            loadValues(selectedKey.id);
        } catch (error: any) {
            toast.error(error.message || "Failed to save value");
        }
    };

    const handleDelete = async () => {
        if (!deleteConfirm) return;
        try {
            if (deleteConfirm.type === 'key') {
                await deleteMasterKey(deleteConfirm.id);
                toast.success("Key deleted");
                if (selectedKey?.id === deleteConfirm.id) setSelectedKey(null);
                loadKeys();
            } else {
                await deleteMasterValue(deleteConfirm.id);
                toast.success("Value deleted");
                if (selectedKey) loadValues(selectedKey.id);
            }
        } catch (error) {
            toast.error("Delete failed");
        } finally {
            setDeleteConfirm(null);
        }
    };

    const filteredKeys = keys.filter(k => k.key_name.toLowerCase().includes(keySearchTerm.toLowerCase()));

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">Master Data Management</h1>
                    <p className="text-slate-500 text-sm italic">Manage global keys and their possible values</p>
                </div>
                <button
                    onClick={() => {
                        setEditingKey(null);
                        setKeyForm({ key_name: '', is_active: true });
                        setIsKeyModalOpen(true);
                    }}
                    disabled={!canCreateKey}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm font-bold shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
                >
                    <Plus size={18} /> New Master Key
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* KEYS LIST */}
                <div className="lg:col-span-5 space-y-4">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[600px]">
                        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                            <div className="relative flex-1 mr-2">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                <input
                                    type="text"
                                    placeholder="Search keys..."
                                    value={keySearchTerm}
                                    onChange={(e) => setKeySearchTerm(e.target.value)}
                                    className="w-full pl-9 pr-4 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500/20"
                                />
                            </div>
                            <button onClick={loadKeys} className="p-2 text-slate-400 hover:text-blue-600 transition-colors">
                                <RefreshCw size={16} className={isLoadingKeys ? 'animate-spin' : ''} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            {isLoadingKeys ? (
                                <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
                                    <Loader2 className="animate-spin" />
                                    <span className="text-xs font-medium">Loading keys...</span>
                                </div>
                            ) : filteredKeys.length > 0 ? (
                                <div className="divide-y divide-slate-50">
                                    {filteredKeys.map(key => (
                                        <div
                                            key={key.id}
                                            onClick={() => setSelectedKey(key)}
                                            className={`p-4 cursor-pointer transition-all hover:bg-blue-50/50 group flex items-center justify-between ${selectedKey?.id === key.id ? 'bg-blue-50 border-r-4 border-blue-600' : ''}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg ${selectedKey?.id === key.id ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                                                    <Layers size={18} />
                                                </div>
                                                <div>
                                                    <p className={`font-bold text-sm ${selectedKey?.id === key.id ? 'text-blue-700' : 'text-slate-700'}`}>{key.key_name}</p>
                                                    <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">{key.is_active ? 'Active' : 'Inactive'}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setEditingKey(key);
                                                        setKeyForm({ key_name: key.key_name, is_active: key.is_active });
                                                        setIsKeyModalOpen(true);
                                                    }}
                                                    disabled={!canEditKey}
                                                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-white rounded-md shadow-sm border border-transparent hover:border-slate-100 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                                >
                                                    <Pencil size={14} />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setDeleteConfirm({ id: key.id, type: 'key' });
                                                    }}
                                                    disabled={!canEditKey}
                                                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-white rounded-md shadow-sm border border-transparent hover:border-slate-100 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-slate-400 italic py-10">
                                    <p className="text-sm">No keys found</p>
                                </div>
                            )}
                        </div>

                        <PaginationFooter
                            currentPage={keysPage}
                            totalPages={Math.ceil(totalKeys / keysPageSize)}
                            totalItems={totalKeys}
                            pageSize={keysPageSize}
                            startIndex={(keysPage - 1) * keysPageSize}
                            setCurrentPage={setKeysPage}
                            setPageSize={setKeysPageSize}
                        />
                    </div>
                </div>

                {/* VALUES LIST (DETAIL) */}
                <div className="lg:col-span-7 space-y-4">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[600px]">
                        {selectedKey ? (
                            <>
                                <div className="p-6 border-b border-slate-100 bg-slate-50/30 flex justify-between items-center">
                                    <div>
                                        <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">

                                            {selectedKey.key_name} Values
                                        </h2>
                                        <p className="text-xs text-slate-500 font-medium">Manage options for this key</p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setEditingValue(null);
                                            setValueForm({ value: '', order_id: values.length + 1, is_active: true });
                                            setIsValueModalOpen(true);
                                        }}
                                        disabled={!canEditValue}
                                        className="bg-slate-900 hover:bg-black text-white px-4 py-2 rounded-xl flex items-center gap-2 text-xs font-bold transition-all active:scale-95 shadow-lg shadow-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Plus size={14} /> Add Value
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto bg-slate-50/30">
                                    {isLoadingValues ? (
                                        <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
                                            <Loader2 className="animate-spin" />
                                            <span className="text-xs font-medium">Fetching values...</span>
                                        </div>
                                    ) : values.length > 0 ? (
                                        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {values.sort((a, b) => (a.order_id || 0) - (b.order_id || 0)).map(val => (
                                                <div
                                                    key={val.id}
                                                    className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-blue-200 transition-all hover:shadow-md"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="text-xs font-black text-slate-300 bg-slate-50 w-6 h-6 rounded flex items-center justify-center">
                                                            {val.order_id}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-slate-800 text-sm">{val.value.join(', ')}</p>
                                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                                <span className={`w-1.5 h-1.5 rounded-full ${val.is_active ? 'bg-green-500' : 'bg-slate-300'}`}></span>
                                                                <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">
                                                                    {val.is_active ? 'Available' : 'Disabled'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                                        <button
                                                            onClick={() => {
                                                                setEditingValue(val);
                                                                setValueForm({
                                                                    value: val.value[0] || '',
                                                                    order_id: val.order_id || 0,
                                                                    is_active: val.is_active
                                                                });
                                                                setIsValueModalOpen(true);
                                                            }}
                                                            disabled={!canEditValue}
                                                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                                        >
                                                            <Pencil size={14} />
                                                        </button>
                                                        <button
                                                            onClick={() => setDeleteConfirm({ id: val.id, type: 'value' })}
                                                            disabled={!canEditValue}
                                                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-full text-slate-400 py-20 px-10 text-center">
                                            <div className="bg-slate-100 p-4 rounded-full mb-4">
                                                <AlertCircle size={32} className="text-slate-300" />
                                            </div>
                                            <p className="font-bold text-slate-600">No values registered yet</p>
                                            <p className="text-xs mt-1">Add your first value to this category using the button above.</p>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400 gap-4 p-10 text-center flex-1">
                                <div className="bg-blue-50 p-6 rounded-full">
                                    <Layers size={48} className="text-blue-200" />
                                </div>
                                <div>
                                    <p className="font-black text-slate-700 uppercase tracking-tighter text-lg">Select a Master Key</p>
                                    <p className="text-sm mt-1 max-w-xs">Pick a key from the left list to view and manage its associated values.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* KEY MODAL */}
            {isKeyModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b bg-slate-50/50 flex justify-between items-center">
                            <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                                {editingKey ? 'Edit Master Key' : 'New Master Key'}
                            </h2>
                            <button onClick={() => setIsKeyModalOpen(false)} className="text-slate-400 hover:text-red-500 transition-all">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleCreateKey} className="p-6 space-y-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Key Name</label>
                                <input
                                    required
                                    placeholder="e.g. ASSET_CATEGORY"
                                    className="w-full border border-slate-200 p-3 rounded-xl text-sm outline-none focus:border-blue-500 transition-all font-bold uppercase tracking-wide"
                                    value={keyForm.key_name}
                                    onChange={(e) => setKeyForm({ ...keyForm, key_name: e.target.value.toUpperCase().replace(/\s+/g, '_') })}
                                />
                                <p className="text-[10px] text-slate-400 italic ml-1">Spaces will be converted to underscores</p>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                                <input
                                    type="checkbox"
                                    id="key-active"
                                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                                    checked={keyForm.is_active}
                                    onChange={(e) => setKeyForm({ ...keyForm, is_active: e.target.checked })}
                                />
                                <label htmlFor="key-active" className="text-sm font-bold text-slate-700 cursor-pointer">Active and Visible</label>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setIsKeyModalOpen(false)} className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-xl font-bold text-sm uppercase hover:bg-slate-200 transition-all">Cancel</button>
                                <button type="submit" className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-black text-sm uppercase shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all">
                                    {editingKey ? 'Update Key' : 'Create Key'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* VALUE MODAL */}
            {isValueModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b bg-slate-50/50 flex justify-between items-center">
                            <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                                {editingValue ? 'Edit Value' : `Add to ${selectedKey?.key_name}`}
                            </h2>
                            <button onClick={() => setIsValueModalOpen(false)} className="text-slate-400 hover:text-red-500 transition-all">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleCreateValue} className="p-6 space-y-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Display Value</label>
                                <input
                                    required
                                    placeholder="e.g. Mumbai HQ"
                                    className="w-full border border-slate-200 p-3 rounded-xl text-sm outline-none focus:border-blue-500 transition-all font-medium"
                                    value={valueForm.value}
                                    onChange={(e) => setValueForm({ ...valueForm, value: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Order ID</label>
                                    <input
                                        type="number"
                                        className="w-full border border-slate-200 p-3 rounded-xl text-sm outline-none focus:border-blue-500 transition-all font-medium"
                                        value={valueForm.order_id}
                                        onChange={(e) => setValueForm({ ...valueForm, order_id: parseInt(e.target.value) || 0 })}
                                    />
                                </div>
                                <div className="flex flex-col justify-end">
                                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                                        <input
                                            type="checkbox"
                                            id="val-active"
                                            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                                            checked={valueForm.is_active}
                                            onChange={(e) => setValueForm({ ...valueForm, is_active: e.target.checked })}
                                        />
                                        <label htmlFor="val-active" className="text-sm font-bold text-slate-700 cursor-pointer">Active</label>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setIsValueModalOpen(false)} className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-xl font-bold text-sm uppercase hover:bg-slate-200 transition-all">Cancel</button>
                                <button type="submit" className="flex-1 bg-slate-900 text-white py-3 rounded-xl font-black text-sm uppercase shadow-lg shadow-slate-100 hover:bg-black transition-all">
                                    {editingValue ? 'Update Value' : 'Add Value'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <DeleteConfirmModal
                isOpen={!!deleteConfirm}
                title={deleteConfirm?.type === 'key' ? 'Delete Master Key?' : 'Delete Master Value?'}
                message={deleteConfirm?.type === 'key'
                    ? "Deleting a master key will effectively hide all its associated values. This action can't be easily undone. Continue?"
                    : "Are you sure you want to remove this value from the system?"}
                onCancel={() => setDeleteConfirm(null)}
                onConfirm={handleDelete}
            />

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: #f8fafc; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
            `}</style>
        </div>
    );
}
