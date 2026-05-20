import api from './auth';

export interface Department {
  department_id: string;
  department_code: string;
  department_name: string;
  is_active: boolean;
}

export const departmentApi = {
  getDepartments: async (activeOnly: boolean = false, search?: string): Promise<Department[]> => {
    const params: any = { active_only: activeOnly };
    if (search) {
      params.search = search;
    }
    const response = await api.get('/api/v1/departments', { params });
    return response.data;
  },

  initStandardDepartments: async (hospitalClass: string): Promise<Department[]> => {
    const response = await api.post(`/api/v1/departments/init-standard/${hospitalClass.toUpperCase()}`);
    return response.data;
  },

  getDepartmentDetails: async (departmentId: string): Promise<any> => {
    const response = await api.get(`/api/v1/departments/${departmentId}`);
    return response.data;
  },

  updateDepartment: async (departmentId: string, data: { department_name: string }): Promise<Department> => {
    const response = await api.patch(`/api/v1/departments/${departmentId}`, data);
    return response.data;
  },

  deactivateDepartment: async (departmentId: string): Promise<Department> => {
    const response = await api.delete(`/api/v1/departments/${departmentId}`);
    return response.data;
  },

  reactivateDepartment: async (departmentId: string): Promise<Department> => {
    const response = await api.patch(`/api/v1/departments/${departmentId}/reactivate`);
    return response.data;
  },

  // --- ROOM ENDPOINTS ---
  getRoomsByDepartment: async (departmentId: string, activeOnly: boolean = false): Promise<any[]> => {
    const params = activeOnly ? { active_only: true } : {};
    const response = await api.get(`/api/v1/departments/${departmentId}/rooms`, { params });
    return response.data;
  },

  getRoomDetails: async (roomId: string): Promise<any> => {
    const response = await api.get(`/api/v1/rooms/${roomId}`);
    return response.data;
  },

  createRoom: async (departmentId: string, data: { room_number: string; room_type: string }): Promise<any> => {
    const response = await api.post(`/api/v1/departments/${departmentId}/rooms`, data);
    return response.data;
  },

  updateRoom: async (roomId: string, data: { room_number?: string; room_type?: string }): Promise<any> => {
    const response = await api.patch(`/api/v1/rooms/${roomId}`, data);
    return response.data;
  },

  deactivateRoom: async (roomId: string): Promise<any> => {
    const response = await api.delete(`/api/v1/rooms/${roomId}`);
    return response.data;
  },

  reactivateRoom: async (roomId: string): Promise<any> => {
    const response = await api.patch(`/api/v1/rooms/${roomId}/reactivate`);
    return response.data;
  },
};
