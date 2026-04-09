export interface MasterKey {
    id: number;
    key_name: string;
    is_active: boolean;
    is_deleted: boolean;
}

export interface MasterValue {
    id: number;
    key_id: number;
    value: string[];
    append_value?: string;
    remove_value?: string;
    order_id: number | null;
    is_active: boolean;
    is_deleted: boolean;
}

export interface PaginatedMasterKeyResponse {
    data: MasterKey[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
}

export interface PaginatedMasterValueResponse {
    data: MasterValue[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
}
