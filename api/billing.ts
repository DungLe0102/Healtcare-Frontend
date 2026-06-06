import api from './auth';

// Interfaces for Billing
export interface BillingCreate {
  appointment_id: string;
  total_amount: number;
  bhyt_covered_amount: number;
  patient_paid_amount: number;
}

export interface BillingResponse {
  billing_id: string;
  appointment_id: string;
  total_amount: number;
  bhyt_covered_amount: number;
  patient_paid_amount: number;
  billing_status: string;
  refund_bank_code?: string;
  refund_account_no?: string;
  refund_account_name?: string;
  refund_reason?: string;
  patient_name?: string;
  doctor_name?: string;
  created_at: string;
  updated_at: string;
  transactions?: PaymentResponse[];
}

// Interfaces for Payments
export interface PaymentCreate {
  billing_id: string;
  payment_method: string;
  amount: number;
}

export interface PaymentStatusUpdate {
  transaction_status: 'SUCCESS' | 'FAILED';
}

export interface PaymentResponse {
  transaction_id: string;
  billing_id: string;
  payment_method: string;
  amount: number;
  transaction_status: string;
  reference_number?: string;
  created_at: string;
}

// Interfaces for Payouts
export interface DoctorEarningsCalculate {
  doctor_id: string;
  period_start: string;
  period_end: string;
}

export interface DoctorEarningsResponse {
  doctor_id: string;
  period_start: string;
  period_end: string;
  total_completed_appointments: number;
  total_earnings: number;
}

export interface DoctorPayoutCreate {
  doctor_id: string;
  amount: number;
  payout_date: string;
  period_start: string;
  period_end: string;
  notes?: string;
}

export interface DoctorPayoutRead {
  payout_id: string;
  doctor_id: string;
  amount: number;
  payout_date: string;
  period_start: string;
  period_end: string;
  status: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface DoctorPayoutUpdate {
  status: 'PAID' | 'CANCELLED';
}

export const billingApi = {
  // Billing
  createBilling: async (data: BillingCreate): Promise<BillingResponse> => {
    const response = await api.post('/api/v1/billing', data);
    return response.data;
  },

  getBilling: async (billingId: string): Promise<BillingResponse> => {
    const response = await api.get(`/api/v1/billing/${billingId}`);
    return response.data;
  },

  getMyInvoices: async (): Promise<BillingResponse[]> => {
    const response = await api.get('/api/v1/patients/me/invoices');
    return response.data;
  },

  getBillingByAppointment: async (appointmentId: string): Promise<BillingResponse> => {
    const response = await api.get(`/api/v1/appointments/${appointmentId}/billing`);
    return response.data;
  },

  listBillings: async (params?: {
    status?: string;
    patient_name?: string;
    doctor_name?: string;
    start_date?: string;
    end_date?: string;
    skip?: number;
    limit?: number;
  }): Promise<BillingResponse[]> => {
    const response = await api.get('/api/v1/billing', { params });
    return response.data;
  },

  // Manual Payments (Admin)
  createPayment: async (data: PaymentCreate): Promise<PaymentResponse> => {
    const response = await api.post('/api/v1/payments', data);
    return response.data;
  },

  updatePaymentStatus: async (transactionId: string, data: PaymentStatusUpdate): Promise<PaymentResponse> => {
    const response = await api.patch(`/api/v1/payments/${transactionId}/status`, data);
    return response.data;
  },

  refundVietQR: async (
    transactionId: string, 
    amount: number, 
    content: string,
    targetBankCode: string,
    targetAccountNo: string,
    targetAccountName?: string
  ): Promise<any> => {
    const response = await api.post('/api/v1/payments/vietqr-refund', {
      transaction_id: transactionId,
      amount,
      content,
      target_bank_code: targetBankCode,
      target_account_no: targetAccountNo,
      target_account_name: targetAccountName,
    });
    return response.data;
  },

  // Doctor Payouts
  calculateDoctorEarnings: async (data: DoctorEarningsCalculate): Promise<DoctorEarningsResponse> => {
    const response = await api.post('/api/v1/doctor-payouts/calculate-earnings', data);
    return response.data;
  },

  createDoctorPayout: async (data: DoctorPayoutCreate): Promise<DoctorPayoutRead> => {
    const response = await api.post('/api/v1/doctor-payouts', data);
    return response.data;
  },

  getDoctorPayouts: async (doctorId?: string, status?: string): Promise<DoctorPayoutRead[]> => {
    let url = '/api/v1/doctor-payouts?';
    if (doctorId) url += `doctor_id=${doctorId}&`;
    if (status) url += `status=${status}`;
    const response = await api.get(url);
    return response.data;
  },

  updatePayoutStatus: async (payoutId: string, data: DoctorPayoutUpdate): Promise<DoctorPayoutRead> => {
    const response = await api.patch(`/api/v1/doctor-payouts/${payoutId}`, data);
    return response.data;
  },
};
