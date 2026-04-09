import { Employee } from '@/models/employee';

import { API_BASE_URL } from './apiConfig';
const API_URL = `${API_BASE_URL}/employees`;

export interface PaginatedEmployeeResponse {
    data: Employee[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
}

export async function getAllEmployees(
    page: number = 1,
    pageSize: number = 20,
    sort_by: string = 'id',
    order: string = 'asc',
    search: string = '',
    status: string = 'All'
): Promise<PaginatedEmployeeResponse> {
    try {
        const response = await fetch(`${API_URL}?page=${page}&page_size=${pageSize}&sort_by=${sort_by}&order=${order}&search=${encodeURIComponent(search)}&status=${encodeURIComponent(status)}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            cache: 'no-store'
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch employees: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log("Employees API Response:", data);

        if (data && Array.isArray(data.data)) {
            return data;
        } else if (Array.isArray(data)) {
            return {
                data: data,
                total: data.length,
                page: 1,
                page_size: data.length,
                total_pages: 1
            };
        } else {
            console.warn("Unexpected API response structure:", data);
            return { data: [], total: 0, page: 1, page_size: pageSize, total_pages: 0 };
        }

    } catch (err) {
        console.error("Employee Service Error:", err);
        throw err;
    }
}

export async function getEmployeeById(id: number): Promise<Employee> {
    const response = await fetch(`${API_URL}/${id}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store'
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch employee: ${response.status}`);
    }

    return await response.json();
}

export async function createEmployee(employee: Partial<Employee>) {
    try {
        const formatDate = (date: any) => {
            if (!date) return null;
            if (date instanceof Date) return date.toISOString();
            if (typeof date === 'string' && !date.includes('T') && date !== '') {
                return new Date(date).toISOString();
            }
            return date;
        };

        const payload = {
            ...employee,
            joining_date: formatDate(employee.joining_date),
            last_working_date: formatDate(employee.last_working_date),
            created_at: new Date().toISOString(),
            modified_at: new Date().toISOString(),
            is_active: employee.is_active ?? true,
            physical_present: employee.physical_present ?? true,
            created_by: employee.created_by || 1,
            modified_by: employee.modified_by || 1,
            legal_entities: employee.legal_entities || null,
            location: employee.location || null,
            cost_center_description: employee.cost_center_description || null
        };

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            let errorMessage = errorData.detail || `Failed to create employee: ${response.status}`;
            if (typeof errorMessage === 'object') errorMessage = JSON.stringify(errorMessage, null, 2);
            throw new Error(errorMessage);
        }

        return await response.json();
    } catch (err) {
        console.error("Create Employee Error:", err);
        throw err;
    }
}

export async function updateEmployee(id: number, employee: Partial<Employee>) {
    try {
        const formatDate = (date: any) => {
            if (!date) return null;
            if (date instanceof Date) return date.toISOString();
            if (typeof date === 'string' && !date.includes('T') && date !== '') {
                return new Date(date).toISOString();
            }
            return date;
        };

        const payload = {
            ...employee,
            joining_date: employee.joining_date ? formatDate(employee.joining_date) : undefined,
            last_working_date: employee.last_working_date ? formatDate(employee.last_working_date) : undefined,
            modified_at: new Date().toISOString()
        };

        Object.keys(payload).forEach(key => (payload as any)[key] === undefined && delete (payload as any)[key]);

        const response = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            let errorMessage = errorData.detail || `Failed to update employee: ${response.status}`;
            if (typeof errorMessage === 'object') errorMessage = JSON.stringify(errorMessage, null, 2);
            throw new Error(errorMessage);
        }

        return await response.json();
    } catch (err) {
        console.error("Update Employee Error:", err);
        throw err;
    }
}

export async function deleteEmployee(id: number) {
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            let errorMessage = errorData.detail || `Failed to delete employee: ${response.status}`;
            if (typeof errorMessage === 'object') errorMessage = JSON.stringify(errorMessage, null, 2);
            throw new Error(errorMessage);
        }

        return true;
    } catch (err) {
        console.error("Delete Employee Error:", err);
        throw err;
    }
}

export async function uploadEmployeesCSV(file: File) {
    try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${API_URL}/upload-csv`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || 'Failed to upload employees CSV');
        }

        return await response.json();
    } catch (err) {
        console.error("Upload Employees CSV Error:", err);
        throw err;
    }
}
