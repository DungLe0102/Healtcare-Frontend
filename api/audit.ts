import api from './auth';

export interface AuditLog {
  log_id: string;
  actor_id: string;
  actor_role: string;
  action_type: 'CREATE' | 'UPDATE' | 'DELETE' | 'READ';
  target_table: string;
  target_record_id: string;
  ip_address?: string;
  timestamp: string;
}

export interface AuditLogQuery {
  actor_id?: string;
  target_table?: string;
  target_record_id?: string;
  action_type?: string;
  from_dt?: string;
  to_dt?: string;
  skip?: number;
  limit?: number;
}

export const auditApi = {
  listLogs: async (query?: AuditLogQuery): Promise<AuditLog[]> => {
    const response = await api.get('/api/v1/audit-logs', { params: query });
    return response.data;
  },

  createLog: async (data: Omit<AuditLog, 'log_id' | 'timestamp'>): Promise<AuditLog> => {
    const response = await api.post('/api/v1/audit-logs', data);
    return response.data;
  },
};
