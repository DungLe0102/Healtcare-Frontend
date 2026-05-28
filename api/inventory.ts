import api from './auth';

export interface Medication {
  medication_id: string;
  med_code: string;
  med_name: string;
  active_ingredient?: string;
  unit: string;
  price: number;
  is_bhyt_covered: boolean;
  is_active: boolean;
}

export interface MedicationCreate {
  med_code: string;
  med_name: string;
  active_ingredient?: string;
  unit: string;
  price: number;
  is_bhyt_covered?: boolean;
}

export interface MedicationUpdate {
  med_name?: string;
  active_ingredient?: string;
  unit?: string;
  price?: number;
  is_bhyt_covered?: boolean;
  is_active?: boolean;
}

export interface InventoryBatch {
  inventory_id: string;
  medication_id: string;
  batch_number: string;
  quantity: number;
  expiration_date: string;
  updated_at: string;
}

export interface InventoryCreate {
  medication_id: string;
  batch_number: string;
  quantity: number;
  expiration_date: string;
}

export const inventoryApi = {
  listMedications: async (activeOnly: boolean = false): Promise<Medication[]> => {
    const response = await api.get('/api/v1/medications', {
      params: { active_only: activeOnly },
    });
    return response.data;
  },

  createMedication: async (data: MedicationCreate): Promise<Medication> => {
    const response = await api.post('/api/v1/medications', data);
    return response.data;
  },

  updateMedication: async (medicationId: string, data: MedicationUpdate): Promise<Medication> => {
    const response = await api.patch(`/api/v1/medications/${medicationId}`, data);
    return response.data;
  },

  deactivateMedication: async (medicationId: string): Promise<Medication> => {
    const response = await api.delete(`/api/v1/medications/${medicationId}`);
    return response.data;
  },

  reactivateMedication: async (medicationId: string): Promise<Medication> => {
    const response = await api.patch(`/api/v1/medications/${medicationId}/reactivate`);
    return response.data;
  },

  listInventory: async (medicationId?: string): Promise<InventoryBatch[]> => {
    const params: any = {};
    if (medicationId) params.medication_id = medicationId;
    const response = await api.get('/api/v1/inventory', { params });
    return response.data;
  },

  getExpiringSoon: async (days: number = 30): Promise<InventoryBatch[]> => {
    const response = await api.get('/api/v1/inventory/expiring', { params: { days } });
    return response.data;
  },

  getStockTotal: async (medicationId: string): Promise<{ medication_id: string, total_stock: number }> => {
    const response = await api.get(`/api/v1/medications/${medicationId}/stock`);
    return response.data;
  },

  addInventoryBatch: async (data: InventoryCreate): Promise<InventoryBatch> => {
    const response = await api.post('/api/v1/inventory', data);
    return response.data;
  },
};
