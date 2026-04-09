export interface Asset {
    id: number;
    assetno: number;
    asset_type: string;
    serial_num: string;
    host_name?: string | null;
    make?: string | null;
    model?: string | null;
    lifecycle_status: string;
    purchase_date: string;
    warranty_start_date?: string | null;
    warranty_end_date?: string | null;
    last_issued?: string | null;
    u_uid: string;
    mac_id?: string | null;
    company_name?: string | null;
    location?: string | null;
    created_at: string;
    created_by: string | null;
    modified_at: string;
    modified_by: string | null;
    remarks?: string | null;
    is_allocated: boolean;
    is_deleted: boolean;
    staging_status?: string | null;
    status?: string | null;
    cost_center?: string;
    physical_present?: string;
    legal_entities?: string;
}

