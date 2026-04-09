"use client";

import React, { useState, useEffect } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2, Users, HardDrive, Download } from 'lucide-react';
import { uploadAssetsCSV } from '@/services/assetService';
import { uploadEmployeesCSV } from '@/services/employeeService';
import toast from 'react-hot-toast';

export default function BulkDataPage() {
    const [userRole, setUserRole] = useState<string | null>(null);
    const [isUploadingAssets, setIsUploadingAssets] = useState(false);
    const [isUploadingEmployees, setIsUploadingEmployees] = useState(false);
    const [assetResult, setAssetResult] = useState<any>(null);
    const [employeeResult, setEmployeeResult] = useState<any>(null);

    // Your provided SharePoint Direct Download Links
    const ASSET_TEMPLATE_URL = "https://sulzerltd-my.sharepoint.com/:x:/g/personal/samyak_dahale_sulzer_com/IQCMHcklbfqqSKpqi_7NbVk2AXccv9rMzUXlNgbZQdwDcHw?e=vCpyZg&download=1";
    const EMPLOYEE_TEMPLATE_URL = "https://sulzerltd-my.sharepoint.com/:x:/g/personal/samyak_dahale_sulzer_com/IQD-HyzOuU-ZQaeQdkZy0EmfAQtxarmQw9u1VHo7O7Ucl6w?e=JSdOAy&download=1";

    useEffect(() => {
        const role = localStorage.getItem('user_role');
        setUserRole(role);
    }, []);

    const handleAssetUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.name.endsWith('.csv')) {
            toast.error("Please upload a .csv file");
            return;
        }

        setIsUploadingAssets(true);
        setAssetResult(null);
        try {
            const result = await uploadAssetsCSV(file);
            setAssetResult(result);
            toast.success(`Successfully added ${result.added_count} assets`);
        } catch (error: any) {
            toast.error(error.message || "Failed to upload assets");
        } finally {
            setIsUploadingAssets(false);
            e.target.value = '';
        }
    };

    const handleEmployeeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.name.endsWith('.csv')) {
            toast.error("Please upload a .csv file");
            return;
        }

        setIsUploadingEmployees(true);
        setEmployeeResult(null);
        try {
            const result = await uploadEmployeesCSV(file);
            setEmployeeResult(result);
            toast.success(`Successfully added ${result.added_count} employees`);
        } catch (error: any) {
            toast.error(error.message || "Failed to upload employees");
        } finally {
            setIsUploadingEmployees(false);
            e.target.value = '';
        }
    };

    const isMasterManager = userRole === 'master manager';

    if (!isMasterManager && userRole !== null) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
                <div className="bg-red-50 p-6 rounded-3xl mb-4 text-red-500">
                    <AlertCircle size={48} />
                </div>
                <h1 className="text-2xl font-black text-slate-800 tracking-tight">Access Restricted</h1>
                <p className="text-slate-500 mt-2 max-w-md">
                    Bulk data upload is only accessible to <strong>Master Managers</strong>.
                </p>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8 p-6">
            <header>
                <h1 className="text-3xl font-black text-slate-800 tracking-tight">Bulk Data Management</h1>
                <p className="text-slate-500 font-medium">Upload CSV files to populate your inventory and employee directory.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* ASSET UPLOAD CARD */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-8 flex-1">
                        <div className="bg-blue-50 w-14 h-14 rounded-2xl flex items-center justify-center text-blue-600 mb-6">
                            <HardDrive size={28} />
                        </div>
                        <h2 className="text-xl font-black text-slate-800 mb-2">Assets Inventory</h2>
                        <p className="text-sm text-slate-500 leading-relaxed mb-6">
                            Import large volumes of hardware assets. Ensure headers match the required structure.
                        </p>

                        <div className="relative group">
                            <input
                                type="file"
                                accept=".csv"
                                onChange={handleAssetUpload}
                                disabled={isUploadingAssets}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
                                id="asset-upload"
                            />
                            <div className={`
                                border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300
                                ${isUploadingAssets ? 'bg-slate-50 border-slate-200' : 'bg-blue-50/30 border-blue-200 group-hover:bg-blue-50 group-hover:border-blue-400'}
                            `}>
                                {isUploadingAssets ? (
                                    <div className="flex flex-col items-center">
                                        <Loader2 className="animate-spin text-blue-600 mb-2" size={32} />
                                        <span className="text-sm font-bold text-slate-600 uppercase tracking-widest">Processing...</span>
                                    </div>
                                ) : (
                                    <>
                                        <Upload className="mx-auto text-blue-500 mb-3" size={32} />
                                        <span className="block text-sm font-bold text-blue-700">Click or drag CSV here</span>
                                        <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest mt-1 block">Assets CSV Schema</span>
                                    </>
                                )}
                            </div>
                        </div>

                        {assetResult && (
                            <div className="mt-6 p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                                <div className="flex justify-between text-xs font-bold">
                                    <span className="text-emerald-600 uppercase">Successful: {assetResult.added_count}</span>
                                    <span className="text-red-500 uppercase">Failed: {assetResult.failed_count}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* UPDATED FOOTER WITH LINK */}
                    <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Templates available</span>
                        <a
                            href={ASSET_TEMPLATE_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 group"
                        >
                            <Download size={12} className="group-hover:translate-y-0.5 transition-transform" />
                            Download Sample Asset CSV
                        </a>
                    </div>
                </div>

                {/* EMPLOYEE UPLOAD CARD */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-8 flex-1">
                        <div className="bg-indigo-50 w-14 h-14 rounded-2xl flex items-center justify-center text-indigo-600 mb-6">
                            <Users size={28} />
                        </div>
                        <h2 className="text-xl font-black text-slate-800 mb-2">Employees Directory</h2>
                        <p className="text-sm text-slate-500 leading-relaxed mb-6">
                            Populate your organizational directory. Required: Emp No, CN1, Email, and Business Unit.
                        </p>

                        <div className="relative group">
                            <input
                                type="file"
                                accept=".csv"
                                onChange={handleEmployeeUpload}
                                disabled={isUploadingEmployees}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
                                id="employee-upload"
                            />
                            <div className={`
                                border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300
                                ${isUploadingEmployees ? 'bg-slate-50 border-slate-200' : 'bg-indigo-50/30 border-indigo-200 group-hover:bg-indigo-50 group-hover:border-indigo-400'}
                            `}>
                                {isUploadingEmployees ? (
                                    <div className="flex flex-col items-center">
                                        <Loader2 className="animate-spin text-indigo-600 mb-2" size={32} />
                                        <span className="text-sm font-bold text-slate-600 uppercase tracking-widest">Processing...</span>
                                    </div>
                                ) : (
                                    <>
                                        <Upload className="mx-auto text-indigo-500 mb-3" size={32} />
                                        <span className="block text-sm font-bold text-indigo-700">Click or drag CSV here</span>
                                        <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest mt-1 block">Employees CSV Schema</span>
                                    </>
                                )}
                            </div>
                        </div>

                        {employeeResult && (
                            <div className="mt-6 p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                                <div className="flex justify-between text-xs font-bold">
                                    <span className="text-emerald-600 uppercase">Successful: {employeeResult.added_count}</span>
                                    <span className="text-red-500 uppercase">Failed: {employeeResult.failed_count}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* UPDATED FOOTER WITH LINK */}
                    <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Templates available</span>
                        <a
                            href={EMPLOYEE_TEMPLATE_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 group"
                        >
                            <Download size={12} className="group-hover:translate-y-0.5 transition-transform" />
                            Download Sample Employee CSV
                        </a>
                    </div>
                </div>
            </div>

            {/* INFO ALERT */}
            <div className="bg-amber-50 border border-amber-100 rounded-3xl p-6 flex gap-4">
                <AlertCircle className="text-amber-500 shrink-0" size={24} />
                <div className="text-sm text-amber-800 leading-relaxed italic">
                    <strong>Note:</strong> Bulk uploads are permanent. Please verify your CSV headers and data types against the system requirements before proceeding.
                </div>
            </div>
        </div>
    );
}