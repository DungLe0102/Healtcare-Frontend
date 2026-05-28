import api from './auth';

export interface ClinicalService {
  service_id: string;
  service_code: string;
  service_name: string;
  price: number;
  is_bhyt_covered: boolean;
  is_active: boolean;
}

export interface ClinicalServiceCreate {
  service_code: string;
  service_name: string;
  price: number;
  is_bhyt_covered: boolean;
}

export interface ClinicalServiceUpdate {
  service_name?: string;
  price?: number;
  is_bhyt_covered?: boolean;
}

export const clinicalServiceApi = {
  listServices: async (
    activeOnly: boolean = true,
    bhytOnly: boolean = false,
    search?: string
  ): Promise<ClinicalService[]> => {
    const params: any = { active_only: activeOnly, bhyt_only: bhytOnly };
    if (search) params.search = search;
    
    const response = await api.get('/api/v1/services', { params });
    return response.data;
  },

  getService: async (serviceId: string): Promise<ClinicalService> => {
    const response = await api.get(`/api/v1/services/${serviceId}`);
    return response.data;
  },

  createService: async (data: ClinicalServiceCreate): Promise<ClinicalService> => {
    const response = await api.post('/api/v1/services', data);
    return response.data;
  },

  updateService: async (serviceId: string, data: ClinicalServiceUpdate): Promise<ClinicalService> => {
    const response = await api.patch(`/api/v1/services/${serviceId}`, data);
    return response.data;
  },

  deactivateService: async (serviceId: string): Promise<ClinicalService> => {
    const response = await api.delete(`/api/v1/services/${serviceId}`);
    return response.data;
  },

  reactivateService: async (serviceId: string): Promise<ClinicalService> => {
    const response = await api.patch(`/api/v1/services/${serviceId}/reactivate`);
    return response.data;
  },
};
