// Production backend URL (hardcoded as fallback since .env files are gitignored)
const PRODUCTION_API = 'https://samyak-azure-b-dhgwbggvcpfvcxc8.centralindia-01.azurewebsites.net';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_URL || PRODUCTION_API;
