"use client";

import React, { useState, useEffect, useMemo } from 'react';
import {
    Search,
    Loader2,
    History,
    User,
    Calendar,
    Box,
    ChevronRight,
    ArrowRight,
    Monitor,
    ShoppingCart,
    PlusCircle,
    Copy
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getAssetsList } from '@/services/assetService';
import { getAssetHistory } from '@/services/allocationService';
import { Asset } from '@/models/asset';
import { Allocation } from '@/models/allocation';

export default function MindMappingPage() {
    const [assets, setAssets] = useState<Asset[]>([]);
    const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
    const [history, setHistory] = useState<Allocation[]>([]);
    const [isLoadingAssets, setIsLoadingAssets] = useState(true);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const loadAssets = async () => {
            try {
                const data = await getAssetsList(1000);
                setAssets(data);
            } catch (error) {
                toast.error("Failed to load assets");
            } finally {
                setIsLoadingAssets(false);
            }
        };
        loadAssets();
    }, []);

    const handleAssetSelect = async (asset: Asset) => {
        setSelectedAsset(asset);
        setIsLoadingHistory(true);
        setSearchTerm(`${asset.host_name} (${asset.asset_type})`);
        try {
            const data = await getAssetHistory(asset.id);
            setHistory(data);
        } catch (error) {
            toast.error("Failed to load asset history");
            setHistory([]);
        } finally {
            setIsLoadingHistory(false);
        }
    };

    const handleCopy = (text: string, label: string) => {
        if (!text || text === 'N/A') return;
        navigator.clipboard.writeText(text);
        toast.success(`${label} copied!`, {
            style: {
                borderRadius: '12px',
                background: '#333',
                color: '#fff',
                fontSize: '12px',
                fontWeight: 'bold'
            },
        });
    };

    const filteredAssets = useMemo(() => {
        if (!searchTerm || (selectedAsset && searchTerm === `${selectedAsset.host_name} (${selectedAsset.asset_type})`)) {
            return [];
        }
        return assets.filter(a =>
            a.host_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            a.asset_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            a.serial_num?.toLowerCase().includes(searchTerm.toLowerCase())
        ).slice(0, 10);
    }, [searchTerm, assets, selectedAsset]);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* HEADER SECTION */}
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full -mr-32 -mt-32 opacity-50 blur-3xl"></div>
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-blue-600 mb-1">
                            <div className="p-2 bg-blue-50 rounded-lg">
                                <History size={20} />
                            </div>
                            <span className="text-xs font-black uppercase tracking-widest">Asset Lifecycle</span>
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Mind-Mapping</h1>
                        <p className="text-slate-500 text-sm max-w-md italic font-medium">
                            Track the journey of your assets through time and employees.
                        </p>
                    </div>

                    <div className="relative w-full md:w-96 group">
                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                            <Search className="text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                        </div>
                        <input
                            type="text"
                            className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all outline-none"
                            placeholder="Search Host Name or Serial..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />

                        {filteredAssets.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden divide-y divide-slate-50 animate-in slide-in-from-top-2 duration-200">
                                {filteredAssets.map(asset => (
                                    <button
                                        key={asset.id}
                                        onClick={() => handleAssetSelect(asset)}
                                        className="w-full px-5 py-4 text-left hover:bg-blue-50 transition-colors flex items-center justify-between group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 group-hover:bg-white group-hover:text-blue-600 transition-all">
                                                <Monitor size={18} />
                                            </div>
                                            <div>
                                                <p className="font-black text-slate-900 leading-none mb-1">{asset.host_name}</p>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{asset.asset_type} • {asset.serial_num}</p>
                                            </div>
                                        </div>
                                        <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-500 transform group-hover:translate-x-1 transition-all" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {!selectedAsset ? (
                <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-20 flex flex-col items-center justify-center text-center space-y-4 shadow-sm">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-2 border border-slate-100 animate-pulse">
                        <Box size={40} />
                    </div>
                    <h2 className="text-xl font-black text-slate-400">No Asset Selected</h2>
                    <p className="text-slate-400 text-sm max-w-xs font-medium italic">
                        Search and select an asset to view its complete allocation history and timeline.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4 duration-500">

                    {/* ASSET DETAILS CARD */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6 sticky top-6">
                            <div className="flex items-center gap-3 pb-6 border-b border-slate-100">
                                <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                                    <Monitor size={28} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 leading-tight">{selectedAsset.host_name}</h3>
                                    <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-black uppercase rounded tracking-widest">{selectedAsset.status}</span>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {[
                                    { label: "Asset Type", value: selectedAsset.asset_type, icon: <Box size={14} /> },
                                    { label: "Make / Model", value: `${selectedAsset.make} ${selectedAsset.model}`, icon: <Monitor size={14} /> },
                                    { label: "Serial Number", value: selectedAsset.serial_num, icon: <History size={14} /> },
                                    { label: "Mac ID", value: selectedAsset.mac_id, icon: <History size={14} /> },
                                ].map((item, idx) => (
                                    <div key={idx} className="flex flex-col space-y-1 group">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                            <span className="text-slate-300">{item.icon}</span> {item.label}
                                        </span>
                                        <button
                                            onClick={() => handleCopy(item.value || '', item.label)}
                                            className="flex items-center gap-2 text-sm font-black text-slate-800 hover:text-blue-600 transition-all cursor-pointer text-left w-fit"
                                            title={`Click to copy ${item.label}`}
                                        >
                                            <span>{item.value || 'N/A'}</span>
                                            {item.value && item.value !== 'N/A' && (
                                                <Copy size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-500" />
                                            )}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* HISTORY TIMELINE / TABLE */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden min-h-[500px]">
                            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
                                    <History size={18} className="text-blue-500" /> Asset Lifecycle
                                </h3>
                                <span className="text-[10px] font-black text-slate-400 bg-white border border-slate-200 px-2.5 py-1 rounded-full uppercase tracking-tighter">
                                    {history.length} Allocation{history.length !== 1 ? 's' : ''}
                                </span>
                            </div>

                            {isLoadingHistory ? (
                                <div className="flex flex-col items-center justify-center p-20 space-y-4">
                                    <Loader2 className="animate-spin text-blue-500" size={40} />
                                    <p className="text-slate-400 font-bold text-xs uppercase tracking-widest animate-pulse">Fetching records...</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-100">

                                    {/* MILESTONE 1: PURCHASED */}
                                    <div className="p-6 hover:bg-slate-50 transition-colors relative group">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                            <div className="flex items-center gap-6">
                                                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white bg-violet-500 shadow-lg shadow-violet-100">
                                                    <ShoppingCart size={22} />
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-black text-slate-900 text-lg leading-tight">Asset Purchased</span>
                                                        <span className="px-2 py-0.5 bg-violet-50 text-violet-600 text-[10px] font-extrabold uppercase rounded">Origin</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                                                        <Calendar size={12} className="text-slate-300" />
                                                        <span>
                                                            {selectedAsset.purchase_date
                                                                ? new Date(selectedAsset.purchase_date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
                                                                : 'Date not recorded'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter bg-violet-100 text-violet-700">
                                                PURCHASED
                                            </span>
                                        </div>
                                    </div>

                                    {/* CONNECTOR */}
                                    <div className="flex items-center gap-3 px-8 py-2 bg-slate-50/80">
                                        <div className="w-10 flex justify-center"><div className="w-0.5 h-4 bg-slate-200 mx-auto rounded"></div></div>
                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest"></span>
                                    </div>

                                    {/* MILESTONE 2: ADDED TO SYSTEM */}
                                    <div className="p-6 hover:bg-slate-50 transition-colors relative group">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                            <div className="flex items-center gap-6">
                                                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white bg-blue-500 shadow-lg shadow-blue-100">
                                                    <PlusCircle size={22} />
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-black text-slate-900 text-lg leading-tight">Added to System</span>
                                                        <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-extrabold uppercase rounded">Created</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                                                        <Calendar size={12} className="text-slate-300" />
                                                        <span>
                                                            {selectedAsset.created_at
                                                                ? new Date(selectedAsset.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
                                                                : 'Date not recorded'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter bg-blue-100 text-blue-700">
                                                REGISTERED
                                            </span>
                                        </div>
                                    </div>

                                    {/* CONNECTOR + ALLOCATIONS SECTION */}
                                    <div className="flex items-center gap-3 px-8 py-2 bg-slate-50/80">
                                        <div className="w-10 flex justify-center"><div className="w-0.5 h-4 bg-slate-200 mx-auto rounded"></div></div>
                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Allocations</span>
                                    </div>

                                    {/* ALLOCATION RECORDS or empty note */}
                                    {history.length === 0 ? (
                                        <div className="p-6 flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-slate-100 text-slate-300">
                                                <User size={22} />
                                            </div>
                                            <p className="text-slate-400 font-bold text-sm italic">No allocations recorded for this asset.</p>
                                        </div>
                                    ) : [...history].reverse().map((record, idx) => (
                                        <div key={record.id} className="p-6 hover:bg-slate-50 transition-colors relative group">
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                                <div className="flex items-center gap-6">
                                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white ${!record.returned_at ? 'bg-green-500 shadow-lg shadow-green-100' : 'bg-slate-300 text-white'}`}>
                                                        <User size={24} />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-black text-slate-900 text-lg leading-tight">{record.employee_name}</span>
                                                            <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-extrabold uppercase rounded">{record.emp_no}</span>
                                                        </div>
                                                        <div className="flex items-center gap-4 text-slate-400 mt-1">
                                                            <div className="flex items-center gap-1.5 text-xs font-bold whitespace-nowrap">
                                                                <Calendar size={12} className="text-slate-300" />
                                                                <span>{new Date(record.allotted_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                                            </div>
                                                            <ArrowRight size={12} className="text-slate-300" />
                                                            <div className="flex items-center gap-1.5 text-xs font-bold whitespace-nowrap">
                                                                <Calendar size={12} className="text-slate-300" />
                                                                <span className={record.returned_at ? 'text-slate-500' : 'text-green-600 font-black'}>
                                                                    {record.returned_at ? new Date(record.returned_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : 'PRESENT'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col items-end gap-2">
                                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${record.returned_at ? 'bg-slate-100 text-slate-500' : 'bg-green-100 text-green-700'
                                                        }`}>
                                                        {record.returned_at ? 'COMPLETED' : 'ACTIVE ASSIGNMENT'}
                                                    </span>
                                                    {record.remarks && (
                                                        <p className="text-[10px] text-slate-400 italic max-w-[200px] text-right truncate group-hover:whitespace-normal group-hover:overflow-visible transition-all">
                                                            "{record.remarks}"
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
