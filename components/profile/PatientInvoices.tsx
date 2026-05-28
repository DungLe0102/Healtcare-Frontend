"use client";

import React, { useEffect, useState } from 'react';
import { Table, Tag, Button, Space, Modal, Spin, Typography, App } from 'antd';
import { EyeOutlined, CreditCardOutlined } from '@ant-design/icons';
import { billingApi, BillingResponse } from '@/api/billing';
import { reportApi, PatientFinancialSummary } from '@/api/report';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

export default function PatientInvoices() {
  const [invoices, setInvoices] = useState<BillingResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<BillingResponse | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrUrl, setQrUrl] = useState<string | null>(null);

  const [financials, setFinancials] = useState<PatientFinancialSummary | null>(null);

  const { message } = App.useApp();

  useEffect(() => {
    fetchInvoices();
    fetchFinancials();
  }, []);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const data = await billingApi.getMyInvoices();
      // Sort by created_at descending
      setInvoices(data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
    } catch (error) {
      message.error('Không thể tải danh sách hóa đơn.');
    } finally {
      setLoading(false);
    }
  };

  const fetchFinancials = async () => {
    const patientId = localStorage.getItem('account_id');
    if (!patientId) return;
    try {
      const data = await reportApi.getPatientFinancials(patientId);
      setFinancials(data);
    } catch (error) {
      console.error('Failed to load financial summary');
    }
  };

  const handleViewDetails = (invoice: BillingResponse) => {
    setSelectedInvoice(invoice);
    setIsModalOpen(true);
    setQrUrl(null);
  };

  const handleGenerateQR = async () => {
    if (!selectedInvoice) return;
    setQrLoading(true);
    try {
      // In a real app, you'd call generating API from appointment flow, but here we can mock or use an endpoint if available.
      // Wait, there is POST /billing/{billing_id}/vietqr. We need to add it to API client if not exists.
      // Let's assume we can fetch it. Let's call standard fetch to /api/v1/billing/{id}/vietqr
      const token = localStorage.getItem('access_token');
      const response = await fetch(`http://localhost:8000/api/v1/billing/${selectedInvoice.billing_id}/vietqr`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Lỗi tạo QR');
      const data = await response.json();
      setQrUrl(data.vietqr_url);
    } catch (error) {
      message.error('Không thể tạo mã QR thanh toán.');
    } finally {
      setQrLoading(false);
    }
  };

  const columns = [
    {
      title: 'Mã Hóa đơn',
      dataIndex: 'billing_id',
      key: 'billing_id',
      render: (id: string) => <Text className="text-gray-500 text-xs">{id.substring(0, 8).toUpperCase()}</Text>
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (val: string) => dayjs(val).format('DD/MM/YYYY HH:mm')
    },
    {
      title: 'Cần thanh toán',
      dataIndex: 'patient_paid_amount',
      key: 'patient_paid_amount',
      render: (val: number) => <Text strong className="text-red-600">{val.toLocaleString('vi-VN')} đ</Text>
    },
    {
      title: 'Trạng thái',
      dataIndex: 'billing_status',
      key: 'billing_status',
      render: (status: string) => {
        return (
          <Tag color={status === 'PAID' ? 'green' : status === 'PARTIAL' ? 'blue' : status === 'REFUNDED' ? 'purple' : 'orange'}>
            {status}
          </Tag>
        );
      }
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_: any, record: BillingResponse) => (
        <Button size="small" type="link" icon={<EyeOutlined />} onClick={() => handleViewDetails(record)}>
          Chi tiết
        </Button>
      )
    }
  ];

  return (
    <div className="mt-4 space-y-6">
      {financials && (
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="bg-green-50/50 p-4 border border-green-100 rounded-xl">
            <div className="text-gray-500 text-xs uppercase font-semibold">Đã Thanh Toán</div>
            <div className="text-xl font-black text-green-700 mt-1">{(financials.total_paid || 0).toLocaleString('vi-VN')} đ</div>
          </div>
          <div className="bg-purple-50/50 p-4 border border-purple-100 rounded-xl">
            <div className="text-gray-500 text-xs uppercase font-semibold">Đã Hoàn Trả</div>
            <div className="text-xl font-black text-purple-700 mt-1">{(financials.total_refunded || 0).toLocaleString('vi-VN')} đ</div>
          </div>
          <div className="bg-orange-50/50 p-4 border border-orange-100 rounded-xl">
            <div className="text-gray-500 text-xs uppercase font-semibold">Đang Chờ Xử Lý</div>
            <div className="text-xl font-black text-orange-700 mt-1">{(financials.pending_amount || 0).toLocaleString('vi-VN')} đ</div>
          </div>
        </div>
      )}

      <Table 
        columns={columns} 
        dataSource={invoices} 
        rowKey="billing_id" 
        loading={loading}
        pagination={{ pageSize: 5 }}
        locale={{ emptyText: 'Bạn chưa có hóa đơn nào.' }}
      />

      <Modal
        title="Chi tiết Hóa đơn"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setIsModalOpen(false)}>Đóng</Button>
        ]}
        forceRender
      >
        {selectedInvoice && (
          <div className="mt-4">
            <div className="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-100">
              <div className="flex justify-between mb-2">
                <Text>Mã Hóa Đơn:</Text>
                <Text className="text-xs">{selectedInvoice.billing_id}</Text>
              </div>
              <div className="flex justify-between mb-2">
                <Text>Trạng thái:</Text>
                <Tag color={selectedInvoice.billing_status === 'PAID' ? 'green' : 'orange'}>
                  {selectedInvoice.billing_status}
                </Tag>
              </div>
              <div className="flex justify-between mb-2 mt-4 pt-2 border-t border-gray-200">
                <Text>Tổng phí dịch vụ:</Text>
                <Text>{selectedInvoice.total_amount.toLocaleString('vi-VN')} đ</Text>
              </div>
              <div className="flex justify-between mb-2">
                <Text>Bảo hiểm chi trả:</Text>
                <Text className="text-green-600">- {selectedInvoice.bhyt_covered_amount.toLocaleString('vi-VN')} đ</Text>
              </div>
              <div className="flex justify-between font-bold text-lg border-t border-gray-200 pt-2 mt-2">
                <Text>Bạn Cần Trả:</Text>
                <Text className="text-red-600">{selectedInvoice.patient_paid_amount.toLocaleString('vi-VN')} đ</Text>
              </div>
            </div>

            {selectedInvoice.billing_status !== 'PAID' && selectedInvoice.patient_paid_amount > 0 && (
              <div className="text-center bg-blue-50 p-4 rounded-xl border border-blue-100">
                <Text className="block mb-4 text-blue-800">Hóa đơn này chưa được thanh toán hoàn tất.</Text>
                {!qrUrl ? (
                  <Button 
                    type="primary" 
                    icon={<CreditCardOutlined />} 
                    onClick={handleGenerateQR}
                    loading={qrLoading}
                  >
                    Lấy mã QR Thanh toán (VietQR)
                  </Button>
                ) : (
                  <div>
                    <img src={qrUrl} alt="QR Code" className="w-48 h-48 mx-auto mb-2 border rounded-xl shadow-sm" />
                    <Text className="text-xs text-gray-500">Mở ứng dụng ngân hàng và quét mã để thanh toán.</Text>
                  </div>
                )}
              </div>
            )}

            <div className="mt-6">
              <Text strong className="block mb-2">Lịch sử Giao dịch</Text>
              {selectedInvoice.transactions && selectedInvoice.transactions.length > 0 ? (
                <div className="space-y-2">
                  {selectedInvoice.transactions.map((tx: any) => (
                    <div key={tx.transaction_id} className="flex justify-between items-center p-2 border rounded-lg">
                      <div>
                        <div className="font-semibold">{tx.amount.toLocaleString('vi-VN')} đ</div>
                        <div className="text-xs text-gray-500">{dayjs(tx.created_at).format('DD/MM/YYYY HH:mm')} • {tx.payment_method}</div>
                      </div>
                      <Tag color={tx.transaction_status === 'SUCCESS' ? 'green' : 'orange'}>
                        {tx.transaction_status}
                      </Tag>
                    </div>
                  ))}
                </div>
              ) : (
                <Text className="italic text-gray-400 text-sm">Chưa có giao dịch thanh toán.</Text>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
