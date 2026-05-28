import api from './auth';

export interface OrderItem {
  item_id: string;
  quantity: number;
}

export interface OrderCreate {
  patient_id: string;
  order_type: 'BHYT_EXTENSION' | 'PHARMACY';
  bhyt_id?: string;
  extension_months?: number;
  items?: OrderItem[];
}

export interface Order {
  order_id: string;
  patient_id: string;
  order_type: 'BHYT_EXTENSION' | 'PHARMACY';
  total_amount: number;
  status: 'PENDING' | 'PAID' | 'CANCELLED';
  created_at: string;
  expires_at: string;
  order_metadata?: Record<string, any>;
  qr_url?: string;
  transfer_content?: string;
}

export const orderApi = {
  listOrders: async (): Promise<Order[]> => {
    const response = await api.get('/api/v1/orders/');
    return response.data;
  },

  createOrder: async (data: OrderCreate): Promise<Order> => {
    const response = await api.post('/api/v1/orders/', data);
    return response.data;
  },

  checkExpiredOrders: async (): Promise<{ message: string }> => {
    const response = await api.post('/api/v1/orders/check-expired');
    return response.data;
  },
};
