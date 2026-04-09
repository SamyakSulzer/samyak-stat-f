"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Search, Loader2, RefreshCw, ChevronDown, ChevronLeft, ChevronRight, X, AlertTriangle, Settings2, GripVertical, Undo2, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import getAllAllocations, { createAllocation, deleteAllocation, updateAllocation } from '@/services/allocationService';
import { getAllEmployees } from '@/services/employeeService';
import getAllAssets, { getAssetsList } from '@/services/assetService';
import { Allocation } from '@/models/allocation';
import { Employee } from '@/models/employee';
import { Asset } from '@/models/asset';

// Mapping internal keys to human-readable labels
const COLUMN_LABELS: Record<string, string> = {
  id: "ID",
  employee_id: "Employee ID",
  asset_id: "Asset ID",
  emp_no: "Emp No",
  employee_name: "Employee Name",
  host_name: "Host Name",
  asset_type: "Asset Type",
  allotted_at: "Allotted At",
  returned_at: "Returned At",
  remarks: "Remarks",
  created_at: "Created At",
  created_by: "Created By",
  modified_at: "Modified At",
  modified_by: "Modified By",
};

export default function AllocationsPage() {
  const router = useRouter();
  // --- STATE ---
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);

  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    setUserRole(localStorage.getItem("user_role"));
  }, []);

  const canEdit = userRole !== 'viewer';

  // Search States
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSearch, setActiveSearch] = useState("");

  const [sortConfig, setSortConfig] = useState<{ key: keyof Allocation; direction: 'asc' | 'desc' } | null>({ key: 'id', direction: 'asc' });

  // Pagination States
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Column Personalization State
  const [isPersonalizeOpen, setIsPersonalizeOpen] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<(keyof Allocation)[]>([
    'emp_no', 'employee_name', 'host_name', 'asset_type', 'remarks'
  ]);

  const allAvailableFields = Object.keys(COLUMN_LABELS) as (keyof Allocation)[];

  // Modal States
  const [retireModalOpen, setRetireModalOpen] = useState(false);
  const [selectedAllocation, setSelectedAllocation] = useState<Allocation | null>(null);
  const getLocaleISOString = (date: Date = new Date()) => {
    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 16);
  };

  const [returnDate, setReturnDate] = useState(getLocaleISOString());

  const initialForm: Partial<Allocation> = {
    emp_no: '',
    host_name: '',
    allotted_at: getLocaleISOString(),
    returned_at: null,
    remarks: '',
  };

  const [formData, setFormData] = useState<Partial<Allocation>>(initialForm);

  const toggleColumn = (col: keyof Allocation) => {
    setVisibleColumns(prev =>
      prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]
    );
  };

  // --- API ACTIONS ---
  const loadAllocations = async () => {
    setIsLoading(true);
    try {
      const response = await getAllAllocations(
        currentPage,
        pageSize,
        sortConfig?.key as string,
        sortConfig?.direction as string,
        activeSearch
      );
      setAllocations(response.data);
      setTotalItems(response.total);
      setTotalPages(response.total_pages);
    } catch (error) {
      toast.error("Could not load allocations from server");
    } finally {
      setIsLoading(false);
    }
  };

  const loadDropdownData = async () => {
    try {
      const [empRes, assetData] = await Promise.all([
        getAllEmployees(1, 100), // Max allowed by backend is 100
        getAssetsList(500)       // Normal GET asset API (max 500)
      ]);
      setEmployees(empRes.data);
      setAssets(assetData);
    } catch (error) {
      console.error("Error loading dropdown data:", error);
      toast.error("Failed to load employees or assets for selection");
    }
  };

  useEffect(() => {
    loadAllocations();
  }, [currentPage, pageSize, sortConfig?.key, sortConfig?.direction, activeSearch]);

  useEffect(() => {
    loadDropdownData();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadAllocations();
    setIsRefreshing(false);
    toast.success("Data synchronized");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    // Find if there is an existing ACTIVE allocation for this host_name
    const existingActiveAllocation = allocations.find(
      (a: Allocation) =>
        a.host_name?.toLowerCase() === formData.host_name?.toLowerCase() &&
        !a.returned_at
    );

    if (existingActiveAllocation) {
      // Custom message showing the holder's name and number
      toast.error(
        `Asset "${formData.host_name}" is already allocated to ${existingActiveAllocation.employee_name} (${existingActiveAllocation.emp_no})`,
        { duration: 5000 }
      );
      return;
    }

    const loadingToast = toast.loading("Saving allocation...");
    setIsSaving(true);
    try {
      const userName = localStorage.getItem("user_name") || "System";
      const payload = {
        ...formData,
        created_by: userName,
        modified_by: userName
      };

      const response = await createAllocation(payload);
      setAllocations(prev => [response, ...prev]);
      toast.success(`Allocated successfully`, { id: loadingToast });
      setFormData(initialForm);
      // Re-fetch to ensure we have the latest asset states
      loadDropdownData();
    } catch (error: any) {
      toast.error(error.message || "Failed to save allocation", { id: loadingToast });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteAllocation(id);
      setAllocations(prev => prev.filter(a => a.id !== id));
      toast.success("Allocation deleted");
      loadDropdownData(); // Refresh available assets
    } catch (error: any) {
      toast.error(error.message || "Delete failed");
    }
  };

  const handleOpenRetire = (alloc: Allocation) => {
    setSelectedAllocation(alloc);
    setReturnDate(getLocaleISOString());
    setRetireModalOpen(true);
  };

  const confirmRetire = async () => {
    if (!selectedAllocation?.id) return;

    const loadingToast = toast.loading("Retiring allocation...");
    setIsSaving(true);
    try {
      const userName = localStorage.getItem("user_name") || "System";

      // 1. Update allocation: set returned_at and modified_by
      await updateAllocation(selectedAllocation.id, {
        returned_at: returnDate as any,
        modified_by: userName
      });

      // 2. Update the asset status to 'Available', is_allocated to false, and modified_by
      if (selectedAllocation.asset_id) {
        const { updateAsset } = await import('@/services/assetService');
        await updateAsset(selectedAllocation.asset_id, {
          status: 'In-Stock',
          is_allocated: false,
          modified_by: userName
        });
      }

      toast.success("Allocation retired successfully", { id: loadingToast });
      setRetireModalOpen(false);
      loadAllocations();
      loadDropdownData();
    } catch (error: any) {
      toast.error(error.message || "Failed to retire allocation", { id: loadingToast });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveSearch(searchTerm);
  };

  const filteredAllocations = useMemo(() => {
    return allocations;
  }, [allocations]);

  // Helper to render cell content based on column key
  const renderCellContent = (alloc: Allocation, col: keyof Allocation) => {
    const value = alloc[col];

    if (col === 'id') {
      return <span className="text-slate-400 font-medium">{String(value)}</span>;
    }

    if (col === 'emp_no') {
      return <span className="font-bold text-slate-900">{String(value)}</span>;
    }

    if (col === 'employee_name') {
      return <span className="text-slate-700">{String(value)}</span>;
    }

    if (col === 'host_name') {
      return (
        <div>
          <span className="font-bold text-blue-600">{alloc.host_name}</span>
          {alloc.returned_at && (
            <span className="ml-2 px-2 py-1 rounded text-[10px] font-black uppercase tracking-tighter border bg-amber-50 text-amber-600 border-amber-100">
              Returned
            </span>
          )}
        </div>
      );
    }

    if (col === 'allotted_at' || col === 'returned_at' || col === 'created_at' || col === 'modified_at') {
      return <span className="text-xs text-slate-500">{value ? new Date(value as any).toLocaleString() : 'N/A'}</span>;
    }

    if (col === 'remarks') {
      return <span className="text-slate-500 text-xs truncate max-w-[200px] block">{value ? String(value) : '-'}</span>;
    }

    return <span className="text-slate-600">{value === null || value === undefined ? '-' : String(value)}</span>;
  };

  const startIndex = (currentPage - 1) * pageSize;

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-4 md:p-6 min-h-screen bg-transparent">
      {/* PAGE HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Asset Allocation Management</h1>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="p-2 text-slate-400 hover:text-blue-600 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={20} className={isRefreshing ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* INLINE FORM SECTION */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-6">Create New Allocation</h2>
        <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-400 tracking-widest uppercase ml-1">Employee</label>
            <div className="relative">
              <select
                required
                value={formData.emp_no || ''}
                className="w-full border border-slate-200 p-2.5 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all font-medium appearance-none bg-white pr-10"
                onChange={(e) => setFormData({ ...formData, emp_no: e.target.value })}
              >
                <option value="">Select Employee</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.emp_no}>
                    {emp.cn1} ({emp.emp_no})
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <ChevronDown size={16} />
              </div>
            </div>
          </div>
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-400 tracking-widest uppercase ml-1">Asset (Host Name)</label>
            <div className="relative">
              <select
                required
                value={formData.host_name || ''}
                className="w-full border border-slate-200 p-2.5 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all font-medium appearance-none bg-white pr-10"
                onChange={(e) => setFormData({ ...formData, host_name: e.target.value })}
              >
                <option value="">Select Asset</option>
                {assets.map(asset => (
                  <option key={asset.id} value={asset.host_name || ''}>
                    {asset.asset_type} - {asset.host_name || 'N/A'}
                    {/* Visual cue for the user */}
                    {asset.is_allocated ? ` (Allocated)` : ''}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <ChevronDown size={16} />
              </div>
            </div>
          </div>
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-400 tracking-widest uppercase ml-1">Allocation Timestamp</label>
            <input
              required
              type="datetime-local"
              value={formData.allotted_at instanceof Date
                ? getLocaleISOString(formData.allotted_at)
                : (formData.allotted_at || getLocaleISOString())}
              className="w-full border border-slate-200 p-2.5 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all font-medium bg-white"
              onChange={(e) => setFormData({ ...formData, allotted_at: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-400 tracking-widest uppercase ml-1">Remarks</label>
            <input
              type="text"
              placeholder="Optional notes..."
              value={formData.remarks || ''}
              className="w-full border border-slate-200 p-2.5 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all font-medium"
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
            />
          </div>
          <button
            disabled={isSaving || !canEdit}
            type="submit"
            className="bg-blue-600 text-white py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-md shadow-blue-100 flex items-center justify-center gap-2 disabled:bg-slate-300 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
            {isSaving ? "Adding..." : "Add Allocation"}
          </button>
        </form>
      </div>

      {/* RECORDS HEADER & SEARCH */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-bold text-slate-800">Allocation Records</h3>
          <span className="px-2.5 py-1 bg-slate-100 text-slate-500 text-[10px] font-black rounded-full uppercase tracking-tighter">
            {totalItems} total
          </span>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
          {/* TABLE SPECIFIC SEARCH BAR */}
          <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={16} />
            <input
              type="text"
              placeholder="Search by Employee Name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all shadow-sm"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => { setSearchTerm(""); setActiveSearch(""); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors cursor-pointer"
              >
                <X size={14} />
              </button>
            )}
            <button type="submit" className="hidden">Search</button>
          </form>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative">
              <select
                value={sortConfig?.key || 'id'}
                onChange={(e) => { setSortConfig(prev => ({ key: e.target.value as keyof Allocation, direction: prev?.direction || 'asc' })); setCurrentPage(1); }}
                className="bg-white border border-slate-200 rounded-xl text-xs px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm cursor-pointer font-bold appearance-none pr-8 min-w-[120px]"
              >
                <option value="id">ID</option>
                <option value="employee_name">Name</option>
                <option value="host_name">Host</option>
                <option value="allotted_at">Date</option>
              </select>
              <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
            </div>

            <button
              onClick={() => setIsPersonalizeOpen(true)}
              className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-all shadow-sm active:scale-95 cursor-pointer"
              title="Personalize Columns"
            >
              <Settings2 size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* TABLE SECTION */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-200px)]">
        <div className="overflow-auto custom-scrollbar flex-1">
          <table className="w-full text-left border-collapse min-w-[1100px]">
            <thead className="sticky top-0 z-20 bg-slate-50 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
              <tr className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-4 border-b border-slate-200">Ack</th>
                {visibleColumns.map(col => (
                  <th key={col} className="px-6 py-4 border-b border-slate-200">
                    {COLUMN_LABELS[col]}
                  </th>
                ))}
                <th className="px-6 py-4 text-center bg-slate-50 sticky right-0 z-30 shadow-[-10px_0_15px_-10px_rgba(0,0,0,0.05)] border-b border-slate-200">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={visibleColumns.length + 2} className="px-6 py-12 text-center">
                    <Loader2 className="animate-spin mx-auto text-blue-600" size={24} />
                  </td>
                </tr>
              ) : filteredAllocations.length > 0 ? (
                filteredAllocations.map((alloc) => (
                  <tr key={alloc.id} className="hover:bg-slate-50/50 text-sm transition-colors group">
                    <td className="px-6 py-4">
                      <button
                        onClick={() => router.push(`/acknowledgement?id=${alloc.id}`)}
                        className="flex items-center justify-center h-9 w-9 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                        title="Generate Acknowledgement"
                      >
                        <FileText size={18} />
                      </button>
                    </td>
                    {visibleColumns.map(col => (
                      <td key={`${alloc.id}-${col}`} className="px-6 py-4">
                        {renderCellContent(alloc, col)}
                      </td>
                    ))}
                    <td className="px-6 py-4 text-center bg-white sticky right-0 shadow-[-10px_0_15px_-10px_rgba(0,0,0,0.05)]">
                      <div className="flex items-center justify-center gap-2">
                        {!alloc.returned_at && (

                          <button
                            type="button"
                            onClick={() => handleOpenRetire(alloc)}
                            disabled={!canEdit}
                            className={[
                              "inline-flex items-center justify-center",
                              "h-9 w-9 rounded-lg",
                              "text-slate-500 hover:text-amber-600",
                              "hover:bg-amber-50",
                              "disabled:opacity-40 disabled:cursor-not-allowed",
                              "transition-colors"
                            ].join(" ")}
                            title="Return / Retire asset"
                            aria-label="Return or retire asset"
                          >
                            <Undo2 className="h-4 w-4" />
                          </button>


                        )}
                        <button
                          onClick={() => alloc.id && handleDelete(alloc.id)}
                          disabled={!canEdit}
                          className="text-slate-300 hover:text-red-500 transition-colors p-2 hover:bg-red-50 rounded-lg cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Delete Permanently"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={visibleColumns.length + 2} className="px-6 py-12 text-center text-slate-400 italic text-sm">
                    No matching allocation records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION FOOTER */}
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
                <div className="flex flex-col gap-2 overflow-y-auto pr-2">
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
                <div className="flex flex-col gap-2 overflow-y-auto pr-2">
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
              <button onClick={() => setVisibleColumns(['id', 'emp_no', 'employee_name', 'host_name', 'asset_type', 'remarks'])} className="text-sm text-slate-500 hover:text-slate-800 transition-colors underline cursor-pointer">
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

      {/* RETIRE CONFIRMATION MODAL */}
      {retireModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-200 relative animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-[#0f172a] uppercase tracking-tight flex items-center gap-2">
                <AlertTriangle className="text-amber-500" size={24} />
                Return Asset
              </h2>
              <button
                onClick={() => setRetireModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p className="text-xs text-slate-400 font-bold uppercase mb-2 tracking-widest">Selected Allocation</p>
                <div className="text-sm">
                  <span className="font-bold text-slate-700">{selectedAllocation?.host_name}</span>
                  <span className="font-bold text-blue-600">{selectedAllocation?.employee_name}</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Return Timestamp *</label>
                <input
                  type="datetime-local"
                  required
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                />
              </div>

              <p className="text-xs text-slate-500 italic leading-relaxed">
                By confirming, the asset status will be set to <span className="text-emerald-600 font-bold">In-Stock</span> and the allocation record will be marked as <span className="text-amber-600 font-bold">Returned</span>.
              </p>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setRetireModalOpen(false)}
                  className="flex-1 py-3 font-bold text-slate-500 bg-slate-100 rounded-xl hover:bg-slate-200 uppercase transition-colors text-xs"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmRetire}
                  disabled={isSaving}
                  className="flex-1 py-3 font-bold text-white bg-amber-600 rounded-xl shadow-lg shadow-amber-500/20 hover:bg-amber-700 uppercase transition-all flex items-center justify-center text-xs disabled:bg-slate-300"
                >
                  {isSaving ? <Loader2 className="animate-spin" size={18} /> : 'Confirm Return'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
