export interface Employee {
    id: number;
    emp_no: string;
    cn1?: string;
    email?: string;
    sam_name?: string;
    division?: string;
    business_unit?: string;
    cost_center?: string;
    cost_center_description?: string;
    physical_present?: boolean;
    legal_entities?: string;
    location?: string;
    joining_date?: string; // ISO string
    last_working_date?: string; // ISO string
    created_at?: string;
    created_by?: string;
    modified_at?: string;
    modified_by?: string;
    is_active?: boolean;
}
