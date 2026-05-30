import api from './auth';

export interface MedicalRecord {
  record_id: string;
  appointment_id: string;
  diagnosis: string;
  symptoms: string;
  treatment_plan: string;
  icd10_code?: string;
  is_signed: boolean;
  signed_at?: string;
  created_at: string;
  updated_at: string;
  // May include other nested fields like services, prescriptions, appointment
  appointment?: any;
  services?: any[];
  prescriptions?: any[];
}

export interface MedicalRecordCreate {
  appointment_id: string;
  doctor_id: string;
  diagnosis: string;
  icd10_code?: string;
  symptoms?: string;
  treatment_plan?: string;
}

export interface MedicalRecordUpdate {
  diagnosis?: string;
  icd10_code?: string;
  symptoms?: string;
  treatment_plan?: string;
}

export interface SignRecordRequest {
  doctor_secret: string;
  ma_lk?: string;
}

export const medicalRecordApi = {
  getRecord: async (recordId: string): Promise<MedicalRecord> => {
    const response = await api.get(`/api/v1/medical-records/${recordId}`);
    return response.data;
  },

  getRecordByAppointment: async (appointmentId: string): Promise<MedicalRecord> => {
    const response = await api.get(`/api/v1/appointments/${appointmentId}/medical-record`);
    return response.data;
  },

  getRecordsByPatient: async (patientId: string): Promise<MedicalRecord[]> => {
    const response = await api.get(`/api/v1/patients/${patientId}/medical-records`);
    return response.data;
  },

  createRecord: async (data: MedicalRecordCreate): Promise<MedicalRecord> => {
    const response = await api.post('/api/v1/medical-records', data);
    return response.data;
  },

  updateRecord: async (recordId: string, data: MedicalRecordUpdate): Promise<MedicalRecord> => {
    const response = await api.patch(`/api/v1/medical-records/${recordId}`, data);
    return response.data;
  },

  signRecord: async (recordId: string, data: SignRecordRequest): Promise<MedicalRecord> => {
    const response = await api.patch(`/api/v1/medical-records/${recordId}/sign`, data);
    return response.data;
  },
};
