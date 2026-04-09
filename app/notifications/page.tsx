"use client";

import React, { useEffect, useState } from "react";
import { Search, X, RefreshCw, AlertCircle, FileText, Users, Loader2, Copy, ShieldAlert } from "lucide-react";
import { getNotificationCounts, NotificationCounts, getNotificationDetails, NotificationDetails } from "@/services/notificationService";
import toast from "react-hot-toast";

export default function NotificationsPage() {
    const [counts, setCounts] = useState<NotificationCounts | null>(null);
    const [details, setDetails] = useState<NotificationDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    const fetchCounts = async () => {
        setIsLoading(true);
        try {
            const userName = localStorage.getItem("user_name") || "n/a";
            const data = await getNotificationCounts(userName);
            const detailData = await getNotificationDetails(userName);
            setCounts(data);
            setDetails(detailData);
        } catch (error) {
            toast.error("Failed to load notifications");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCounts();
    }, []);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success(`Copied: ${text}`);
    };

    return (
        <div className="p-4 md:p-6 space-y-6 max-w-full mx-auto min-h-screen font-sans bg-slate-50/50">

            {/* HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                        Notifications Center
                    </h1>
                    <p className="text-sm text-slate-500 font-medium">Manage your pending tasks and incomplete entries</p>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <button
                        onClick={fetchCounts}
                        disabled={isLoading}
                        className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-all shadow-sm active:scale-95 cursor-pointer disabled:opacity-50"
                        title="Refresh counts"
                    >
                        <RefreshCw size={18} className={isLoading ? "animate-spin" : ""} />
                    </button>
                </div>
            </div>

            {/* STATS CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* INCOMPLETE ASSETS */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <FileText size={80} />
                    </div>
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-3 bg-amber-50 rounded-2xl text-amber-600">
                            <FileText size={24} />
                        </div>
                        {isLoading ? (
                            <Loader2 size={20} className="animate-spin text-slate-300" />
                        ) : (
                            <span className="text-3xl font-black text-slate-900">{counts?.incomplete_assets || 0}</span>
                        )}
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 mb-1">Incomplete Assets</h3>
                        <p className="text-sm text-slate-500">Asset records missing key information created/modified by you</p>
                    </div>

                </div>

                {/* INCOMPLETE EMPLOYEES */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Users size={80} />
                    </div>
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
                            <Users size={24} />
                        </div>
                        {isLoading ? (
                            <Loader2 size={20} className="animate-spin text-slate-300" />
                        ) : (
                            <span className="text-3xl font-black text-slate-900">{counts?.incomplete_employees || 0}</span>
                        )}
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 mb-1">Incomplete Employees</h3>
                        <p className="text-sm text-slate-500">Employee profiles missing mandatory details assigned to you</p>
                    </div>

                </div>

                {/* EXPIRED WARRANTIES */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <ShieldAlert size={80} />
                    </div>
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-3 bg-red-50 rounded-2xl text-red-600">
                            <ShieldAlert size={24} />
                        </div>
                        {isLoading ? (
                            <Loader2 size={20} className="animate-spin text-slate-300" />
                        ) : (
                            <span className="text-3xl font-black text-slate-900">{counts?.expired_warranties || 0}</span>
                        )}
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 mb-1">Expired Warranties</h3>
                        <p className="text-sm text-slate-500">Assets whose hardware warranty coverage has lapsed</p>
                    </div>

                </div>

                {/* TOTAL PENDING */}
                <div className="bg-slate-900 p-6 rounded-3xl shadow-xl shadow-slate-200 group overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <AlertCircle size={80} className="text-white" />
                    </div>
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-3 bg-white/10 rounded-2xl text-white">
                            <AlertCircle size={24} />
                        </div>
                        {isLoading ? (
                            <Loader2 size={20} className="animate-spin text-slate-500" />
                        ) : (
                            <span className="text-3xl font-black text-white">{counts?.total || 0}</span>
                        )}
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white mb-1">Total Pending Tasks</h3>
                        <p className="text-sm text-slate-400">Combined total of data entries requiring your attention</p>
                    </div>

                </div>
            </div>

            {/* SEARCH AND FILTER Section (Placeholder for future list) */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <h2 className="text-lg font-black text-slate-800">Notification Details</h2>

                    </div>

                </div>

                <div className="p-6">
                    {isLoading ? (
                        <div className="flex justify-center items-center py-12">
                            <Loader2 size={32} className="animate-spin text-slate-300" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {/* Assets List */}
                            <div>
                                <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                                    <FileText size={18} className="text-amber-500" />
                                    Incomplete Assets ({details?.incomplete_assets?.length || 0})
                                </h3>
                                {details?.incomplete_assets && details.incomplete_assets.length > 0 ? (
                                    <ul className="space-y-2">
                                        {details.incomplete_assets.filter(id => id.toLowerCase().includes(searchTerm.toLowerCase())).map((uuid, i) => (
                                            <li key={`asset-${i}`} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100 transition-colors">
                                                <span className="text-sm font-medium text-slate-700 font-mono">{uuid}</span>
                                                <button onClick={() => copyToClipboard(uuid)} className="p-1.5 text-slate-400 hover:text-blue-600 rounded-md hover:bg-white shadow-sm transition-all" title="Copy U_UID">
                                                    <Copy size={16} />
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-sm text-slate-500 italic p-4 bg-slate-50 rounded-xl text-center">No incomplete assets found.</p>
                                )}
                            </div>

                            {/* Employees List */}
                            <div>
                                <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                                    <Users size={18} className="text-indigo-500" />
                                    Incomplete Employees ({details?.incomplete_employees?.length || 0})
                                </h3>
                                {details?.incomplete_employees && details.incomplete_employees.length > 0 ? (
                                    <ul className="space-y-2">
                                        {details.incomplete_employees.filter(emp => emp.toLowerCase().includes(searchTerm.toLowerCase())).map((empNo, i) => (
                                            <li key={`emp-${i}`} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100 transition-colors">
                                                <span className="text-sm font-medium text-slate-700 font-mono">{empNo}</span>
                                                <button onClick={() => copyToClipboard(empNo)} className="p-1.5 text-slate-400 hover:text-blue-600 rounded-md hover:bg-white shadow-sm transition-all" title="Copy Employee Number">
                                                    <Copy size={16} />
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-sm text-slate-500 italic p-4 bg-slate-50 rounded-xl text-center">No incomplete employees found.</p>
                                )}
                            </div>

                            {/* Expired Warranty Hostnames */}
                            <div>
                                <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                                    <ShieldAlert size={18} className="text-red-500" />
                                    Expired Warranties ({details?.expired_warranties?.length || 0})
                                </h3>
                                {details?.expired_warranties && details.expired_warranties.length > 0 ? (
                                    <ul className="space-y-2">
                                        {details.expired_warranties.filter(host => host.toLowerCase().includes(searchTerm.toLowerCase())).map((hostname, i) => (
                                            <li key={`host-${i}`} className="flex items-center justify-between p-3 bg-red-50/50 border border-red-100 rounded-xl hover:bg-red-50 transition-colors group">
                                                <button
                                                    onClick={() => copyToClipboard(hostname)}
                                                    className="text-sm font-bold text-slate-700 hover:text-red-600 transition-colors text-left"
                                                >
                                                    {hostname}
                                                </button>
                                                <button onClick={() => copyToClipboard(hostname)} className="p-1.5 text-slate-400 group-hover:text-red-600 rounded-md hover:bg-white shadow-sm transition-all" title="Copy Hostname">
                                                    <Copy size={16} />
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-sm text-slate-500 italic p-4 bg-slate-50 rounded-xl text-center">No expired warranties found.</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
}
