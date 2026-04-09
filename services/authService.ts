import { SysUser } from '@/models/sys_user';

import { API_BASE_URL } from './apiConfig';

export interface LoginResponse {
    access_token: string;
    token_type: string;
    user_id: number;
    username: string;
    role: string;
    emp_name: string;
}

export async function login(username: string, pass: string): Promise<LoginResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, pass })
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Login failed');
    }

    return await response.json();
}

export async function register(userData: Partial<SysUser>): Promise<SysUser> {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Registration failed');
    }

    return await response.json();
}
