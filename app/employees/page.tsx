"use client";

import React, { useState, useEffect, useMemo } from 'react';
import {
  Search, Plus, Pencil, Trash2, Copy, RefreshCw,
  ChevronDown, Check, X, Loader2, AlertTriangle,
  User, Mail, Settings2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Employee } from '@/models/employee';
import { getAllEmployees, createEmployee, updateEmployee, deleteEmployee } from '@/services/employeeService';
import { getValuesByKeyName } from '@/services/masterService';
import PersonalizeModal from '@/app/components/PersonalizeModal';
import PaginationFooter from '@/app/components/PaginationFooter';
import DeleteConfirmModal from '@/app/components/DeleteConfirmModal';


// Mapping internal keys to human-readable labels
const COLUMN_LABELS: Record<string, string> = {
  id: "ID",
  cn1: "CN1",
  emp_no: "Emp No",
  email: "Email",
  sam_name: "SAM Name",
  division: "Division",
  business_unit: "Business Unit",
  cost_center: "Cost Center",
  cost_center_description: "Cost Center Desc",
  physical_present: "Physical Present",
  legal_entities: "Legal Entities",
  location: "Location",
  joining_date: "Joining Date",
  last_working_date: "Last Working Date",
  created_at: "Created At",
  created_by: "Created By",
  modified_at: "Modified At",
  modified_by: "Modified By",
  is_active: "Status",
};

const EmployeesTable = () => {
  // --- STATE ---
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: keyof Employee; direction: 'asc' | 'desc' } | null>({ key: 'id', direction: 'asc' });

  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    setUserRole(localStorage.getItem("user_role"));
  }, []);

  const canEdit = userRole !== 'viewer';

  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Master data options
  const [divisionOptions, setDivisionOptions] = useState<string[]>([]);
  const [businessUnitOptions, setBusinessUnitOptions] = useState<string[]>([]);
  const [costCenterOptions, setCostCenterOptions] = useState<string[]>([]);
  const [isLoadingBUs, setIsLoadingBUs] = useState(false);
  const [isLoadingCCs, setIsLoadingCCs] = useState(false);

  // Column Personalization State
  const [isPersonalizeOpen, setIsPersonalizeOpen] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<(keyof Employee)[]>([
    'emp_no', 'cn1', 'email', 'sam_name', 'division', 'business_unit', 'location', 'is_active'
  ]);

  const allAvailableFields = Object.keys(COLUMN_LABELS) as (keyof Employee)[];

  const initialForm: Partial<Employee> = {
    emp_no: '',
    cn1: '',
    email: '',
    sam_name: '',
    division: '',
    business_unit: '',
    cost_center: '',
    cost_center_description: '',
    joining_date: new Date().toISOString().split('T')[0],
    last_working_date: '',
    is_active: true,
    physical_present: true,
    legal_entities: '',
    location: '',
    created_by: 'n/a',
    modified_by: 'n/a'
  };

  const [formData, setFormData] = useState<Partial<Employee>>(initialForm);

  const toggleColumn = (col: keyof Employee) => {
    setVisibleColumns(prev =>
      prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]
    );
  };

  // --- FETCH DATA ---
  const loadEmployees = async () => {
    try {
      setIsLoading(true);
      const response = await getAllEmployees(
        currentPage,
        pageSize,
        sortConfig?.key as string,
        sortConfig?.direction as string,
        searchTerm,
        filterStatus
      );
      setEmployees(response.data);
      setTotalItems(response.total);
      setTotalPages(response.total_pages);
    } catch (error) {
      toast.error("Failed to load employees");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, [currentPage, pageSize, sortConfig?.key, sortConfig?.direction, searchTerm, filterStatus]);

  // Fetch master data (Divisions)
  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        const [divisions] = await Promise.all([
          getValuesByKeyName('DIVISION')
        ]);
        setDivisionOptions(divisions);
      } catch (error) {
        console.error('Failed to load master data:', error);
        toast.error('Failed to load some configuration options');
      }
    };
    fetchMasterData();
  }, []);

  // Fetch business unit and cost center options when division changes
  useEffect(() => {
    const loadDependentOptions = async () => {
      if (!formData.division || formData.division.trim() === '') {
        setBusinessUnitOptions([]);
        setCostCenterOptions([]);
        return;
      }

      const divSuffix = formData.division.trim().toUpperCase();

      // Load BUs
      setIsLoadingBUs(true);
      try {
        const buKey = `BU_${divSuffix}`;
        const buValues = await getValuesByKeyName(buKey);
        setBusinessUnitOptions(buValues);
      } catch (error) {
        console.error('Failed to load business unit options:', error);
        setBusinessUnitOptions([]);
      } finally {
        setIsLoadingBUs(false);
      }

      // Load CCs
      setIsLoadingCCs(true);
      try {
        const ccKey = `CC_${divSuffix}`;
        const ccValues = await getValuesByKeyName(ccKey);
        setCostCenterOptions(ccValues);
      } catch (error) {
        console.error('Failed to load cost center options:', error);
        setCostCenterOptions([]);
      } finally {
        setIsLoadingCCs(false);
      }
    };
    loadDependentOptions();
  }, [formData.division]);


  // --- AUTOMATIC SAM NAME LOGIC ---
  useEffect(() => {
    if (!isEditMode && formData.cn1) {
      const parts = formData.cn1.trim().split(" ");
      if (parts.length >= 2) {
        const firstPart = parts[0].substring(0, 3).toLowerCase();
        const lastPart = parts[parts.length - 1].substring(0, 3).toLowerCase();
        setFormData(prev => ({ ...prev, sam_name: firstPart + lastPart }));
      }
    }
  }, [formData.cn1, isEditMode]);

  // --- HANDLERS ---
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadEmployees();
      toast.success("Data refreshed");
    } catch (err) {
      toast.error("Refresh failed");
    } finally {
      setIsRefreshing(false);
    }
  };

  const copyToClipboard = (text: string, id: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Email copied!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const openAddModal = () => {
    setIsEditMode(false);
    setEditId(null);
    setFormData(initialForm);
    setIsDirty(false);
    setIsModalOpen(true);
  };

  const openEditModal = (emp: Employee) => {
    setIsEditMode(true);
    setEditId(emp.id);
    setFormData({
      ...emp,
      joining_date: emp.joining_date ? emp.joining_date.split('T')[0] : '',
      last_working_date: emp.last_working_date ? emp.last_working_date.split('T')[0] : ''
    });
    setIsDirty(false);
    setIsModalOpen(true);
  };

  const handleInputChange = (updates: Partial<Employee>) => {
    setFormData(prev => ({ ...prev, ...updates }));
    setIsDirty(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const loadingToast = toast.loading(isEditMode ? 'Updating...' : 'Creating...');

    try {
      const userName = localStorage.getItem("user_name") || "System";

      if (isEditMode && editId) {
        const payload = { ...formData, modified_by: userName };
        const updated = await updateEmployee(editId, payload);
        setEmployees(prev => prev.map(emp => emp.id === editId ? updated : emp));
        toast.success("Employee updated", { id: loadingToast });
      } else {
        const payload = { ...formData, created_by: userName, modified_by: userName };
        const created = await createEmployee(payload);
        setEmployees(prev => [created, ...prev]);
        toast.success("Employee registered", { id: loadingToast });
      }
      setIsModalOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Operation failed", { id: loadingToast });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteEmployee(deleteId);
      setEmployees(prev => prev.filter(emp => emp.id !== deleteId));
      toast.success("Employee deleted");
    } catch (error) {
      toast.error("Failed to delete employee");
    } finally {
      setDeleteId(null);
    }
  };



  // Helper to render cell content based on column key
  const renderCellContent = (emp: Employee, col: keyof Employee) => {
    const value = emp[col];

    if (col === 'cn1') {
      return (
        <div className="flex flex-col">
          <button
            onClick={() => copyToClipboard(emp.email || '', emp.id)}
            className="flex items-center gap-2 font-bold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer group text-left"
          >
            {emp.cn1 || 'N/A'}
            {copiedId === emp.id ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />}
          </button>
        </div>
      );
    }


    if (col === 'is_active') {
      return (
        <span className={`px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-tighter border ${value
          ? 'bg-green-50 text-green-600 border-green-100'
          : 'bg-red-50 text-red-600 border-red-100'
          }`}>
          {value ? 'Active' : 'Inactive'}
        </span>
      );
    }

    if (col === 'joining_date' || col === 'last_working_date' || col === 'created_at' || col === 'modified_at') {
      return <span className="text-xs text-slate-500">{value ? new Date(value as any).toLocaleDateString() : 'N/A'}</span>;
    }

    if (col === 'physical_present') {
      return <span className="text-slate-600">{value ? 'Yes' : 'No'}</span>;
    }

    if (col === 'email') {
      return (
        <button
          onClick={() => copyToClipboard(String(value), emp.id)}
          className="flex items-center gap-2 text-slate-600 hover:text-blue-600 transition-colors cursor-pointer group text-left text-xs"
        >
          {String(value)}
          {copiedId === emp.id ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />}
        </button>
      );
    }

    return <span className="text-slate-600">{value === null || value === undefined ? '-' : String(value)}</span>;
  };

  const startIndex = (currentPage - 1) * pageSize;

  const processedEmployees = useMemo(() => {
    // With server-side search/sort, employees already contains the processed data
    return employees;
  }, [employees]);

  if (isLoading && employees.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-blue-600" size={40} />
          <p className="text-slate-500 font-medium tracking-tight">Loading employees...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-full mx-auto min-h-screen font-sans bg-slate-50/50">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <h1 className="text-xl font-black text-slate-900 tracking-tight whitespace-nowrap">Employees Directory</h1>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative">
              <select
                value={filterStatus}
                onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
                className="bg-white border border-slate-200 rounded-xl text-sm px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm cursor-pointer font-medium min-w-[120px] appearance-none pr-8"
              >
                <option value="All">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
            </div>

            <div className="relative flex-1 md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search employees..."
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
                onChange={(e) => { setSortConfig(prev => ({ key: e.target.value as keyof Employee, direction: prev?.direction || 'asc' })); setCurrentPage(1); }}
                className="bg-white border border-slate-200 rounded-xl text-sm px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm cursor-pointer font-medium min-w-[140px] appearance-none pr-8"
              >
                <option value="id">Sort by ID</option>
                <option value="cn1">Sort by Name / CN1</option>
                <option value="emp_no">Sort by Emp No</option>
                <option value="business_unit">Sort by Business Unit</option>
                <option value="division">Sort by Division</option>
                <option value="location">Sort by Location</option>
                <option value="physical_present">Sort by Physical Present</option>
                <option value="is_active">Sort by Status</option>
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
            title="Refresh Directory"
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
            onClick={openAddModal}
            disabled={!canEdit}
            className="flex-1 md:flex-none bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl flex items-center justify-center gap-2 text-sm font-bold shadow-md active:scale-95 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus size={18} /> New Employee
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
              {isLoading ? (
                <tr>
                  <td colSpan={visibleColumns.length + 1} className="px-6 py-12 text-center">
                    <Loader2 className="animate-spin mx-auto text-blue-600" size={24} />
                  </td>
                </tr>
              ) : processedEmployees.length > 0 ? (
                processedEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                    {visibleColumns.map(col => (
                      <td key={`${emp.id}-${col}`} className="px-6 py-4 text-sm">
                        {renderCellContent(emp, col)}
                      </td>
                    ))}
                    <td className="px-6 py-4 bg-white sticky right-0 shadow-[-10px_0_15px_-10px_rgba(0,0,0,0.05)] text-center">
                      <div className="flex items-center justify-center gap-3">
                        <button 
                          onClick={() => openEditModal(emp)} 
                          disabled={!canEdit}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 transition-all hover:bg-indigo-50 rounded-md cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <Pencil size={16} />
                        </button>
                        <button 
                          onClick={() => setDeleteId(emp.id)} 
                          disabled={!canEdit}
                          className="p-1.5 text-slate-400 hover:text-red-600 transition-all hover:bg-red-50 rounded-md cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={visibleColumns.length + 1} className="px-6 py-12 text-center text-slate-400 text-sm italic">
                    No employees found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <PaginationFooter
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          startIndex={startIndex}
          setCurrentPage={setCurrentPage}
          setPageSize={setPageSize}
        />
      </div>

      <PersonalizeModal
        isOpen={isPersonalizeOpen}
        onClose={() => setIsPersonalizeOpen(false)}
        allFields={allAvailableFields as string[]}
        columnLabels={COLUMN_LABELS}
        visibleColumns={visibleColumns as string[]}
        setVisibleColumns={(cols) => setVisibleColumns(cols as (keyof Employee)[])}
        defaultColumns={['emp_no', 'cn1', 'email', 'sam_name', 'division', 'business_unit', 'location', 'is_active']}
      />

      {/* FORM MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 relative">

            {showExitConfirm && (
              <div className="absolute inset-0 bg-white/95 z-50 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-200">
                <div className="bg-amber-100 p-4 rounded-full text-amber-600 mb-4">
                  <AlertTriangle size={32} />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-2">Discard changes?</h3>
                <p className="text-slate-500 text-sm mb-8">You have unsaved changes. Are you sure you want to exit?</p>
                <div className="flex gap-3 w-full max-w-xs">
                  <button onClick={() => setShowExitConfirm(false)} className="flex-1 px-6 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 cursor-pointer">No, stay</button>
                  <button onClick={() => { setIsModalOpen(false); setShowExitConfirm(false); }} className="flex-1 px-6 py-3 rounded-xl bg-red-600 text-white font-bold text-sm shadow-lg shadow-red-100 hover:bg-red-700 cursor-pointer">Yes, exit</button>
                </div>
              </div>
            )}

            {/* MODAL HEADER */}
            <div className="flex justify-between items-center p-6 border-b bg-slate-50/50">
              <h2 className="flex-1 text-lg font-black text-slate-900 uppercase tracking-tight">
                {isEditMode ? 'Edit Employee details' : 'Register New Employee'}
              </h2>
              <div className="flex items-center gap-4">
                {isEditMode && (
                  <span className={`px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-tighter border ${formData.is_active ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'
                    }`}>
                    {formData.is_active ? 'Active' : 'Inactive'}
                  </span>
                )}
                <button onClick={() => isDirty ? setShowExitConfirm(true) : setIsModalOpen(false)} className="text-slate-400 hover:text-red-500 transition-all cursor-pointer">
                  <X size={20} />
                </button>
              </div>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Employee Number *</label>
                  <input
                    required
                    type="text"
                    value={formData.emp_no}
                    disabled={isEditMode}
                    onChange={(e) => handleInputChange({ emp_no: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium disabled:bg-slate-100 disabled:cursor-not-allowed"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Full Name / CN1 *</label>
                  <input
                    required
                    type="text"
                    value={formData.cn1 || ''}
                    onChange={(e) => handleInputChange({ cn1: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                    placeholder="e.g. John Doe"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Email Address *</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <input
                      required
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange({ email: e.target.value })}
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">SAM Name (Auto)</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <input
                      readOnly
                      type="text"
                      value={formData.sam_name}
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-500 outline-none font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Division</label>
                  <select
                    value={formData.division || ''}
                    onChange={(e) => {
                      handleInputChange({ division: e.target.value, business_unit: '', cost_center: '' });
                    }}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium cursor-pointer"
                  >
                    <option value="">Select Division</option>
                    {divisionOptions.map(div => <option key={div} value={div}>{div}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Business Unit</label>
                  <select
                    value={formData.business_unit || ''}
                    onChange={(e) => handleInputChange({ business_unit: e.target.value })}
                    disabled={!formData.division || businessUnitOptions.length === 0}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium cursor-pointer disabled:bg-slate-100 disabled:cursor-not-allowed"
                  >
                    <option value="">{isLoadingBUs ? 'Loading...' : 'Select Business Unit'}</option>
                    {businessUnitOptions.map(bu => <option key={bu} value={bu}>{bu}</option>)}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Cost Center *</label>
                  <select
                    required
                    value={formData.cost_center && formData.cost_center_description ? `${formData.cost_center} - ${formData.cost_center_description}` : formData.cost_center || ''}
                    onChange={(e) => {
                      const fullVal = e.target.value;
                      if (!fullVal) {
                        handleInputChange({ cost_center: '', cost_center_description: '' });
                        return;
                      }
                      const [cc, ...descParts] = fullVal.split(' - ');
                      const desc = descParts.join(' - '); // Rejoin in case description itself contains a dash
                      handleInputChange({ cost_center: cc, cost_center_description: desc });
                    }}
                    disabled={!formData.division || costCenterOptions.length === 0}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium cursor-pointer disabled:bg-slate-100 disabled:cursor-not-allowed"
                  >
                    <option value="">{isLoadingCCs ? 'Loading...' : 'Select Cost Center'}</option>
                    {costCenterOptions.map(cc => <option key={cc} value={cc}>{cc}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Cost Center Description</label>
                  <input
                    readOnly
                    type="text"
                    value={formData.cost_center_description || ''}
                    className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-500 outline-none font-medium cursor-default"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Joining Date *</label>
                  <input
                    required
                    type="date"
                    value={formData.joining_date}
                    onChange={(e) => handleInputChange({ joining_date: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Last Working Date</label>
                  <input
                    type="date"
                    value={formData.last_working_date}
                    onChange={(e) => handleInputChange({ last_working_date: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Legal Entities</label>
                  <input
                    type="text"
                    value={formData.legal_entities || ''}
                    onChange={(e) => handleInputChange({ legal_entities: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Location</label>
                  <input
                    type="text"
                    value={formData.location || ''}
                    onChange={(e) => handleInputChange({ location: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                  />
                </div>

                <div className="flex items-center gap-6 py-2 md:col-span-2">
                  <label className="flex items-center gap-2.5 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => handleInputChange({ is_active: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer transition-all"
                    />
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wider group-hover:text-blue-600">Active</span>
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={formData.physical_present}
                      onChange={(e) => handleInputChange({ physical_present: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer transition-all"
                    />
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wider group-hover:text-blue-600">Physical Present</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-6 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => isDirty ? setShowExitConfirm(true) : setIsModalOpen(false)}
                  className="flex-1 px-4 py-3.5 rounded-2xl border border-slate-200 text-slate-600 font-bold text-sm uppercase hover:bg-slate-50 transition-all active:scale-95 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 bg-blue-600 text-white py-3.5 rounded-2xl font-black text-sm uppercase shadow-lg shadow-blue-100 hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center cursor-pointer disabled:opacity-70"
                >
                  {isSaving ? <Loader2 className="animate-spin" size={20} /> : (isEditMode ? 'Update' : 'Register')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <DeleteConfirmModal
        isOpen={!!deleteId}
        title="Delete Employee?"
        message={<>Removing this employee is <span className="font-bold text-slate-900">permanent</span>. This cannot be undone.</>}
        onCancel={() => setDeleteId(null)}
        onConfirm={handleDelete}
      />

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>
    </div>
  );
};

export default EmployeesTable;
