import api from './auth';

export interface RevenueSummary {
  total_revenue: number;
  total_appointments_revenue: number;
  total_pharmacy_revenue: number;
  total_bhyt_extension_revenue: number;
  period_start: string;
  period_end: string;
}

export interface DoctorRevenueItem {
  doctor_id: string;
  doctor_name: string;
  specialization?: string;
  completed_appointments: number;
  total_earnings: number;
}

export interface DoctorRevenueResponse {
  period_start: string;
  period_end: string;
  doctors: DoctorRevenueItem[];
}

export interface MedicationRevenueItem {
  medication_id: string;
  medication_name: string;
  quantity_sold: number;
  total_revenue: number;
}

export interface MedicationRevenueResponse {
  period_start: string;
  period_end: string;
  medications: MedicationRevenueItem[];
}

export interface PatientFinancialSummary {
  patient_id: string;
  patient_name: string;
  total_paid: number;
  total_refunded: number;
  pending_amount: number;
}

export const reportApi = {
  getRevenueSummary: async (startDate: string, endDate: string): Promise<RevenueSummary> => {
    const response = await api.get('/api/v1/api/v1/reports/revenue/summary', {
      params: { start_date: startDate, end_date: endDate },
    });
    return response.data;
  },

  getDoctorRevenue: async (startDate: string, endDate: string): Promise<DoctorRevenueResponse> => {
    const response = await api.get('/api/v1/api/v1/reports/revenue/doctors', {
      params: { start_date: startDate, end_date: endDate },
    });
    return response.data;
  },

  getMedicationRevenue: async (startDate: string, endDate: string): Promise<MedicationRevenueResponse> => {
    const response = await api.get('/api/v1/api/v1/reports/revenue/medications', {
      params: { start_date: startDate, end_date: endDate },
    });
    return response.data;
  },

  getPatientFinancials: async (patientId: string): Promise<PatientFinancialSummary> => {
    const response = await api.get(`/api/v1/api/v1/reports/financials/patients/${patientId}`);
    return response.data;
  },
};
