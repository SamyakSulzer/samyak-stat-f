export interface SysUser {
    id: number;
    username: string;
    pass: string;
    user_emp_id: number;
    user_emp_name: string;
    user_role: 'administrator' | 'viewer' | 'master manager';
}

export type UserRole = 'administrator' | 'viewer' | 'master manager';
