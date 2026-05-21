import api from './auth';

export interface PatientCreate {
  first_name: string;
  last_name: string;
  dob: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  phone?: string;
  address?: string;
  cccd?: string;
  avatar_url?: string;
  blood_type?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  allergies?: string;
  medical_history?: string;
}

export interface PatientProfileResponse extends PatientCreate {
  patient_id: string;
  created_at: string;
}

export interface PatientResponse extends PatientProfileResponse {}

export interface BHYTRecord {
  bhyt_id: string;
  patient_id: string;
  bhyt_code: string;
  registered_hospital_code?: string;
  valid_from: string;
  valid_to: string;
  is_active?: boolean;
  check_status?: string;
  created_at?: string;
}

export interface BHYTCreate {
  patient_id: string;
  bhyt_code: string;
  registered_hospital_code: string;
  valid_from: string;
  valid_to: string;
}

export interface BHYTUpdate {
  valid_from?: string;
  valid_to?: string;
  registered_hospital_code?: string;
}

export interface BHYTVerifyUpdate {
  check_status: 'VERIFIED' | 'PENDING' | 'REJECTED';
}

export interface ConsentCreate {
  patient_id: string;
  consent_type: string;
  is_granted: boolean;
  ip_address?: string;
  user_agent?: string;
}

export interface ConsentResponse {
  consent_id: string;
  patient_id: string;
  consent_type: string;
  is_granted: boolean;
  ip_address?: string;
  timestamp: string;
}

export interface PatientWithBHYT extends PatientResponse {
  bhyt_records?: BHYTRecord[];
}

export const patientApi = {
  createMyProfile: async (data: PatientCreate): Promise<PatientProfileResponse> => {
    const response = await api.post('/api/v1/patients/me/profile', data);
    return response.data;
  },
  
  getMyProfile: async (): Promise<PatientProfileResponse> => {
    const response = await api.get('/api/v1/patients/me/profile');
    return response.data;
  },

  updateMyProfile: async (data: Partial<PatientCreate>): Promise<PatientProfileResponse> => {
    const response = await api.patch('/api/v1/patients/me/profile', data);
    return response.data;
  },

  // --- ADMIN ENDPOINTS ---
  getPatients: async (skip: number = 0, limit: number = 20, search?: string): Promise<PatientResponse[]> => {
    let url = `/api/v1/patients?skip=${skip}&limit=${limit}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    const response = await api.get(url);
    return response.data;
  },

  getPatientById: async (patientId: string): Promise<PatientWithBHYT> => {
    const response = await api.get(`/api/v1/patients/${patientId}`);
    return response.data;
  },

  createPatient: async (data: PatientCreate): Promise<PatientResponse> => {
    const response = await api.post('/api/v1/patients', data);
    return response.data;
  },

  updatePatient: async (patientId: string, data: Partial<PatientCreate>): Promise<PatientResponse> => {
    const response = await api.patch(`/api/v1/patients/${patientId}`, data);
    return response.data;
  },

  deletePatient: async (patientId: string): Promise<any> => {
    const response = await api.delete(`/api/v1/patients/${patientId}`);
    return response.data;
  },

  // --- BHYT ENDPOINTS ---
  getPatientBHYTList: async (patientId: string): Promise<BHYTRecord[]> => {
    const response = await api.get(`/api/v1/patients/${patientId}/bhyt`);
    return response.data;
  },

  getActiveBHYT: async (patientId: string): Promise<BHYTRecord> => {
    const response = await api.get(`/api/v1/patients/${patientId}/bhyt/active`);
    return response.data;
  },

  getLatestBHYT: async (patientId: string): Promise<BHYTRecord> => {
    const response = await api.get(`/api/v1/patients/${patientId}/bhyt/latest`);
    return response.data;
  },

  createBHYT: async (data: BHYTCreate): Promise<BHYTRecord> => {
    const response = await api.post('/api/v1/bhyt', data);
    return response.data;
  },

  updateBHYT: async (bhytId: string, data: BHYTUpdate): Promise<BHYTRecord> => {
    const response = await api.patch(`/api/v1/bhyt/${bhytId}`, data);
    return response.data;
  },

  verifyBHYT: async (bhytId: string, data: BHYTVerifyUpdate): Promise<BHYTRecord> => {
    const response = await api.patch(`/api/v1/bhyt/${bhytId}/verify`, data);
    return response.data;
  },

  // --- CONSENT ENDPOINTS ---
  getPatientConsents: async (patientId: string): Promise<ConsentResponse[]> => {
    const response = await api.get(`/api/v1/patients/${patientId}/consents`);
    return response.data;
  },

  recordConsent: async (data: ConsentCreate): Promise<ConsentResponse> => {
    const response = await api.post('/api/v1/consents', data);
    return response.data;
  }
};
