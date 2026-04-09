import { Allocation } from '@/models/allocation';

import { API_BASE_URL } from './apiConfig';

export interface PaginatedAllocationResponse {
    data: Allocation[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
}

export default async function getAllAllocations(
    page: number = 1,
    pageSize: number = 20,
    sort_by: string = 'id',
    order: string = 'asc',
    search: string = ''
): Promise<PaginatedAllocationResponse> {
    try {
        const response = await fetch(`${API_BASE_URL}/allocations?page=${page}&page_size=${pageSize}&sort_by=${sort_by}&order=${order}&search=${encodeURIComponent(search)}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            cache: 'no-store'
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch allocations: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log("Allocations API Response:", data);

        // Based on PaginatedAllocationResponse
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
        console.error("Allocation Service Error:", err);
        throw err;
    }
}

export async function createAllocation(allocation: Partial<Allocation>) {
    try {
        const formatDate = (date: any) => {
            if (!date) return null;
            if (date instanceof Date) return date.toISOString();
            return date;
        };

        const payload = {
            ...allocation,
            // Ensure modified_by is a string to avoid the 'expected str, got int' error
            modified_by: allocation.modified_by ? String(allocation.modified_by) : "admin",
            allotted_at: formatDate(allocation.allotted_at) || new Date().toISOString(),
            returned_at: formatDate(allocation.returned_at),
        };

        // If your UI has checkboxes for accessories, they will be included in '...allocation'
        console.log("Sending Allocation to Backend:", payload);

        const response = await fetch(`${API_BASE_URL}/allocations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `Error: ${response.status}`);
        }

        return await response.json();
    } catch (err) {
        console.error("Create Allocation Error:", err);
        throw err;
    }
}

export async function updateAllocation(id: number, allocation: Partial<Allocation>) {
    try {
        const formatDate = (date: any) => {
            if (!date) return null;
            if (date instanceof Date) return date.toISOString();
            return date;
        };

        const payload = {
            ...allocation,
            allotted_at: formatDate(allocation.allotted_at),
            returned_at: formatDate(allocation.returned_at),
        };

        const response = await fetch(`${API_BASE_URL}/allocations/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            let errorMessage = errorData.detail || `Failed to update allocation: ${response.status}`;
            if (typeof errorMessage === 'object') {
                errorMessage = JSON.stringify(errorMessage, null, 2);
            }
            throw new Error(errorMessage);
        }

        return await response.json();
    } catch (err) {
        console.error("Update Allocation Error:", err);
        throw err;
    }
}

export async function deleteAllocation(id: number) {
    try {
        const response = await fetch(`${API_BASE_URL}/allocations/${id}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            let errorMessage = errorData.detail || `Failed to delete allocation: ${response.status}`;
            if (typeof errorMessage === 'object') {
                errorMessage = JSON.stringify(errorMessage, null, 2);
            }
            throw new Error(errorMessage);
        }

        return true;
    } catch (err) {
        console.error("Delete Allocation Error:", err);
        throw err;
    }
}
export async function getAssetHistory(assetId: number): Promise<Allocation[]> {
    try {
        const response = await fetch(`${API_BASE_URL}/allocations/asset/${assetId}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            cache: 'no-store'
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch asset history: ${response.status} ${response.statusText}`);
        }

        return await response.json();
    } catch (err) {
        console.error("Asset History Service Error:", err);
        throw err;
    }
}

export async function getAllocationById(id: number): Promise<Allocation> {
    const response = await fetch(`${API_BASE_URL}/allocations/${id}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store'
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch allocation: ${response.status}`);
    }

    return await response.json();
}
