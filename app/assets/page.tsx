"use client";

import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Plus, X, Trash2, Search, Loader2, Pencil, Eye,
  ChevronUp, ChevronDown, AlertTriangle, Copy, RefreshCw,
  ChevronLeft, ChevronRight, Settings2, GripVertical, Scan, QrCode
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import toast from 'react-hot-toast';
//import { getAllAssets } from '@/services/assetService';

import getAllAssets, { createAsset, updateAsset, deleteAsset } from '@/services/assetService';
import { getValuesByKeyName } from '@/services/masterService';
import { Asset } from '@/models/asset';


const ALPHANUMERIC_REGEX = /^[a-zA-Z0-9\s-]+$/;

// Mapping internal keys to human-readable labels
const COLUMN_LABELS: Record<string, string> = {
  id: "ID",
  asset_type: "Category",
  assetno: "Asset Number",
  serial_num: "Serial Number",
  host_name: "Host Name",
  u_uid: "UUID",
  make: "Make",
  model: "Model",
  lifecycle_status: "Lifecycle",
  purchase_date: "Purchased",
  warranty_start_date: "Warranty Start",
  warranty_end_date: "Warranty End",
  last_issued: "Last Issued",
  company_name: "Employee",
  cost_center: "Cost Centre",
  physical_present: "Physically Present",
  legal_entities: "Legal Entities",
  is_allocated: "Allocated",
  remarks: "Remarks",
  status: "Status",
  staging_status: "Staging Status",
  created_by: "Created By",
  created_at: "Created At",
  modified_by: "Modified By",
  modified_at: "Modified At",
  location: "Location",
  mac_id: "MAC ID",
};

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Column Personalization State
  const [isPersonalizeOpen, setIsPersonalizeOpen] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<(keyof Asset)[]>([
    'id', 'asset_type', 'assetno', 'serial_num', 'host_name', 'u_uid', 'make', 'model', 'lifecycle_status', 'purchase_date', 'warranty_start_date', 'warranty_end_date', 'last_issued', 'company_name', 'cost_center', 'physical_present', 'legal_entities', 'is_allocated', 'remarks', 'status', 'staging_status', 'created_by', 'created_at', 'modified_by', 'modified_at', 'location', 'mac_id'
  ]);

  const [locations, setLocations] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [statusOptions, setStatusOptions] = useState<string[]>([]);
  const [stagingStatusOptions, setStagingStatusOptions] = useState<string[]>([]);
  const [makes, setMakes] = useState<string[]>([]);
  const [lifecycleOptions, setLifecycleOptions] = useState<string[]>([]);

  const allAvailableFields = Object.keys(COLUMN_LABELS) as (keyof Asset)[];

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [selectedQRAsset, setSelectedQRAsset] = useState<Asset | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Asset; direction: 'asc' | 'desc' } | null>({ key: 'id', direction: 'asc' });

  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    setUserRole(localStorage.getItem("user_role"));
  }, []);

  const canEdit = userRole !== 'viewer';

  const loadAssets = async () => {
    setIsLoading(true);
    try {
      const response = await getAllAssets(
        currentPage,
        pageSize,
        sortConfig?.key as string,
        sortConfig?.direction as string,
        searchTerm,
        selectedCategory
      );
      setAssets(response.data);
      setTotalItems(response.total);
      setTotalPages(response.total_pages);
    } catch (error) {
      toast.error("Could not load assets from server");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAssets();
  }, [currentPage, pageSize, sortConfig?.key, sortConfig?.direction, searchTerm, selectedCategory]);

  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        const [locs, cats, stats, mks, stageStats, lifeStats] = await Promise.all([
          getValuesByKeyName('LOCATIONS'),
          getValuesByKeyName('CATEGORIES'),
          getValuesByKeyName('ASSET_STATUS'),
          getValuesByKeyName('MAKES'),
          getValuesByKeyName('ASSET_STAGING_STATUS'),
          getValuesByKeyName('LIFECYCLE_STATUS')
        ]);
        if (locs.length > 0) setLocations(locs);
        if (cats.length > 0) setCategories(cats);
        if (stats.length > 0) setStatusOptions(stats);
        if (mks.length > 0) setMakes(mks);
        if (stageStats.length > 0) setStagingStatusOptions(stageStats);
        if (lifeStats.length > 0) setLifecycleOptions(lifeStats);
      } catch (err) {
        console.error("Failed to load master data:", err);
      }
    };
    fetchMasterData();
  }, []);


  /* 
  * Initial Form State matching the Asset Model 
  */
  const initialForm: Asset = {
    id: 0,
    assetno: 0,
    serial_num: '',
    asset_type: '',
    host_name: '',
    make: '',
    model: '',
    lifecycle_status: 'Available',
    purchase_date: new Date().toISOString().split('T')[0],
    warranty_start_date: '',
    warranty_end_date: '',
    last_issued: null,
    u_uid: '',
    mac_id: '',
    company_name: '',
    location: '',
    status: 'In-Stock',
    staging_status: 'Not Staged',
    remarks: '',
    is_allocated: false,
    is_deleted: false,
    created_at: new Date().toISOString(),
    created_by: 'n/a',
    modified_at: new Date().toISOString(),
    modified_by: 'n/a',
    cost_center: 'Not allocated yet',
    physical_present: 'Not allocated yet',
    legal_entities: 'Not allocated yet',
  };

  const [formData, setFormData] = useState<Asset>(initialForm);
  const [isDirty, setIsDirty] = useState(false);
  const [models, setModels] = useState<string[]>([]);

  // Scanner States & Ref
  const scanInputRef = useRef<HTMLInputElement>(null);
  const [barcodeValue, setBarcodeValue] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);

  // Focus scanner input when modal opens for a new asset
  useEffect(() => {
    if (isModalOpen && !editId) {
      const timer = setTimeout(() => {
        scanInputRef.current?.focus();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isModalOpen, editId]);

  const handleBarcodeScan = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const value = barcodeValue.trim();
      if (!value) return;

      setIsScanning(true);
      setScanResult(null);

      // Simulate a small delay for the 'loading' state as requested
      await new Promise(resolve => setTimeout(resolve, 800));

      try {
        let field: keyof Asset = 'serial_num';
        let formattedValue = value;

        const clean = value.replace(/[:\-\s]/g, '').toUpperCase();

        // Logic deduced from d2.png:
        // MAC: 12 hex chars -> XX:XX:XX:XX:XX:XX
        // UUID: Starts with '30S' or is 32 hex chars -> 8-4-4-4-12 format
        if (clean.length === 12 && /^[0-9A-F]{12}$/.test(clean)) {
          field = 'mac_id';
          formattedValue = clean.match(/.{1,2}/g)?.join(':') || value;
        } else if (value.toUpperCase().startsWith('30S') || (clean.length === 32 && /^[0-9A-F]{32}$/.test(clean))) {
          field = 'u_uid';
          let raw = value.toUpperCase();
          if (raw.startsWith('30S')) raw = raw.substring(3);
          const uuidClean = raw.replace(/[-\s]/g, '');
          if (uuidClean.length === 32) {
            formattedValue = `${uuidClean.substring(0, 8)}-${uuidClean.substring(8, 12)}-${uuidClean.substring(12, 16)}-${uuidClean.substring(16, 20)}-${uuidClean.substring(20)}`;
          } else {
            formattedValue = uuidClean;
          }
        }

        handleInputChange({ [field]: formattedValue });
        setScanResult(`Successfully captured ${COLUMN_LABELS[field]}: ${formattedValue}`);
        setBarcodeValue('');
        toast.success(`${COLUMN_LABELS[field]} captured: ${formattedValue}`, { icon: '🔍' });
      } catch (err) {
        setScanResult('Failed to process scan');
        toast.error('Check scanner connection or input');
      } finally {
        setIsScanning(false);
        // Refocus for next scan
        scanInputRef.current?.focus();
      }
    }
  };

  // Dynamic Model Fetch based on Make
  useEffect(() => {
    const fetchModels = async () => {
      if (!formData.make) {
        setModels([]);
        return;
      }
      try {
        const keyName = `MODEL_${formData.make.toUpperCase()}`;
        console.log(`Fetching models for: ${keyName}`);
        const data = await getValuesByKeyName(keyName);
        setModels(data);
      } catch (err) {
        console.error("Failed to load models for make:", formData.make, err);
        setModels([]);
      }
    };
    fetchModels();
  }, [formData.make]);

  const toggleColumn = (col: keyof Asset) => {
    setVisibleColumns(prev =>
      prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]
    );
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadAssets();
      toast.success("Synced with server");
    } catch (err) {
      toast.error("Refresh failed");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Host Name copied!");
  };

  const handleOpenAdd = () => {
    setEditId(null);
    setFormData(initialForm);
    setIsDirty(false);
    setIsModalOpen(true);
    setShowExitConfirm(false);
  };

  const handleEdit = (asset: Asset) => {
    setEditId(asset.id ? asset.id.toString() : null);
    setFormData(asset);
    setIsDirty(false);
    setIsModalOpen(true);
    setShowExitConfirm(false);
  };

  const handleCancelClick = () => {
    if (isDirty) {
      setShowExitConfirm(true);
    } else {
      closeEntireModal();
    }
  };

  const closeEntireModal = () => {
    setIsModalOpen(false);
    setShowExitConfirm(false);
    setIsDirty(false);
  };


  const confirmDelete = async () => {
    if (deleteConfirmId) {
      try {
        await deleteAsset(Number(deleteConfirmId));
        setAssets(assets.filter(a => a.id !== Number(deleteConfirmId)));
        toast.success(`Asset deleted successfully`);
      } catch (error: any) {
        toast.error(error.message || "Failed to delete from server");
      } finally {
        setDeleteConfirmId(null);
      }
    }
  };

  const handleInputChange = (updates: Partial<Asset>) => {
    const sanitizedUpdates = { ...updates };

    // Auto-format MAC ID (Deduce from d2.png)
    if (updates.mac_id) {
      const clean = updates.mac_id.replace(/[:\-\s]/g, '').toUpperCase();
      if (clean.length === 12 && /^[0-9A-F]{12}$/.test(clean)) {
        sanitizedUpdates.mac_id = clean.match(/.{1,2}/g)?.join(':') || clean;
      }
    }

    // Auto-format UUID (Deduce from d2.png)
    if (updates.u_uid) {
      let raw = updates.u_uid.toUpperCase();
      if (raw.startsWith('30S')) raw = raw.substring(3);
      const clean = raw.replace(/[-\s]/g, '');
      if (clean.length === 32 && /^[0-9A-F]{32}$/.test(clean)) {
        sanitizedUpdates.u_uid = `${clean.substring(0, 8)}-${clean.substring(8, 12)}-${clean.substring(12, 16)}-${clean.substring(16, 20)}-${clean.substring(20)}`;
      }
    }

    setFormData(prev => ({ ...prev, ...sanitizedUpdates }));
    setIsDirty(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    /* ... validation logic ... */

    setIsSaving(true);
    const loadingToast = toast.loading(editId ? 'Updating...' : 'Saving...');

    try {
      let createdAsset: Asset;
      const userName = localStorage.getItem("user_name") || "System";

      if (editId) {
        // Update existing asset
        const payload = { ...formData, modified_by: userName };
        const response = await updateAsset(Number(editId), payload);
        createdAsset = response;
        setAssets(prev => prev.map(a => a.id === Number(editId) ? createdAsset : a));
        toast.success("Updated Successfully!", { id: loadingToast });
      } else {
        // Create new asset
        // Create a copy of formData and remove ID if it's 0 (to let backend generate it)
        const { id, created_at, modified_at, ...payload } = formData;
        const finalPayload = {
          ...payload,
          created_by: userName,
          modified_by: userName
        };

        const response = await createAsset(finalPayload);
        createdAsset = response;

        // Add to list
        setAssets(prev => [createdAsset, ...prev]);
        toast.success("Saved to Database!", { id: loadingToast });
      }

      setIsModalOpen(false);
    } catch (error: any) {
      console.error("Save error:", error);
      toast.error(error.message || "Server error: Failed to save", { id: loadingToast });
    } finally {
      setIsSaving(false);
    }
  };

  const processedAssets = useMemo(() => {
    // With server-side search, assets already contains the filtered data for the current page
    return assets;
  }, [assets]);

  // Calculate starting index for "Showing X to Y" display
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedAssets = processedAssets; // In a backend-paginated world, processedAssets is the current page

  // Helper to render cell content based on column key
  const renderCellContent = (item: Asset, col: keyof Asset) => {
    const value = item[col];

    if (col === 'host_name') {
      return (
        <div className="flex items-center gap-2">
          <button onClick={() => handleCopy(String(value))} className="flex items-center gap-2 font-bold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer group">
            {String(value)}
            <Copy size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        </div>
      );
    }

    if (col === 'status') {
      const s = String(value);
      return (
        <span className={`px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-tighter ${s === 'In-Stock' || s === 'In-stock' ? 'bg-green-50 text-green-600 border border-green-100' :
          s === 'Available' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
            s === 'Retired' ? 'bg-slate-900 text-white border border-slate-800' :
              'bg-slate-50 text-slate-500 border border-slate-100'
          }`}>
          {s}
        </span>
      );
    }

    if (col === 'staging_status') {
      const s = String(value);
      return (
        <span className={`px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-tighter ${s.toLowerCase() === 'staged' ? 'bg-green-50 text-green-600 border border-green-100' :
          s.toLowerCase() === 'not staged' ? 'bg-red-50 text-red-600 border border-red-100' :
            'bg-slate-50 text-slate-500 border border-slate-100'
          }`}>
          {s}
        </span>
      );
    }

    if (col === 'purchase_date' || col === 'warranty_start_date' || col === 'warranty_end_date' || col === 'created_at' || col === 'modified_at' || col === 'last_issued') {
      let dateStyle = "text-xs text-slate-500";

      if (col === 'warranty_end_date' && value) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const warrantyDate = new Date(value as any);
        if (warrantyDate < today) {
          dateStyle = "text-xs text-red-600 font-bold bg-red-50 px-1.5 py-0.5 rounded";
        }
      }

      return <span className={dateStyle}>{value ? new Date(value as any).toLocaleDateString() : 'N/A'}</span>;
    }

    if (col === 'company_name') {
      return <span className="font-medium text-slate-900">{String(value) || <span className="text-slate-300">Unassigned</span>}</span>;
    }

    if (col === 'is_allocated') {
      return <span className="text-slate-600">{value ? 'Yes' : 'No'}</span>;
    }

    return <span className="text-slate-600">{value === null || value === undefined ? '-' : String(value)}</span>;
  };

  const getAssetCode = (asset: Asset | null) => {
    if (!asset) return "";
    // We provide a JSON object with only the essential fields
    // This satisfies apps expecting JSON while keeping the QR code simple
    return JSON.stringify({
      id: asset.id,
      assetno: asset.assetno,
      serial_num: asset.serial_num,
      asset_type: asset.asset_type
    });
  };

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-full mx-auto min-h-screen font-sans bg-slate-50/50">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <h1 className="text-xl font-black text-slate-900 tracking-tight whitespace-nowrap">Assets Inventory</h1>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search assets..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="w-full pl-9 pr-10 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all shadow-sm"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="relative hidden lg:block">
              <select
                value={sortConfig?.key || 'id'}
                onChange={(e) => { setSortConfig(prev => ({ key: e.target.value as keyof Asset, direction: prev?.direction || 'asc' })); setCurrentPage(1); }}
                className="bg-white border border-slate-200 rounded-xl text-sm px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm cursor-pointer font-medium min-w-[140px] appearance-none pr-8"
              >
                {allAvailableFields.map(field => (
                  <option key={field} value={field}>Sort by {COLUMN_LABELS[field]}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
            </div>

            <div className="relative hidden lg:block">
              <select
                value={sortConfig?.direction || 'asc'}
                onChange={(e) => { setSortConfig(prev => ({ key: prev?.key || 'id', direction: e.target.value as 'asc' | 'desc' })); setCurrentPage(1); }}
                className="bg-white border border-slate-200 rounded-xl text-sm px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm cursor-pointer font-medium appearance-none pr-8"
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-all shadow-sm active:scale-95 cursor-pointer disabled:opacity-50"
            title="Refresh Inventory"
          >
            <RefreshCw size={18} className={`${isRefreshing ? 'animate-spin' : ''}`} />
          </button>

          {/* PERSONALIZE FIELDS BUTTON */}
          <button
            onClick={() => setIsPersonalizeOpen(true)}
            className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-all shadow-sm active:scale-95 cursor-pointer flex items-center gap-2 text-sm font-semibold"
            title="Personalize Columns"
          >
            <Settings2 size={18} />
            <span className="hidden sm:inline">Personalize</span>
          </button>

          <button
            onClick={handleOpenAdd}
            disabled={!canEdit}
            className="flex-1 md:flex-none bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl flex items-center justify-center gap-2 text-sm font-bold shadow-md active:scale-95 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
          >
            <Plus size={18} /> New Asset
          </button>
        </div>
      </div>

      {/* TABLE CONTAINER */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[calc(100vh-200px)] overflow-hidden">
        <div className="overflow-auto custom-scrollbar flex-1">
          <table className="w-full text-left border-collapse min-w-[1100px]">
            <thead className="sticky top-0 z-20 bg-slate-50 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
              <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                {visibleColumns.map(col => (
                  <th key={col} className="px-6 py-4 border-b border-slate-200">
                    <div className="flex items-center gap-1">{COLUMN_LABELS[col]}</div>
                  </th>
                ))}
                <th className="px-6 py-4 text-center bg-slate-50 sticky right-0 z-30 shadow-[-10px_0_15px_-10px_rgba(0,0,0,0.05)] border-b border-slate-200">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedAssets.length > 0 ? (
                paginatedAssets.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    {visibleColumns.map(col => (
                      <td key={`${item.id}-${col}`} className="px-6 py-4 text-sm">
                        {renderCellContent(item, col)}
                      </td>
                    ))}
                    <td className="px-6 py-4 bg-white sticky right-0 shadow-[-10px_0_15px_-10px_rgba(0,0,0,0.05)] text-center">
                      <div className="flex items-center justify-center gap-3">
                        <button
                          onClick={() => setSelectedQRAsset(item)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 transition-all hover:bg-blue-50 rounded-md cursor-pointer"
                          title="Show QR Code"
                        >
                          <QrCode size={16} />
                        </button>
                        <button
                          onClick={() => handleEdit(item)}
                          disabled={!canEdit}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 transition-all hover:bg-indigo-50 rounded-md cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-slate-400"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(item.id.toString())}
                          disabled={!canEdit}
                          className="p-1.5 text-slate-400 hover:text-red-600 transition-all hover:bg-red-50 rounded-md cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-slate-400"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={visibleColumns.length + 1} className="px-6 py-12 text-center text-slate-400 text-sm italic">No assets found matching your search.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* --- PAGINATION FOOTER --- */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="text-sm text-slate-500 font-medium">
            Showing <span className="text-slate-900">{startIndex + 1}</span> to <span className="text-slate-900">{Math.min(startIndex + pageSize, totalItems)}</span> of <span className="text-slate-900">{totalItems}</span> entries
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 mr-4">
              <span className="text-xs text-slate-400 font-bold uppercase">Rows:</span>
              <select
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                className="bg-transparent text-sm font-bold text-slate-600 outline-none cursor-pointer"
              >
                {[5, 10, 20, 50].map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </div>

            <nav className="flex items-center gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
                className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft size={16} />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-9 h-9 text-sm font-bold rounded-lg transition-all ${currentPage === page
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-100'
                    : 'text-slate-600 hover:bg-white border border-transparent hover:border-slate-200'
                    }`}
                >
                  {page}
                </button>
              ))}

              <button
                disabled={currentPage === totalPages || totalPages === 0}
                onClick={() => setCurrentPage(prev => prev + 1)}
                className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight size={16} />
              </button>
            </nav>
          </div>
        </div>
      </div>

      {/* PERSONALIZE FIELDS MODAL */}
      {isPersonalizeOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-200">
            <div className="flex justify-between items-center p-5 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">Personalize fields</h2>
              <button onClick={() => setIsPersonalizeOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
                <X size={24} />
              </button>
            </div>

            <div className="p-6">
              <p className="text-sm text-slate-500 mb-6">Select the columns you'd like and arrange how they're ordered</p>

              <div className="grid grid-cols-2 gap-8 h-[400px]">
                {/* Available Columns (Left) */}
                <div className="flex flex-col gap-2 overflow-y-auto pr-2 custom-scrollbar">
                  <span className="text-xs font-bold text-slate-400 uppercase mb-2">Available columns ({allAvailableFields.length})</span>
                  <div className="flex gap-2 mb-2">
                    <button type="button" onClick={() => setVisibleColumns([...allAvailableFields])} className="text-[10px] font-bold text-blue-600 hover:text-blue-800 uppercase cursor-pointer hover:underline">Select All</button>
                    <span className="text-slate-300">|</span>
                    <button type="button" onClick={() => setVisibleColumns([])} className="text-[10px] font-bold text-slate-500 hover:text-red-500 uppercase cursor-pointer hover:underline">Unselect All</button>
                  </div>
                  {allAvailableFields.map(field => (
                    <label key={field} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors group">
                      <input
                        type="checkbox"
                        checked={visibleColumns.includes(field)}
                        onChange={() => toggleColumn(field)}
                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                      <span className="text-sm text-slate-700">{COLUMN_LABELS[field]}</span>
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
                          <span className="text-sm font-medium text-slate-700">{COLUMN_LABELS[col]}</span>
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
              <button onClick={() => setVisibleColumns([...allAvailableFields])} className="text-sm text-slate-500 hover:text-slate-800 transition-colors underline cursor-pointer">
                Reset all columns
              </button>
              <div className="flex gap-3">
                <button onClick={() => setIsPersonalizeOpen(false)} className="px-6 py-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-bold transition-all cursor-pointer">Cancel</button>
                <button onClick={() => setIsPersonalizeOpen(false)} className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-md transition-all cursor-pointer">Apply</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL - FIXED SIZE */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="bg-red-50 w-14 h-14 rounded-full flex items-center justify-center text-red-600 mx-auto mb-4">
                <Trash2 size={28} />
              </div>
              <h3 className="text-lg font-black text-slate-900 mb-2">Delete Asset?</h3>
              <p className="text-slate-500 text-sm mb-6 px-2">
                Removing <span className="font-bold text-slate-900">{deleteConfirmId}</span> is permanent. This cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs uppercase tracking-wide hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white font-bold text-xs uppercase tracking-wide shadow-md shadow-red-100 hover:bg-red-700 cursor-pointer transition-all active:scale-95"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FORM MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 relative">

            {showExitConfirm && (
              <div className="absolute inset-0 bg-white/95 z-50 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-200">
                <div className="bg-amber-100 p-4 rounded-full text-amber-600 mb-4">
                  <AlertTriangle size={32} />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-2">Discard changes?</h3>
                <p className="text-slate-500 text-sm mb-8">You have unsaved changes. Are you sure you want to exit?</p>
                <div className="flex gap-3 w-full max-w-xs">
                  <button onClick={() => setShowExitConfirm(false)} className="flex-1 px-6 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 cursor-pointer">No, stay</button>
                  <button onClick={closeEntireModal} className="flex-1 px-6 py-3 rounded-xl bg-red-600 text-white font-bold text-sm shadow-lg shadow-red-100 hover:bg-red-700 cursor-pointer">Yes, exit</button>
                </div>
              </div>
            )}

            {/* MODAL HEADER */}
            <div className="flex justify-between items-center p-6 border-b bg-slate-50/50">
              <h2 className="flex-1 text-lg font-black text-slate-900 uppercase tracking-tight">
                {editId ? 'Edit Asset' : 'Register Asset'}
              </h2>

              <div className="flex items-center gap-4">
                {editId && (
                  <span className={`px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-tighter ${formData.status === 'In-Stock' || formData.status === 'In-stock' ? 'bg-green-50 text-green-600 border border-green-100' :
                    formData.status === 'Available' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                      formData.status === 'Retired' ? 'bg-slate-900 text-white border border-slate-800' :
                        'bg-slate-50 text-slate-500 border border-slate-100'
                    }`}>
                    {formData.status}
                  </span>
                )}
                <button onClick={handleCancelClick} className="text-slate-400 hover:text-red-500 transition-all cursor-pointer">
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* QUICK SCAN INTERFACE - Only for New Assets */}
            {!editId && (
              <div className="px-6 py-4 bg-blue-50/50 border-b border-blue-100/50 group">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-100 p-2.5 rounded-xl text-blue-600 shadow-sm">
                    <Scan size={18} className={isScanning ? 'animate-pulse' : ''} />
                  </div>
                  <div className="flex-1 relative">
                    <input
                      ref={scanInputRef}
                      type="text"
                      placeholder="Ready for Barcode / QR Scan..."
                      className="w-full bg-transparent border-b-2 border-blue-200 py-1 text-sm font-bold text-blue-900 outline-none focus:border-blue-500 transition-all placeholder:text-blue-300"
                      value={barcodeValue}
                      onChange={(e) => setBarcodeValue(e.target.value)}
                      onKeyDown={handleBarcodeScan}
                      disabled={isScanning}
                    />
                    {isScanning && (
                      <div className="absolute right-0 top-1/2 -translate-y-1/2">
                        <Loader2 className="animate-spin text-blue-500" size={16} />
                      </div>
                    )}
                  </div>
                  {scanResult && (
                    <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest animate-in fade-in slide-in-from-right-2">
                      {scanResult}
                    </div>
                  )}
                </div>
                <p className="text-[9px] font-bold text-blue-400 uppercase tracking-widest mt-2 ml-12 opacity-60">
                  RugTek LS-3002 HID Active • Scanner automatically sends Enter
                </p>
              </div>
            )}

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">
                    Asset Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    className="w-full border border-slate-200 p-2.5 rounded-xl text-sm outline-none bg-slate-50/50 focus:border-blue-500 transition-all font-medium"
                    placeholder="e.g. 1001"
                    value={formData.assetno || ''}
                    onChange={(e) => handleInputChange({ assetno: Number(e.target.value) })}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">
                    Serial Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    className="w-full border border-slate-200 p-2.5 rounded-xl text-sm outline-none bg-slate-50/50 focus:border-blue-500 transition-all font-medium"
                    placeholder="e.g. SN123456789"
                    value={formData.serial_num || ''}
                    onChange={(e) => handleInputChange({ serial_num: e.target.value })}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">
                    UUID <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    className="w-full border border-slate-200 p-2.5 rounded-xl text-sm outline-none bg-slate-50/50 focus:border-blue-500 transition-all font-medium"
                    placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
                    value={formData.u_uid || ''}
                    onChange={(e) => handleInputChange({ u_uid: e.target.value })}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    disabled={!!editId}
                    className="w-full border border-slate-200 p-2.5 rounded-xl text-sm outline-none bg-slate-50/50 focus:border-blue-500 transition-all font-medium cursor-pointer disabled:bg-slate-100 disabled:cursor-not-allowed"
                    value={formData.asset_type || ''}
                    onChange={(e) => handleInputChange({ asset_type: e.target.value })}
                  >
                    <option value="">Select Category</option>
                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">
                    Host Name
                  </label>
                  <input
                    maxLength={100}
                    className={`w-full border p-2.5 rounded-xl text-sm outline-none transition-all font-medium ${formData.host_name && !ALPHANUMERIC_REGEX.test(formData.host_name) ? 'border-red-500 bg-red-50' : 'border-slate-200 focus:border-blue-500'
                      } disabled:bg-slate-100 disabled:cursor-not-allowed`}
                    placeholder="e.g. MSE-07"
                    value={formData.host_name || ''}
                    onChange={(e) => handleInputChange({ host_name: e.target.value })}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">
                    Make
                  </label>
                  <select
                    className="w-full border border-slate-200 p-2.5 rounded-xl text-sm outline-none bg-slate-50/50 focus:border-blue-500 transition-all font-medium cursor-pointer"
                    value={formData.make || ''}
                    onChange={(e) => handleInputChange({ make: e.target.value, model: '' })}
                  >
                    <option value="">Select Make</option>
                    {makes.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">
                    Location
                  </label>
                  <select
                    className="w-full border border-slate-200 p-2.5 rounded-xl text-sm outline-none bg-slate-50/50 focus:border-blue-500 transition-all font-medium cursor-pointer"
                    value={formData.location || ''}
                    onChange={(e) => handleInputChange({ location: e.target.value })}
                  >
                    <option value="">Select Location</option>
                    {locations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">
                    Model
                  </label>
                  <select
                    className="w-full border border-slate-200 p-2.5 rounded-xl text-sm outline-none bg-slate-50/50 focus:border-blue-500 transition-all font-medium cursor-pointer"
                    value={formData.model || ''}
                    onChange={(e) => handleInputChange({ model: e.target.value })}
                  >
                    <option value="">Select Model</option>
                    {models.map(model => (
                      <option key={model} value={model}>{model}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">
                    MAC ID
                  </label>
                  <input
                    className="w-full border border-slate-200 p-2.5 rounded-xl text-sm outline-none bg-slate-50/50 focus:border-blue-500 transition-all font-medium"
                    placeholder="e.g. 00:0a:95:9d:68:16"
                    value={formData.mac_id || ''}
                    onChange={(e) => handleInputChange({ mac_id: e.target.value })}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">
                    Purchased Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    type="date"
                    className="w-full border border-slate-200 p-2.5 rounded-xl text-sm outline-none focus:border-blue-500 transition-all font-medium"
                    value={formData.purchase_date ? String(formData.purchase_date).split('T')[0] : ''}
                    onChange={(e) => handleInputChange({ purchase_date: e.target.value })}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Warranty Start Date</label>
                  <input
                    type="date"
                    className="w-full border border-slate-200 p-2.5 rounded-xl text-sm outline-none focus:border-blue-500 transition-all font-medium"
                    value={formData.warranty_start_date ? String(formData.warranty_start_date).split('T')[0] : ''}
                    onChange={(e) => handleInputChange({ warranty_start_date: e.target.value })}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Warranty End Date</label>
                  <input
                    type="date"
                    className="w-full border border-slate-200 p-2.5 rounded-xl text-sm outline-none focus:border-blue-500 transition-all font-medium"
                    value={formData.warranty_end_date ? String(formData.warranty_end_date).split('T')[0] : ''}
                    onChange={(e) => handleInputChange({ warranty_end_date: e.target.value })}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">
                    Lifecycle Status
                  </label>
                  <select
                    className="w-full border border-slate-200 p-2.5 rounded-xl text-sm outline-none bg-slate-50/50 focus:border-blue-500 transition-all font-medium cursor-pointer"
                    value={formData.lifecycle_status || ''}
                    onChange={(e) => handleInputChange({ lifecycle_status: e.target.value })}
                  >
                    <option value="">Select Lifecycle</option>
                    {lifecycleOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">
                    Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    className="w-full border border-slate-200 p-2.5 rounded-xl text-sm outline-none bg-blue-50/30 border-blue-100 focus:border-blue-500 transition-all text-black-600 cursor-pointer"
                    value={formData.status || ''}
                    onChange={(e) => handleInputChange({ status: e.target.value })}
                  >
                    <option value="">Select Status</option>
                    {statusOptions.map(status => <option key={status} value={status}>{status}</option>)}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">
                    Staging Status
                  </label>
                  <select
                    className="w-full border border-slate-200 p-2.5 rounded-xl text-sm outline-none bg-slate-50/50 focus:border-blue-500 transition-all font-medium cursor-pointer"
                    value={formData.staging_status || ''}
                    onChange={(e) => handleInputChange({ staging_status: e.target.value })}
                  >
                    <option value="">Select Staging Status</option>
                    {stagingStatusOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>

                <div className="space-y-1 md:col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Remarks</label>
                  <textarea
                    rows={2}
                    className="w-full border border-slate-200 p-2.5 rounded-xl text-sm outline-none bg-slate-50/50 focus:border-blue-500 transition-all font-medium"
                    placeholder="Any additional notes..."
                    value={formData.remarks || ''}
                    onChange={(e) => handleInputChange({ remarks: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-6 border-t mt-4">
                <button type="button" onClick={handleCancelClick} className="flex-1 bg-slate-100 text-slate-600 py-3.5 rounded-2xl font-bold text-sm uppercase hover:bg-slate-200 transition-all active:scale-95 cursor-pointer">Cancel</button>
                <button
                  disabled={isSaving}
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-3.5 rounded-2xl font-black text-sm uppercase shadow-lg shadow-blue-100 hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center cursor-pointer disabled:opacity-70"
                >
                  {isSaving ? <Loader2 className="animate-spin" size={20} /> : (editId ? 'Update Asset' : 'Save Asset')}
                </button>
              </div>
            </form>
          </div>
        </div >
      )
      }

      {/* QR CODE MODAL */}
      {selectedQRAsset && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[80] p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b bg-slate-50/50">
              <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">Asset QR Code</h2>
              <button onClick={() => setSelectedQRAsset(null)} className="text-slate-400 hover:text-red-500 transition-all cursor-pointer">
                <X size={20} />
              </button>
            </div>
            <div className="p-8 flex flex-col items-center gap-6">
              <div className="bg-white p-4 rounded-2xl shadow-inner border-2 border-slate-100">
                <QRCodeSVG
                  value={getAssetCode(selectedQRAsset)}
                  size={96}
                  level="H"
                  marginSize={4}
                  imageSettings={{
                    src: "/logo.svg",
                    height: 18,
                    width: 18,
                    excavate: true,
                  }}
                />
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm font-black text-slate-900">{selectedQRAsset.host_name || 'Generic Asset'}</p>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{selectedQRAsset.serial_num}</p>
              </div>
              <button
                onClick={() => setSelectedQRAsset(null)}
                className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 cursor-pointer shadow-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>
    </div >
  );
}
