"use client";

import React, { useState, useEffect } from 'react';
import { RefreshCw, TrendingUp, Package, Tag, Archive, Loader2, ArrowUpRight, Layers, BarChart3, Database } from 'lucide-react';
import { getAssetSummary, AssetSummary } from '@/services/assetService';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function Dashboard() {
  const [summary, setSummary] = useState<AssetSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All");

  const fetchSummary = async () => {
    try {
      const data = await getAssetSummary();
      setSummary(data);
    } catch (error) {
      toast.error("Failed to load inventory summary");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchSummary();
  };

  const getChartData = () => {
    if (summary.length === 0) return [];

    let stats = { in_stock: 0, allocated: 0, retired: 0, total: 0 };

    if (selectedCategory === "All") {
      stats = summary.reduce((acc, curr) => ({
        in_stock: acc.in_stock + curr.in_stock,
        allocated: acc.allocated + curr.allocated,
        retired: acc.retired + curr.retired,
        total: acc.total + curr.total
      }), stats);
    } else {
      const found = summary.find(s => s.category === selectedCategory);
      if (found) {
        stats = {
          in_stock: found.in_stock,
          allocated: found.allocated,
          retired: found.retired,
          total: found.total
        };
      }
    }

    if (stats.total === 0) return [];

    return [
      { label: 'In Stock', count: stats.in_stock, percentage: (stats.in_stock / stats.total) * 100, color: '#10b981', strokeColor: '#10b981' },
      { label: 'Allocated', count: stats.allocated, percentage: (stats.allocated / stats.total) * 100, color: '#4f46e5', strokeColor: '#4f46e5' },
      { label: 'Retired', count: stats.retired, percentage: (stats.retired / stats.total) * 100, color: '#94a3b8', strokeColor: '#94a3b8' }
    ].filter(s => s.count > 0);
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-10">

        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="space-y-1">
            <h2 className="text-4xl font-black text-slate-900 tracking-tight leading-tight">
              Inventory <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-indigo-400">Hub</span>
            </h2>
            <div className="flex items-center gap-2 text-slate-500 font-medium text-sm">
              <Database size={14} className="text-slate-400" />
              <p>Real-time analytics for enterprise IT hardware infrastructure.</p>
            </div>
          </div>

          <div className="flex gap-4 w-full md:w-auto">
            <Link href="/assets" className="flex-1 md:flex-none px-6 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm active:scale-95 flex items-center justify-center gap-2 group">
              <ArrowUpRight size={18} className="text-slate-400 group-hover:text-indigo-500 transition-colors" />
              Manage Assets
            </Link>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex-1 md:flex-none px-6 py-2.5 bg-indigo-600 rounded-xl text-white hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 active:scale-95 disabled:opacity-70 disabled:active:scale-100 flex items-center justify-center gap-2 text-sm font-bold"
            >
              <RefreshCw size={18} className={`${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Syncing...' : 'Sync Data'}
            </button>
          </div>
        </div>

        {/* QUICK STATS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <StatCard
            title="Aggregated Assets"
            value={summary.reduce((acc, curr) => acc + curr.total, 0)}
            icon={<Package size={22} />}
            color="indigo"
            description="Total units currently managed across all categories."
          />
          <StatCard
            title="Available Inventory"
            value={summary.reduce((acc, curr) => acc + curr.in_stock, 0)}
            icon={<Tag size={22} />}
            color="emerald"
            description="Units ready for allocation to employees or offices."
          />
          <StatCard
            title="Asset Consumption"
            value={summary.length > 0 ? (summary.reduce((acc, curr) => acc + curr.consumption, 0) / summary.length).toFixed(1) : "0"}
            suffix="%"
            icon={<TrendingUp size={22} />}
            color="amber"
            description="Average utilization percentage across categories."
          />
        </div>

        {/* INVENTORY TABLE */}
        <div className="bg-white rounded-[2rem] border border-slate-200/60 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.05)] overflow-hidden">
          <div className="p-8 border-b border-slate-100/80 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-50 rounded-2xl">
                <Archive size={24} className="text-indigo-600" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-800 tracking-tight">Summary by Category</h3>
                <p className="text-sm text-slate-400 font-medium">Breakdown of inventory distribution by status.</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-4 py-1.5 bg-slate-50 border border-slate-100 rounded-full">
              <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
              <span className="text-[10px] text-indigo-600 font-black uppercase tracking-widest">
                {summary.length} ACTIVE CATEGORIES
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50/30 text-[10px] uppercase text-slate-400 font-black tracking-[0.15em] border-b border-slate-100">
                  <th className="px-8 py-5 text-left">Category & Total count</th>
                  <th className="px-4 py-5 text-center">In Stock</th>
                  <th className="px-4 py-5 text-center">Allocated</th>
                  <th className="px-4 py-5 text-center">Retired</th>
                  <th className="px-8 py-5 text-right font-black">Utilization Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-8 py-24">
                      <div className="flex flex-col items-center justify-center space-y-4">
                        <div className="relative">
                          <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                          <Loader2 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-100 animate-pulse" size={24} />
                        </div>
                        <p className="text-sm text-slate-400 font-black uppercase tracking-widest">Compiling Analytics...</p>
                      </div>
                    </td>
                  </tr>
                ) : summary.length > 0 ? (
                  summary.map((item) => (
                    <tr key={item.category} className="group hover:bg-slate-50/80 transition-all cursor-default">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-400 text-xs border border-transparent group-hover:border-indigo-100 group-hover:bg-white group-hover:text-indigo-500 transition-all">
                            {item.total}
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-800 tracking-tight">{item.category}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Hardware Asset</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-6">
                        <div className="flex justify-center flex-col items-center">
                          <StatusPill value={item.in_stock} color="emerald" />
                        </div>
                      </td>
                      <td className="px-4 py-6">
                        <div className="flex justify-center flex-col items-center">
                          <StatusPill value={item.allocated} color="indigo" />
                        </div>
                      </td>
                      <td className="px-4 py-6">
                        <div className="flex justify-center flex-col items-center">
                          <StatusPill value={item.retired} color="slate" />
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col items-end gap-2">
                          <div className="flex items-center gap-3">
                            <span className={`text-xs font-black px-2 py-0.5 rounded-md ${item.consumption > 80 ? 'text-rose-600 bg-rose-50' :
                              item.consumption > 50 ? 'text-amber-600 bg-amber-50' :
                                'text-indigo-600 bg-indigo-50'
                              }`}>
                              {item.consumption}%
                            </span>
                          </div>
                          <div className="w-32 bg-slate-100 h-1.5 rounded-full overflow-hidden shadow-inner">
                            <div
                              className={`h-full transition-all duration-1000 ease-out ${item.consumption > 80 ? 'bg-gradient-to-r from-rose-500 to-rose-400' :
                                item.consumption > 50 ? 'bg-gradient-to-r from-amber-500 to-amber-400' :
                                  'bg-gradient-to-r from-indigo-600 to-indigo-400'
                                }`}
                              style={{ width: `${item.consumption}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-24 text-center">
                      <div className="flex flex-col items-center justify-center space-y-3 opacity-40">
                        <BarChart3 size={48} className="text-slate-300" />
                        <p className="text-slate-500 font-bold italic">No inventory data available for display.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* VISUAL ANALYTICS - Interactive Pie Chart with Filtering */}
        <div className="pb-12">
          <div className="bg-white rounded-[2rem] border border-slate-200/60 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.05)] p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-50 rounded-2xl">
                  <BarChart3 size={24} className="text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800 tracking-tight">Status Distribution</h3>
                  <p className="text-sm text-slate-400 font-medium">Visual breakdown of hardware status.</p>
                </div>
              </div>

              <div className="relative w-full md:w-64">
                <Layers className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <select
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  value={selectedCategory}
                >
                  <option value="All">All Categories</option>
                  {summary.map(item => (
                    <option key={item.category} value={item.category}>{item.category}</option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <ArrowUpRight size={14} className="text-slate-400 rotate-90" />
                </div>
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-center justify-around gap-12">
              <div className="relative w-64 h-64 flex items-center justify-center">
                {isLoading ? (
                  <div className="flex flex-col items-center">
                    <Loader2 className="animate-spin text-slate-200" size={40} />
                  </div>
                ) : (
                  <>
                    <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                      {getChartData().map((segment, index) => (
                        <circle
                          key={segment.label}
                          cx="50"
                          cy="50"
                          r="40"
                          fill="transparent"
                          stroke={segment.color}
                          strokeWidth="12"
                          strokeDasharray={`${segment.percentage} 100`}
                          strokeDashoffset={-getChartData().slice(0, index).reduce((acc, curr) => acc + curr.percentage, 0)}
                          className="transition-all duration-1000 ease-out hover:stroke-[14]"
                          style={{ transitionDelay: `${index * 150}ms` }}
                        />
                      ))}
                      <circle cx="50" cy="50" r="30" fill="white" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Total Items</p>
                      <p className="text-4xl font-black text-slate-800 tracking-tighter">
                        {selectedCategory === "All"
                          ? summary.reduce((acc, curr) => acc + curr.total, 0)
                          : summary.find(s => s.category === selectedCategory)?.total || 0
                        }
                      </p>
                    </div>
                  </>
                )}
              </div>

              <div className="flex flex-col gap-6 w-full md:w-auto min-w-[200px]">
                {getChartData().map((segment) => (
                  <div key={segment.label} className="flex items-center justify-between group cursor-default">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: segment.strokeColor }} />
                      <div>
                        <p className="text-xs font-black text-slate-700 uppercase tracking-wider">{segment.label}</p>
                        <p className="text-[10px] text-slate-400 font-bold">{segment.count} Units</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-slate-800">{segment.percentage.toFixed(0)}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// PREMIUM COMPONENTS

function StatCard({ title, value, icon, color, suffix = "", description }: any) {
  const colorMap: any = {
    indigo: {
      bg: "bg-indigo-50", text: "text-indigo-600", border: "hover:border-indigo-200", glow: "group-hover:shadow-[0_0_20px_rgba(79,70,229,0.15)]", valueText: "text-slate-800"
    },
    emerald: {
      bg: "bg-emerald-50", text: "text-emerald-600", border: "hover:border-emerald-200", glow: "group-hover:shadow-[0_0_20px_rgba(16,185,129,0.15)]", valueText: "text-slate-800"
    },
    amber: {
      bg: "bg-amber-50", text: "text-amber-600", border: "hover:border-amber-200", glow: "group-hover:shadow-[0_0_20px_rgba(245,158,11,0.15)]", valueText: "text-slate-800"
    }
  };

  const style = colorMap[color];

  return (
    <div className={`group relative bg-white p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm transition-all duration-300 hover:-translate-y-1 ${style.border} ${style.glow} cursor-default`}>
      <div className="flex justify-between items-start mb-4">
        <div className={`p-4 rounded-2xl ${style.bg} ${style.text} transition-transform group-hover:scale-110 duration-500`}>
          {icon}
        </div>
        <div className="p-1 px-2.5 rounded-full bg-slate-50 border border-slate-100">
          <ArrowUpRight size={14} className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest group-hover:text-indigo-500 transition-colors duration-300">{title}</p>
        <div className="flex items-baseline gap-1">
          <p className={`text-4xl font-black ${style.valueText} tracking-tight leading-none`}>{value}</p>
          {suffix && <span className="text-lg font-black text-slate-400 tracking-tighter">{suffix}</span>}
        </div>
      </div>
      <p className="mt-4 text-xs text-slate-400 font-medium leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity duration-300">{description}</p>
    </div>
  );
}

function StatusPill({ value, color }: { value: number, color: 'emerald' | 'indigo' | 'slate' | 'amber' | 'rose' }) {
  const styles: any = {
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
    slate: "bg-slate-50 text-slate-500 border-slate-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    rose: "bg-rose-50 text-rose-600 border-rose-100",
  };

  return (
    <div className={`min-w-[4rem] px-3 py-1.5 rounded-xl border text-sm font-black flex items-center justify-center transition-all group-hover:scale-110 ${styles[color]}`}>
      {value}
    </div>
  );
}