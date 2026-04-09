import { Asset } from '@/models/asset';

import { API_BASE_URL } from './apiConfig';

export interface PaginatedAssetResponse {
    data: Asset[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
}

/**
 * Fetch assets from the backend with pagination support.
 */
export default async function getAllAssets(
    page: number = 1,
    pageSize: number = 20,
    sort_by: string = 'id',
    order: string = 'asc',
    search: string = '',
    asset_type: string = 'All'
): Promise<PaginatedAssetResponse> {
    try {
        const response = await fetch(`${API_BASE_URL}/asset_page?page=${page}&page_size=${pageSize}&sort_by=${sort_by}&order=${order}&search=${encodeURIComponent(search)}&asset_type=${encodeURIComponent(asset_type)}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            cache: 'no-store'
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch assets: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log("Assets API Response:", data);

        // Ensure we return the standardized paginated response
        if (data && Array.isArray(data.data)) {
            return data;
        } else if (Array.isArray(data)) {
            // Fallback for non-paginated arrays (if any)
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
        console.error("Asset Service Error:", err);
        throw err;
    }
}

/**
 * Fetch a flat list of assets (non-paginated as per backend /asset endpoint).
 */
export async function getAssetsList(limit: number = 100): Promise<Asset[]> {
    try {
        const response = await fetch(`${API_BASE_URL}/asset?limit=${limit}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            cache: 'no-store'
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch assets list: ${response.status}`);
        }

        return await response.json();
    } catch (err) {
        console.error("Asset List Service Error:", err);
        throw err;
    }
}

export async function getAssetById(id: number): Promise<Asset> {
    const response = await fetch(`${API_BASE_URL}/assets/${id}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store'
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch asset: ${response.status}`);
    }

    return await response.json();
}

export async function createAsset(asset: Partial<Asset>) {
    try {
        const formatDate = (date: any) => {
            if (!date) return null;
            if (date instanceof Date) return date.toISOString().split('T')[0];
            if (typeof date === 'string' && date.includes('T')) return date.split('T')[0];
            return date;
        };

        const payload = {
            ...asset,
            purchase_date: formatDate(asset.purchase_date),
            warranty_start_date: formatDate(asset.warranty_start_date),
            warranty_end_date: formatDate(asset.warranty_end_date),
            last_issued: asset.last_issued ? new Date(asset.last_issued).toISOString() : null,
            created_at: new Date().toISOString(),
            modified_at: new Date().toISOString()
        };

        const response = await fetch(`${API_BASE_URL}/assets`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            let errorMessage = errorData.detail || `Failed to create asset: ${response.status}`;
            if (typeof errorMessage === 'object') errorMessage = JSON.stringify(errorMessage, null, 2);
            throw new Error(errorMessage);
        }

        return await response.json();
    } catch (err) {
        console.error("Create Asset Error:", err);
        throw err;
    }
}

export async function updateAsset(id: number, asset: Partial<Asset>) {
    try {
        const formatDate = (date: any) => {
            if (!date) return null;
            if (date instanceof Date) return date.toISOString().split('T')[0];
            if (typeof date === 'string' && date.includes('T')) return date.split('T')[0];
            return date;
        };

        const payload = {
            ...asset,
            purchase_date: formatDate(asset.purchase_date),
            warranty_start_date: formatDate(asset.warranty_start_date),
            warranty_end_date: formatDate(asset.warranty_end_date),
            last_issued: asset.last_issued ? new Date(asset.last_issued).toISOString() : null,
            modified_at: new Date().toISOString()
        };

        const response = await fetch(`${API_BASE_URL}/assets/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            let errorMessage = errorData.detail || `Failed to update asset: ${response.status}`;
            if (typeof errorMessage === 'object') errorMessage = JSON.stringify(errorMessage, null, 2);
            throw new Error(errorMessage);
        }

        return await response.json();
    } catch (err) {
        console.error("Update Asset Error:", err);
        throw err;
    }
}

export async function deleteAsset(id: number) {
    try {
        const response = await fetch(`${API_BASE_URL}/assets/${id}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            let errorMessage = errorData.detail || `Failed to delete asset: ${response.status}`;
            if (typeof errorMessage === 'object') errorMessage = JSON.stringify(errorMessage, null, 2);
            throw new Error(errorMessage);
        }

        return true;
    } catch (err) {
        console.error("Delete Asset Error:", err);
        throw err;
    }
}

export interface AssetSummary {
    category: string;
    in_stock: number;
    allocated: number;
    retired: number;
    total: number;
    consumption: number;
}

/**
 * Fetch asset summary by category and status.
 */
export async function getAssetSummary(): Promise<AssetSummary[]> {
    try {
        const response = await fetch(`${API_BASE_URL}/assets/summary`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            cache: 'no-store'
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch asset summary: ${response.status}`);
        }

        return await response.json();
    } catch (err) {
        console.error("Asset Summary Service Error:", err);
        throw err;
    }
}

export async function uploadAssetsCSV(file: File) {
    try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${API_BASE_URL}/upload_assets_csv`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || 'Failed to upload assets CSV');
        }

        return await response.json();
    } catch (err) {
        console.error("Upload Assets CSV Error:", err);
        throw err;
    }
}
