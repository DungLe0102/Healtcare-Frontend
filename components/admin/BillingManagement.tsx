"use client";

import React, { useEffect, useState } from 'react';
import { Card, Table, Button, Tag, Space, Modal, Form, Select, App, InputNumber, Typography, Tooltip, Input } from 'antd';
import { CreditCardOutlined, SearchOutlined, UndoOutlined, CheckCircleOutlined, EyeOutlined } from '@ant-design/icons';
import { billingApi, BillingResponse, PaymentResponse } from '@/api/billing';
import { patientApi, PatientResponse } from '@/api/patient';
import dayjs from 'dayjs';
import { getErrorMessage } from '@/utils/errorHandler';

const { Option } = Select;
const { Title, Text } = Typography;

export default function BillingManagement() {
  const [billings, setBillings] = useState<BillingResponse[]>([]);
  // We might not have a get all billings API. We need to handle this.
  // Wait, I check the billing.py router, there is NO `GET /billing` to list all billings!
  // There is only `GET /patients/me/invoices` and `GET /billing/{id}`.
  // Ah! Admin usually needs to view all billings. Let me mock it by fetching appointments and getting billings if needed, or simply provide a search by Billing ID.
  
  // Wait! Let's check appointment.py to see if it returns billing details or if I can fetch all appointments and get their billings.
  const [loading, setLoading] = useState(false);
  const [searchId, setSearchId] = useState('');
  const [searchedBill, setSearchedBill] = useState<BillingResponse | null>(null);
  const { message, modal } = App.useApp();

  // Create Manual Payment Modal
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentForm] = Form.useForm();
  
  // Refund Modal
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [refundForm] = Form.useForm();
  const [selectedTransaction, setSelectedTransaction] = useState<PaymentResponse | null>(null);

  const handleSearch = async () => {
    if (!searchId.trim()) {
      message.warning('Vui lòng nhập ID hóa đơn hoặc ID cuộc hẹn');
      return;
    }
    
    setLoading(true);
    try {
      // First try to search by billing_id
      try {
        const data = await billingApi.getBilling(searchId);
        setSearchedBill(data);
        message.success('Tìm thấy hóa đơn!');
        return;
      } catch (e) {
        // If fail, try to search by appointment_id
        const data = await billingApi.getBillingByAppointment(searchId);
        setSearchedBill(data);
        message.success('Tìm thấy hóa đơn từ ID cuộc hẹn!');
      }
    } catch (error) {
      message.error('Không tìm thấy hóa đơn nào với ID cung cấp');
      setSearchedBill(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePayment = async (values: any) => {
    if (!searchedBill) return;
    try {
      const payload = {
        billing_id: searchedBill.billing_id,
        payment_method: values.payment_method,
        amount: values.amount,
      };
      
      const newPayment = await billingApi.createPayment(payload);
      
      // Auto confirm for cash or bank transfer
      if (values.auto_confirm) {
        await billingApi.updatePaymentStatus(newPayment.transaction_id, { transaction_status: 'SUCCESS' });
        message.success('Tạo và xác nhận thanh toán thành công!');
      } else {
        message.success('Tạo giao dịch thành công (Chờ xác nhận)');
      }
      
      setIsPaymentModalOpen(false);
      paymentForm.resetFields();
      
      // Refresh bill
      const refreshedBill = await billingApi.getBilling(searchedBill.billing_id);
      setSearchedBill(refreshedBill);
      
    } catch (error: any) {
      message.error(getErrorMessage(error, 'Lỗi khi tạo giao dịch thanh toán'));
    }
  };

  const handleConfirmTransaction = async (transactionId: string) => {
    if (!searchedBill) return;
    try {
      await billingApi.updatePaymentStatus(transactionId, { transaction_status: 'SUCCESS' });
      message.success('Đã xác nhận nhận tiền!');
      
      // Refresh bill
      const refreshedBill = await billingApi.getBilling(searchedBill.billing_id);
      setSearchedBill(refreshedBill);
    } catch (error: any) {
      message.error(getErrorMessage(error, 'Xác nhận thất bại'));
    }
  };

  const handleRefund = async (values: any) => {
    if (!selectedTransaction || !searchedBill) return;
    try {
      await billingApi.refundVietQR(selectedTransaction.transaction_id, values.amount, values.content);
      message.success('Yêu cầu hoàn tiền đã được xử lý!');
      setIsRefundModalOpen(false);
      
      // Refresh bill
      const refreshedBill = await billingApi.getBilling(searchedBill.billing_id);
      setSearchedBill(refreshedBill);
    } catch (error: any) {
      message.error(getErrorMessage(error, 'Hoàn tiền thất bại'));
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <Card 
        title={<span className="text-xl font-semibold text-blue-800">Quản lý Thu ngân (Admin)</span>}
        className="shadow-sm border-gray-100 rounded-xl mb-6"
      >
        <div className="mb-2">
          <Text className="text-gray-500">Tra cứu hóa đơn thanh toán bằng UUID của Hóa Đơn hoặc UUID của Cuộc Hẹn.</Text>
        </div>
        <div className="flex gap-4">
          <Input.Search
            placeholder="Nhập Billing ID hoặc Appointment ID..."
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            onSearch={handleSearch}
            enterButton="Tra cứu"
            size="large"
            loading={loading}
          />
        </div>
      </Card>

      {searchedBill && (
        <Card className="shadow-sm border-gray-100 rounded-xl">
          <div className="flex justify-between items-start mb-6 border-b pb-4">
            <div>
              <Title level={4} className="m-0 text-gray-800">Chi tiết Hóa Đơn</Title>
              <Text className="text-gray-500 text-sm">ID: {searchedBill.billing_id}</Text>
            </div>
            <div>
              <Tag color={
                searchedBill.billing_status === 'PAID' ? 'green' : 
                searchedBill.billing_status === 'PARTIAL' ? 'blue' : 
                searchedBill.billing_status === 'REFUNDED' ? 'purple' : 'orange'
              } className="text-sm px-4 py-1">
                {searchedBill.billing_status}
              </Tag>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 mb-8">
            <div className="bg-gray-50 p-4 rounded-lg">
              <Text strong className="block mb-2 text-gray-700">Thông tin Hóa Đơn</Text>
              <div className="flex justify-between mb-2">
                <Text>Tổng phí dịch vụ:</Text>
                <Text strong>{searchedBill.total_amount.toLocaleString('vi-VN')} đ</Text>
              </div>
              <div className="flex justify-between mb-2">
                <Text>BHYT chi trả:</Text>
                <Text className="text-green-600">- {searchedBill.bhyt_covered_amount.toLocaleString('vi-VN')} đ</Text>
              </div>
              <div className="flex justify-between font-bold border-t pt-2 mt-2">
                <Text>Bệnh nhân CẦN TRẢ:</Text>
                <Text className="text-red-600 text-lg">{searchedBill.patient_paid_amount.toLocaleString('vi-VN')} đ</Text>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-4">
                <Text strong className="text-gray-700">Lịch sử Giao dịch</Text>
                {searchedBill.billing_status !== 'PAID' && (
                  <Button type="primary" size="small" icon={<CreditCardOutlined />} onClick={() => setIsPaymentModalOpen(true)}>
                    Thu tiền mặt
                  </Button>
                )}
              </div>
              
              {searchedBill.transactions && searchedBill.transactions.length > 0 ? (
                <div className="space-y-3">
                  {searchedBill.transactions.map((tx) => (
                    <div key={tx.transaction_id} className="border p-3 rounded-lg flex justify-between items-center">
                      <div>
                        <div className="font-semibold text-blue-700">{tx.amount.toLocaleString('vi-VN')} đ</div>
                        <div className="text-xs text-gray-500">
                          {tx.payment_method} • {dayjs(tx.created_at).format('DD/MM/YYYY HH:mm')}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Tag color={tx.transaction_status === 'SUCCESS' ? 'green' : tx.transaction_status === 'FAILED' ? 'red' : 'orange'}>
                          {tx.transaction_status}
                        </Tag>
                        {tx.transaction_status === 'PENDING' && (
                          <Button size="small" type="link" onClick={() => handleConfirmTransaction(tx.transaction_id)}>
                            Xác nhận đã nhận
                          </Button>
                        )}
                        {tx.transaction_status === 'SUCCESS' && tx.payment_method === 'VIETQR' && (
                          <Button size="small" type="link" danger icon={<UndoOutlined />} onClick={() => {
                            setSelectedTransaction(tx);
                            refundForm.setFieldsValue({ amount: tx.amount, content: '' });
                            setIsRefundModalOpen(true);
                          }}>
                            Hoàn tiền
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-6 bg-gray-50 rounded-lg text-gray-500 italic">
                  Chưa có giao dịch thanh toán nào
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Manual Payment Modal */}
      <Modal
        title="Tạo Giao dịch Thu tiền Thủ công"
        open={isPaymentModalOpen}
        onCancel={() => setIsPaymentModalOpen(false)}
        footer={null}
        forceRender
      >
        <Form form={paymentForm} layout="vertical" onFinish={handleCreatePayment}>
          <Form.Item name="amount" label="Số tiền thu (VNĐ)" rules={[{ required: true }]}>
            <InputNumber className="w-full" min={1000} step={10000} formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
          </Form.Item>
          
          <Form.Item name="payment_method" label="Phương thức thanh toán" rules={[{ required: true }]}>
            <Select>
              <Option value="CASH">Tiền mặt</Option>
              <Option value="BANK_TRANSFER">Chuyển khoản thủ công</Option>
            </Select>
          </Form.Item>
          
          <Form.Item name="auto_confirm" valuePropName="checked" initialValue={true}>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" defaultChecked />
              <span>Xác nhận đã nhận tiền (Cập nhật trạng thái SUCCESS ngay lập tức)</span>
            </label>
          </Form.Item>

          <div className="flex justify-end gap-2 mt-4">
            <Button onClick={() => setIsPaymentModalOpen(false)}>Hủy</Button>
            <Button type="primary" htmlType="submit">Xác nhận thu tiền</Button>
          </div>
        </Form>
      </Modal>

      {/* Refund Modal */}
      <Modal
        title="Hoàn tiền Giao dịch VietQR"
        open={isRefundModalOpen}
        onCancel={() => setIsRefundModalOpen(false)}
        footer={null}
        forceRender
      >
        <div className="bg-yellow-50 p-3 mb-4 rounded border border-yellow-200">
          <Text className="text-yellow-800 text-sm">
            Hệ thống sẽ gọi API của ngân hàng để hoàn trả số tiền này về lại tài khoản của bệnh nhân. 
            Thao tác này <strong>không thể hoàn tác</strong>.
          </Text>
        </div>
        <Form form={refundForm} layout="vertical" onFinish={handleRefund}>
          <Form.Item name="amount" label="Số tiền hoàn lại (VNĐ)" rules={[{ required: true }]}>
            <InputNumber 
              className="w-full" 
              min={1000} 
              max={selectedTransaction?.amount || 0}
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} 
            />
          </Form.Item>
          
          <Form.Item name="content" label="Lý do hoàn tiền" rules={[{ required: true }]}>
            <Input.TextArea rows={2} placeholder="Nhập lý do hoàn tiền..." />
          </Form.Item>

          <div className="flex justify-end gap-2 mt-4">
            <Button onClick={() => setIsRefundModalOpen(false)}>Hủy</Button>
            <Button type="primary" danger htmlType="submit">Thực hiện Hoàn Tiền</Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
