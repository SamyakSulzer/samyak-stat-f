import { MasterKey, MasterValue, PaginatedMasterKeyResponse, PaginatedMasterValueResponse } from '@/models/master';

import { API_BASE_URL as BASE } from './apiConfig';
const API_BASE_URL = `${BASE}/master`;

// --- Master Key Services ---

export async function getMasterKeys(page: number = 1, pageSize: number = 20): Promise<PaginatedMasterKeyResponse> {
    const response = await fetch(`${API_BASE_URL}/keys?page=${page}&page_size=${pageSize}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store'
    });
    if (!response.ok) throw new Error(`Failed to fetch master keys: ${response.status}`);
    return await response.json();
}

export async function getValuesByKeyName(keyName: string): Promise<string[]> {
    // 1. Get all keys to find the ID
    const keysResponse = await getMasterKeys(1, 100);
    const key = keysResponse.data.find(k => k.key_name === keyName);

    if (!key) {
        console.warn(`Master Key ${keyName} not found`);
        return [];
    }

    // 2. Get values for this key
    const valuesResponse = await getMasterValues(key.id, 1, 100);
    // Flatten the values (since each value is array of strings in your model)
    return valuesResponse.data
        .filter(v => v.is_active)
        .sort((a, b) => (a.order_id || 0) - (b.order_id || 0))
        .flatMap(v => v.value);
}

export async function createMasterKey(data: Partial<MasterKey>): Promise<MasterKey> {
    const response = await fetch(`${API_BASE_URL}/keys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Failed to create master key');
    }
    return await response.json();
}

export async function updateMasterKey(id: number, data: Partial<MasterKey>): Promise<MasterKey> {
    const response = await fetch(`${API_BASE_URL}/keys/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Failed to update master key');
    }
    return await response.json();
}

export async function deleteMasterKey(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/keys/${id}`, {
        method: 'DELETE'
    });
    if (!response.ok) throw new Error(`Failed to delete master key: ${response.status}`);
}

// --- Master Value Services ---

export async function getMasterValues(keyId?: number, page: number = 1, pageSize: number = 100): Promise<PaginatedMasterValueResponse> {
    const url = new URL(`${API_BASE_URL}/values`);
    url.searchParams.append('page', page.toString());
    url.searchParams.append('page_size', pageSize.toString());
    if (keyId) url.searchParams.append('key_id', keyId.toString());

    const response = await fetch(url.toString(), {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store'
    });
    if (!response.ok) throw new Error(`Failed to fetch master values: ${response.status}`);
    return await response.json();
}

export async function createMasterValue(data: Partial<MasterValue>): Promise<MasterValue> {
    const response = await fetch(`${API_BASE_URL}/values`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Failed to create master value');
    }
    return await response.json();
}

export async function updateMasterValue(id: number, data: Partial<MasterValue>): Promise<MasterValue> {
    const response = await fetch(`${API_BASE_URL}/values/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Failed to update master value');
    }
    return await response.json();
}

export async function deleteMasterValue(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/values/${id}`, {
        method: 'DELETE'
    });
    if (!response.ok) throw new Error(`Failed to delete master value: ${response.status}`);
}
