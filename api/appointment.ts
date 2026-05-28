import api from './auth';

export interface AppointmentCreate {
  patient_id: string;
  schedule_id: string;
  symptoms?: string;
  applied_bhyt_id?: string;
}

export interface Appointment {
  appointment_id: string;
  patient_id: string;
  schedule_id: string;
  doctor_id: string;
  room_id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: string;
  symptoms?: string;
  queue_number?: number;
  is_re_exam: boolean;
  billing_id?: string;
}

export interface AppointmentResponse extends Appointment {
  vietqr_url?: string;
  transaction_id?: string;
}

export const appointmentApi = {
  // 1. Đặt lịch khám
  bookAppointment: async (data: AppointmentCreate): Promise<AppointmentResponse> => {
    const response = await api.post('/api/v1/appointments', data);
    return response.data;
  },

  // 2. Lấy mã QR
  getVietQR: async (billingId: string): Promise<any> => {
    const response = await api.post(`/api/v1/billing/${billingId}/vietqr`);
    return response.data;
  },

  // 3. Giả lập thanh toán (webhook)
  simulatePayment: async (transactionId: string, amount: number): Promise<any> => {
    // Phải match với payload mong đợi của webhook
    const payload = {
      error: 0,
      data: [
        {
          curency: "VND",
          amount: amount,
          description: `PAY ${transactionId}`,
        }
      ]
    };
    const response = await api.post('/api/v1/billing/vietqr-webhook', payload);
    return response.data;
  },

  // 4. Xem chi tiết
  getAppointment: async (appointmentId: string): Promise<any> => {
    const response = await api.get(`/api/v1/appointments/${appointmentId}`);
    return response.data;
  },

  // 5. Danh sách của bệnh nhân
  getPatientAppointments: async (patientId: string, statusFilter?: string): Promise<any> => {
    const params: any = {};
    if (statusFilter) params.status_filter = statusFilter;
    const response = await api.get(`/api/v1/patients/${patientId}/appointments`, { params });
    return response.data;
  },
  
  // 6. Admin đổi trạng thái
  updateStatus: async (appointmentId: string, status: string): Promise<Appointment> => {
    const response = await api.patch(`/api/v1/appointments/${appointmentId}/status`, { status });
    return response.data;
  },

  // 7. Admin: Lấy danh sách cuộc hẹn hôm nay
  getTodayAppointments: async (doctorId?: string): Promise<any> => {
    const params: any = {};
    if (doctorId) params.doctor_id = doctorId;
    const response = await api.get('/api/v1/appointments/today', { params });
    return response.data;
  },

  // 8. Admin: Lấy danh sách cuộc hẹn của bác sĩ
  getDoctorAppointments: async (doctorId: string, dateFilter?: string, statusFilter?: string): Promise<any> => {
    const params: any = {};
    if (dateFilter) params.date_filter = dateFilter;
    if (statusFilter) params.status_filter = statusFilter;
    const response = await api.get(`/api/v1/doctors/${doctorId}/appointments`, { params });
    return response.data;
  },

  // 9. Admin: Dọn dẹp lịch quá hạn (mark-no-shows)
  markNoShows: async (): Promise<any> => {
    const response = await api.post('/api/v1/appointments/mark-no-shows');
    return response.data;
  }
};
