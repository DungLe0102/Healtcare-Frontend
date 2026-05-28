import api from './auth';

export interface Notification {
  notification_id: string;
  recipient_id: string;
  recipient_type: 'PATIENT' | 'DOCTOR' | 'ADMIN';
  notification_type: string;
  channel: 'EMAIL' | 'SMS' | 'PUSH';
  title?: string;
  content?: string;
  status: 'PENDING' | 'SENT' | 'FAILED';
  retry_count: number;
  sent_at?: string;
  created_at: string;
}

export interface NotificationCreate {
  recipient_id: string;
  recipient_type: 'PATIENT' | 'DOCTOR' | 'ADMIN';
  notification_type: string;
  channel: 'EMAIL' | 'SMS' | 'PUSH';
  title?: string;
  content?: string;
}

export interface SupportRequest {
  request_id: string;
  patient_id: string;
  request_type: string;
  title: string;
  content?: string;
  assigned_to?: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  resolved_at?: string;
  created_at: string;
}

export interface SupportRequestUpdate {
  assigned_to?: string;
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  status?: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  response_note?: string;
}

export const notificationApi = {
  listNotifications: async (
    recipientId?: string,
    statusFilter?: string,
    skip: number = 0,
    limit: number = 50
  ): Promise<Notification[]> => {
    const params: any = { skip, limit };
    if (recipientId) params.recipient_id = recipientId;
    if (statusFilter) params.status_filter = statusFilter;
    const response = await api.get('/api/v1/notifications', { params });
    return response.data;
  },

  createNotification: async (data: NotificationCreate): Promise<Notification> => {
    const response = await api.post('/api/v1/notifications', data);
    return response.data;
  },

  markNotificationSent: async (notificationId: string): Promise<Notification> => {
    const response = await api.patch(`/api/v1/notifications/${notificationId}/sent`);
    return response.data;
  },

  markNotificationFailed: async (notificationId: string): Promise<Notification> => {
    const response = await api.patch(`/api/v1/notifications/${notificationId}/failed`);
    return response.data;
  },

  triggerBhytExpiryAlerts: async (daysBefore: number = 30): Promise<{ detail: string }> => {
    const response = await api.post('/api/v1/notifications/cron/bhyt-expiry', null, {
      params: { days_before: daysBefore }
    });
    return response.data;
  },

  listSupportRequests: async (
    statusFilter?: string,
    skip: number = 0,
    limit: number = 50
  ): Promise<SupportRequest[]> => {
    const params: any = { skip, limit };
    if (statusFilter) params.status = statusFilter; // Assuming param is 'status' or 'status_filter', checking router...
    const response = await api.get('/api/v1/support-requests', { params });
    return response.data;
  },

  updateSupportRequest: async (requestId: string, data: SupportRequestUpdate): Promise<SupportRequest> => {
    const response = await api.patch(`/api/v1/support-requests/${requestId}`, data);
    return response.data;
  },

  createSupportRequest: async (data: any): Promise<SupportRequest> => {
    const response = await api.post('/api/v1/support-requests', data);
    return response.data;
  },
};
