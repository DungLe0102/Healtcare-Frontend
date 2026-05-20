import api from './auth';

export interface Doctor {
  doctor_id: string;
  first_name: string;
  last_name: string;
  specialization: string;
  department_id?: string;
  hourly_consultation_fee: number;
  is_active: boolean;
  is_simulator: boolean;
}

export interface Schedule {
  schedule_id: string;
  doctor_id: string;
  room_id: string;
  start_time: string;
  end_time: string;
  max_patients: number;
  current_booked: number;
  status: string;
}

export const doctorApi = {
  getDoctors: async (
    skip: number = 0,
    limit: number = 20,
    departmentId?: string,
    activeOnly: boolean = false,
    search?: string
  ): Promise<Doctor[]> => {
    const params: any = { skip, limit, active_only: activeOnly };
    if (departmentId) params.department_id = departmentId;
    if (search) params.search = search;
    
    const response = await api.get('/api/v1/doctors', { params });
    return response.data;
  },

  getDoctorDetails: async (doctorId: string): Promise<any> => {
    const response = await api.get(`/api/v1/doctors/${doctorId}`);
    return response.data;
  },

  createDoctor: async (data: any): Promise<Doctor> => {
    const response = await api.post('/api/v1/doctors', data);
    return response.data;
  },

  updateDoctor: async (doctorId: string, data: any): Promise<Doctor> => {
    const response = await api.patch(`/api/v1/doctors/${doctorId}`, data);
    return response.data;
  },

  deactivateDoctor: async (doctorId: string): Promise<Doctor> => {
    const response = await api.delete(`/api/v1/doctors/${doctorId}`);
    return response.data;
  },

  // --- SCHEDULE ENDPOINTS ---

  getSchedules: async (
    doctorId?: string,
    dateFilter?: string,
    availableOnly: boolean = false
  ): Promise<Schedule[]> => {
    const params: any = { available_only: availableOnly };
    if (doctorId) params.doctor_id = doctorId;
    if (dateFilter) params.date_filter = dateFilter;

    const response = await api.get('/api/v1/schedules', { params });
    return response.data;
  },

  getAvailableSlots: async (dateFilter: string, departmentId?: string): Promise<any[]> => {
    const params: any = { date_filter: dateFilter };
    if (departmentId) params.department_id = departmentId;

    const response = await api.get('/api/v1/schedules/available', { params });
    return response.data;
  },

  getScheduleDetails: async (scheduleId: string): Promise<Schedule> => {
    const response = await api.get(`/api/v1/schedules/${scheduleId}`);
    return response.data;
  },

  createSchedule: async (data: any): Promise<Schedule> => {
    const response = await api.post('/api/v1/schedules', data);
    return response.data;
  },

  updateSchedule: async (scheduleId: string, data: any): Promise<Schedule> => {
    const response = await api.patch(`/api/v1/schedules/${scheduleId}`, data);
    return response.data;
  },

  cancelSchedule: async (scheduleId: string): Promise<Schedule> => {
    const response = await api.delete(`/api/v1/schedules/${scheduleId}`);
    return response.data;
  },
};
