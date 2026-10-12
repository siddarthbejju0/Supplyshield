import {
  HealthResponse,
  OverviewResponse,
  InventoryItem,
  InventorySummary,
  SupplierItem,
  SimulationRequest,
  SimulationResponse,
  MitigationRequest,
  MitigationComparisonResponse,
  DataExplorerResponse
} from '../types';

const DIRECT_BACKEND = 'http://127.0.0.1:8000/api';
const PROXY_BACKEND = import.meta.env.VITE_API_BASE_URL || '/api';

async function fetchApi(endpoint: string, options?: RequestInit): Promise<Response> {
  // If proxy backend is absolute URL, use directly
  if (PROXY_BACKEND.startsWith('http')) {
    return fetch(`${PROXY_BACKEND}${endpoint}`, options);
  }

  // Resilient dual-path: try proxy first; if 404/5xx, fallback to direct 127.0.0.1:8000
  try {
    const res = await fetch(`${PROXY_BACKEND}${endpoint}`, options);
    if (res.ok) return res;
    if (res.status === 404 || res.status >= 500) {
      try {
        const directRes = await fetch(`${DIRECT_BACKEND}${endpoint}`, options);
        return directRes;
      } catch {
        return res;
      }
    }
    return res;
  } catch {
    return fetch(`${DIRECT_BACKEND}${endpoint}`, options);
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorMsg = `HTTP Error ${res.status}: ${res.statusText}`;
    try {
      const errorData = await res.json();
      if (errorData.detail) {
        errorMsg = typeof errorData.detail === 'string' ? errorData.detail : JSON.stringify(errorData.detail);
      }
    } catch {
      // ignore json parse error
    }
    throw new Error(errorMsg);
  }
  return res.json() as Promise<T>;
}

export const api = {
  getHealth: (): Promise<HealthResponse> =>
    fetchApi('/health').then((res) => handleResponse<HealthResponse>(res)),

  getOverview: (): Promise<OverviewResponse> =>
    fetchApi('/overview').then((res) => handleResponse<OverviewResponse>(res)),

  getInventory: (params?: {
    category?: string;
    risk_level?: string;
    supplier_id?: string;
    search?: string;
  }): Promise<{ items: InventoryItem[]; summary: InventorySummary }> => {
    const query = new URLSearchParams();
    if (params?.category) query.append('category', params.category);
    if (params?.risk_level) query.append('risk_level', params.risk_level);
    if (params?.supplier_id) query.append('supplier_id', params.supplier_id);
    if (params?.search) query.append('search', params.search);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return fetchApi(`/inventory${qs}`).then((res) =>
      handleResponse<{ items: InventoryItem[]; summary: InventorySummary }>(res)
    );
  },

  getInventoryCategories: (): Promise<string[]> =>
    fetchApi('/inventory/categories').then((res) => handleResponse<string[]>(res)),

  getProductDetail: (productId: string): Promise<InventoryItem> =>
    fetchApi(`/inventory/${productId}`).then((res) => handleResponse<InventoryItem>(res)),

  getProductDemandHistory: (productId: string): Promise<Array<{ date: string; units_sold: number; demand_forecast_units: number }>> =>
    fetchApi(`/inventory/${productId}/demand-history`).then((res) =>
      handleResponse<Array<{ date: string; units_sold: number; demand_forecast_units: number }>>(res)
    ),

  getSuppliers: (): Promise<SupplierItem[]> =>
    fetchApi('/suppliers').then((res) => handleResponse<SupplierItem[]>(res)),

  getSupplierDetail: (supplierId: string): Promise<{
    supplier: SupplierItem;
    purchase_orders: any[];
    products: any[];
  }> =>
    fetchApi(`/suppliers/${supplierId}`).then((res) =>
      handleResponse<{
        supplier: SupplierItem;
        purchase_orders: any[];
        products: any[];
      }>(res)
    ),

  runSimulation: (req: SimulationRequest): Promise<SimulationResponse> =>
    fetchApi('/simulation/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    }).then((res) => handleResponse<SimulationResponse>(res)),

  compareMitigation: (req: MitigationRequest): Promise<MitigationComparisonResponse> =>
    fetchApi('/mitigation/compare', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    }).then((res) => handleResponse<MitigationComparisonResponse>(res)),

  getDataQuality: (): Promise<DataExplorerResponse> =>
    fetchApi('/data-explorer/quality').then((res) => handleResponse<DataExplorerResponse>(res)),

  getCompanyInfo: (): Promise<{
    company_name: string;
    is_custom_data: boolean;
    suppliers_count: number;
    inventory_count: number;
    purchase_orders_count: number;
    demand_history_count: number;
    sourcing_options_count: number;
  }> =>
    fetchApi('/data-explorer/company-info').then((res) =>
      handleResponse<any>(res)
    ),

  uploadDataset: (fileType: string, file: File, companyName?: string): Promise<any> => {
    const formData = new FormData();
    formData.append('file_type', fileType);
    if (companyName) formData.append('company_name', companyName);
    formData.append('file', file);
    return fetchApi('/data-explorer/upload', {
      method: 'POST',
      body: formData,
    }).then((res) => handleResponse<any>(res));
  },

  resetDemoData: (): Promise<any> =>
    fetchApi('/data-explorer/reset-demo', {
      method: 'POST',
    }).then((res) => handleResponse<any>(res)),

  loadSampleData: (): Promise<any> =>
    fetchApi('/data-explorer/load-sample', {
      method: 'POST',
    }).then((res) => handleResponse<any>(res)),

  clearWorkspace: (companyName?: string): Promise<any> =>
    fetchApi(`/data-explorer/clear${companyName ? `?company_name=${encodeURIComponent(companyName)}` : ''}`, {
      method: 'POST',
    }).then((res) => handleResponse<any>(res)),

  getMethodology: (): Promise<any> =>
    fetchApi('/methodology').then((res) => handleResponse<any>(res)),
};
