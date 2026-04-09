export interface Allocation {
    id: number;
    employee_id: number;
    asset_id: number;
    emp_no?: string;
    employee_name?: string;
    host_name?: string;
    asset_type?: string;
    allotted_at: string | Date;
    returned_at?: string | Date | null;
    remarks?: string | null;
    created_at: string | Date;
    created_by?: string | null;
    modified_at: string | Date;
    modified_by?: string | null;
}
