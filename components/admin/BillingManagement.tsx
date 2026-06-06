"use client";

import React, { useEffect, useState } from 'react';
import { Card, Table, Button, Tag, Space, Modal, Form, Select, App, InputNumber, Typography, Tooltip, Input, DatePicker, Drawer } from 'antd';
import { CreditCardOutlined, SearchOutlined, UndoOutlined, CheckCircleOutlined, EyeOutlined, DollarOutlined } from '@ant-design/icons';
import { billingApi, BillingResponse, PaymentResponse } from '@/api/billing';
import { patientApi, PatientResponse } from '@/api/patient';
import dayjs from 'dayjs';
import { getErrorMessage } from '@/utils/errorHandler';
import BillingSummaryStats from './BillingSummaryStats';

const { Option } = Select;
const { Title, Text } = Typography;

export default function BillingManagement() {
  const [mounted, setMounted] = useState(false);
  const [billings, setBillings] = useState<BillingResponse[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);
  const [loading, setLoading] = useState(false);
  const [searchId, setSearchId] = useState('');
  const [searchedBill, setSearchedBill] = useState<BillingResponse | null>(null);

  // States for advanced filtering
  const [filterStatus, setFilterStatus] = useState<string | undefined>(undefined);
  const [patientName, setPatientName] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [startDate, setStartDate] = useState<string | undefined>(undefined);
  const [endDate, setEndDate] = useState<string | undefined>(undefined);

  const { message, modal } = App.useApp();

  const fetchBillings = async () => {
    setLoading(true);
    try {
      const data = await billingApi.listBillings({
        status: filterStatus,
        patient_name: patientName || undefined,
        doctor_name: doctorName || undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      });
      setBillings(data);
    } catch (error: any) {
      message.error(getErrorMessage(error, 'Không thể tải danh sách hóa đơn'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBillings();
  }, [filterStatus, startDate, endDate]);

  // Create Manual Payment Modal
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentForm] = Form.useForm();
  
  // Refund Modal
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [refundForm] = Form.useForm();
  const [selectedTransaction, setSelectedTransaction] = useState<PaymentResponse | null>(null);

  const handleSelectBill = async (billingId: string) => {
    setLoading(true);
    try {
      const data = await billingApi.getBilling(billingId);
      setSearchedBill(data);
    } catch (error: any) {
      message.error(getErrorMessage(error, 'Không thể tải chi tiết hóa đơn'));
    } finally {
      setLoading(false);
    }
  };

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
      fetchBillings();
      
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
      fetchBillings();
    } catch (error: any) {
      message.error(getErrorMessage(error, 'Xác nhận thất bại'));
    }
  };

  const handleRefund = async (values: any) => {
    console.log('handleRefund called!', { values, selectedTransaction, searchedBill });
    if (!selectedTransaction) {
      console.warn('handleRefund returned early because selectedTransaction is missing!');
      return;
    }
    try {
      console.log('Calling billingApi.refundVietQR with:', {
        transaction_id: selectedTransaction.transaction_id,
        amount: values.amount,
        content: values.content,
        target_bank_code: values.target_bank_code,
        target_account_no: values.target_account_no,
        target_account_name: values.target_account_name
      });
      await billingApi.refundVietQR(
        selectedTransaction.transaction_id,
        values.amount,
        values.content,
        values.target_bank_code,
        values.target_account_no,
        values.target_account_name
      );
      message.success('Yêu cầu hoàn tiền đã được xử lý!');
      setIsRefundModalOpen(false);
      
      // Refresh bill using billing_id from selectedTransaction
      const billingId = selectedTransaction.billing_id;
      if (billingId) {
        const refreshedBill = await billingApi.getBilling(billingId);
        setSearchedBill(refreshedBill);
      }
      fetchBillings();
    } catch (error: any) {
      console.error('Error inside handleRefund:', error);
      message.error(getErrorMessage(error, 'Hoàn tiền thất bại'));
    }
  };

  if (!mounted) {
    return (
      <div className="p-8 max-w-5xl mx-auto space-y-6">
        {/* Header/Filter Skeleton */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
        
        {/* Table Skeleton */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-10 bg-gray-200 rounded w-full animate-pulse"></div>
          <div className="space-y-3">
            <div className="h-12 bg-gray-100 rounded animate-pulse"></div>
            <div className="h-12 bg-gray-100 rounded animate-pulse"></div>
            <div className="h-12 bg-gray-100 rounded animate-pulse"></div>
            <div className="h-12 bg-gray-100 rounded animate-pulse"></div>
            <div className="h-12 bg-gray-100 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Premium Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-700 via-indigo-600 to-purple-600 p-6 text-white shadow-lg mb-6">
        <div className="relative z-10">
          <Space align="center" className="mb-2">
            <DollarOutlined className="text-xl text-blue-100" />
            <span className="bg-white/20 text-white border border-white/30 text-[10px] px-2.5 py-0.5 rounded-full font-medium tracking-wide uppercase">
              Hệ thống Tài chính & Thu ngân
            </span>
          </Space>
          <Title level={3} style={{ color: '#fff', margin: '2px 0 6px 0', fontWeight: 700 }}>
            Quản Lý Thu Ngân & Hoàn Tiền
          </Title>
          <Text style={{ color: 'rgba(255, 255, 255, 0.85)' }} className="text-sm">
            Theo dõi hóa đơn viện phí, duyệt yêu cầu hoàn tiền, xác nhận giao dịch chuyển khoản/tiền mặt của bệnh nhân.
          </Text>
        </div>
      </div>

      <BillingSummaryStats billings={billings} />

      <Card 
        title={<span className="text-xl font-semibold text-blue-800">Bộ lọc & Tìm kiếm Hóa đơn</span>}
        className="shadow-sm border-gray-100 rounded-xl mb-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <div className="text-xs text-gray-500 mb-1">Tên bệnh nhân</div>
            <Input 
              placeholder="Nhập tên bệnh nhân..." 
              value={patientName} 
              onChange={e => setPatientName(e.target.value)}
              onPressEnter={fetchBillings}
            />
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">Tên bác sĩ</div>
            <Input 
              placeholder="Nhập tên bác sĩ..." 
              value={doctorName} 
              onChange={e => setDoctorName(e.target.value)}
              onPressEnter={fetchBillings}
            />
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">Trạng thái</div>
            <Select 
              className="w-full" 
              placeholder="Tất cả trạng thái" 
              value={filterStatus}
              onChange={val => setFilterStatus(val)}
              allowClear
            >
              <Option value="UNPAID">UNPAID (Chưa thanh toán)</Option>
              <Option value="PARTIAL">PARTIAL (Thanh toán một phần)</Option>
              <Option value="PAID">PAID (Đã thanh toán)</Option>
              <Option value="REFUND_DUE">REFUND_DUE (Yêu cầu hoàn tiền)</Option>
              <Option value="REFUNDED">REFUNDED (Đã hoàn tiền)</Option>
            </Select>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">Thời gian tạo hóa đơn</div>
            <DatePicker.RangePicker 
              className="w-full" 
              placeholder={['Từ ngày', 'Đến ngày']}
              onChange={(dates, dateStrings) => {
                setStartDate(dateStrings[0] || undefined);
                setEndDate(dateStrings[1] || undefined);
              }}
            />
          </div>
          <div className="flex items-end gap-2">
            <Button type="primary" icon={<SearchOutlined />} className="w-full" onClick={fetchBillings}>
              Tìm kiếm
            </Button>
            <Button onClick={() => {
              setPatientName('');
              setDoctorName('');
              setFilterStatus(undefined);
              setStartDate(undefined);
              setEndDate(undefined);
              setBillings([]);
              setTimeout(() => fetchBillings(), 50);
            }}>
              Reset
            </Button>
          </div>
        </div>
      </Card>

      <Card 
        title={<span className="text-xl font-semibold text-blue-800">Danh sách Hóa đơn & Yêu cầu hoàn tiền</span>}
        className="shadow-sm border-gray-100 rounded-xl mb-6"
      >
        <div className="mb-4 flex gap-4">
          <Input.Search
            placeholder="Tra cứu nhanh bằng Billing ID hoặc Appointment ID..."
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            onSearch={handleSearch}
            enterButton="Tra cứu nhanh"
            loading={loading}
          />
        </div>
        <Table
          dataSource={billings}
          rowKey="billing_id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          onRow={(record) => {
            return {
              onClick: () => {
                handleSelectBill(record.billing_id);
              },
            };
          }}
          columns={[
            {
              title: 'Mã Hóa đơn',
              dataIndex: 'billing_id',
              key: 'billing_id',
              render: (id: string) => <Text copyable={{ text: id }}>{id.split('-')[0]}</Text>
            },
            {
              title: 'Bệnh nhân',
              dataIndex: 'patient_name',
              key: 'patient_name',
              render: (name: string) => name || <Text italic className="text-gray-400">Không có thông tin</Text>
            },
            {
              title: 'Bác sĩ',
              dataIndex: 'doctor_name',
              key: 'doctor_name',
              render: (name: string) => name || <Text italic className="text-gray-400">Không có thông tin</Text>
            },
            {
              title: 'Số tiền cần trả',
              dataIndex: 'patient_paid_amount',
              key: 'patient_paid_amount',
              render: (amount: number) => <Text strong>{amount.toLocaleString('vi-VN')} đ</Text>
            },
            {
              title: 'Trạng thái',
              dataIndex: 'billing_status',
              key: 'billing_status',
              render: (status: string) => (
                <Tag color={
                  status === 'PAID' ? 'green' : 
                  status === 'PARTIAL' ? 'blue' : 
                  status === 'REFUND_DUE' ? 'orange' : 
                  status === 'REFUNDED' ? 'purple' : 'gray'
                }>
                  {status}
                </Tag>
              )
            },
            {
              title: 'Ngày tạo',
              dataIndex: 'created_at',
              key: 'created_at',
              render: (date: string) => dayjs(date).format('DD/MM/YYYY HH:mm')
            },
            {
              title: 'Thao tác',
              key: 'action',
              render: (_, record) => (
                <Button 
                  type="link" 
                  icon={<EyeOutlined />} 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectBill(record.billing_id);
                  }}
                >
                  Xử lý
                </Button>
              )
            }
          ]}
        />
      </Card>

      <Drawer
        title={
          <div className="flex justify-between items-center pr-8">
            <span className="text-lg font-bold text-gray-800">Chi tiết Hóa Đơn & Xử lý</span>
            {searchedBill && (
              <Tag color={
                searchedBill.billing_status === 'PAID' ? 'green' : 
                searchedBill.billing_status === 'PARTIAL' ? 'blue' : 
                searchedBill.billing_status === 'REFUNDED' ? 'purple' : 'orange'
              } className="text-sm px-3 py-0.5 m-0">
                {searchedBill.billing_status}
              </Tag>
            )}
          </div>
        }
        placement="right"
        width={650}
        onClose={() => setSearchedBill(null)}
        open={!!searchedBill}
        destroyOnClose
        maskClosable={false}
      >
        {searchedBill && (
          <div className="space-y-6">
            <div>
              <Text className="text-gray-500 text-xs block mb-1">Mã hóa đơn</Text>
              <Text copyable className="font-mono text-sm">{searchedBill.billing_id}</Text>
            </div>

            {searchedBill.billing_status === 'REFUND_DUE' && (
              <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg flex justify-between items-center">
                <div className="flex-1 pr-4">
                  <div className="font-semibold text-orange-800 text-sm">Yêu cầu hoàn tiền từ Bệnh nhân</div>
                  <div className="text-xs text-orange-700 mt-1">
                    <strong>Ngân hàng:</strong> {searchedBill.refund_bank_code} • <strong>STK:</strong> {searchedBill.refund_account_no} • <strong>Chủ TK:</strong> {searchedBill.refund_account_name}
                  </div>
                  <div className="text-xs text-orange-700 mt-0.5">
                    <strong>Lý do hủy:</strong> {searchedBill.refund_reason || 'Không có lý do'}
                  </div>
                </div>
                <div>
                  {(() => {
                    const successTx = searchedBill.transactions?.find(t => t.transaction_status === 'SUCCESS' && t.payment_method === 'VIETQR');
                    if (successTx) {
                      return (
                        <Button 
                          type="primary" 
                          danger
                          icon={<UndoOutlined />}
                          onClick={() => {
                            setSelectedTransaction(successTx);
                            refundForm.setFieldsValue({ 
                              amount: successTx.amount,
                              target_bank_code: searchedBill.refund_bank_code,
                              target_account_no: searchedBill.refund_account_no,
                              target_account_name: searchedBill.refund_account_name,
                              content: searchedBill.refund_reason || 'Hoàn tiền hủy lịch hẹn'
                            });
                            setIsRefundModalOpen(true);
                          }}
                        >
                          Duyệt Hoàn Tiền
                        </Button>
                      );
                    } else {
                      return (
                        <Text className="text-xs text-gray-500 italic">Không tìm thấy GD VietQR thành công</Text>
                      );
                    }
                  })()}
                </div>
              </div>
            )}

            <div className="bg-gray-50 p-4 rounded-lg">
              <Text strong className="block mb-3 text-gray-700">Thông tin Hóa Đơn</Text>
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
              <div className="flex justify-between items-center mb-3">
                <Text strong className="text-gray-700">Lịch sử Giao dịch</Text>
                {searchedBill.billing_status !== 'PAID' && searchedBill.billing_status !== 'REFUNDED' && (
                  <Button 
                    type="primary" 
                    size="small" 
                    icon={<CreditCardOutlined />}
                    onClick={() => {
                      paymentForm.setFieldsValue({ amount: searchedBill.patient_paid_amount });
                      setIsPaymentModalOpen(true);
                    }}
                  >
                    Thu tiền mặt/chuyển khoản
                  </Button>
                )}
              </div>

              {searchedBill.transactions && searchedBill.transactions.length > 0 ? (
                <div className="space-y-3">
                  {searchedBill.transactions.map((tx) => (
                    <div key={tx.transaction_id} className="border p-3 rounded-lg flex justify-between items-center bg-white">
                      <div>
                        <div className="font-semibold text-sm">
                          {tx.payment_method === 'VIETQR' ? 'Cổng VietQR' : 
                           tx.payment_method === 'CASH' ? 'Tiền mặt' : 'Chuyển khoản'}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          Số tiền: <strong className="text-gray-800">{tx.amount.toLocaleString('vi-VN')} đ</strong>
                        </div>
                        {tx.payment_date && (
                          <div className="text-xs text-gray-400 mt-0.5">
                            Thời gian: {dayjs(tx.payment_date).format('DD/MM/YYYY HH:mm')}
                          </div>
                        )}
                        {tx.gateway_reference_id && (
                          <div className="text-xs text-gray-400">
                            Mã GD: {tx.gateway_reference_id}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Tag color={
                          tx.transaction_status === 'SUCCESS' ? 'green' : 
                          tx.transaction_status === 'FAILED' ? 'red' : 
                          tx.transaction_status === 'REFUNDED' ? 'purple' : 'blue'
                        }>
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
                            refundForm.setFieldsValue({ 
                              amount: tx.amount,
                              target_bank_code: searchedBill.refund_bank_code,
                              target_account_no: searchedBill.refund_account_no,
                              target_account_name: searchedBill.refund_account_name,
                              content: searchedBill.refund_reason || 'Hoàn tiền hủy lịch hẹn'
                            });
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
        )}
      </Drawer>

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
        <Form 
          form={refundForm} 
          layout="vertical" 
          onFinish={handleRefund}
          onFinishFailed={(errorInfo) => console.warn('Refund Form Validation Failed:', errorInfo)}
        >
          <Form.Item name="amount" label="Số tiền hoàn lại (VNĐ)" rules={[{ required: true, message: 'Vui lòng nhập số tiền hoàn!' }]}>
            <InputNumber 
              className="w-full" 
              min={1000} 
              max={selectedTransaction?.amount || 0}
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} 
            />
          </Form.Item>
          
          <Form.Item name="target_bank_code" label="Ngân hàng nhận" rules={[{ required: true, message: 'Vui lòng chọn ngân hàng nhận!' }]}>
            <Select placeholder="Chọn ngân hàng nhận tiền...">
              <Option value="VCB">Vietcombank (VCB)</Option>
              <Option value="CTG">VietinBank (CTG)</Option>
              <Option value="BIDV">BIDV (BIDV)</Option>
              <Option value="TCB">Techcombank (TCB)</Option>
              <Option value="MB">MBBank (MB)</Option>
              <Option value="ACB">ACB (ACB)</Option>
              <Option value="VPB">VPBank (VPB)</Option>
              <Option value="STB">Sacombank (STB)</Option>
              <Option value="HDB">HDBank (HDB)</Option>
            </Select>
          </Form.Item>

          <Form.Item name="target_account_no" label="Số tài khoản nhận" rules={[{ required: true, message: 'Vui lòng nhập số tài khoản nhận!' }]}>
            <Input placeholder="Nhập số tài khoản ngân hàng..." />
          </Form.Item>

          <Form.Item name="target_account_name" label="Tên chủ tài khoản nhận (Không bắt buộc)">
            <Input placeholder="Nhập tên chủ tài khoản (viết hoa không dấu, ví dụ: NGUYEN VAN A)..." />
          </Form.Item>

          <Form.Item name="content" label="Lý do hoàn tiền" rules={[{ required: true, message: 'Vui lòng nhập lý do hoàn tiền!' }]}>
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
