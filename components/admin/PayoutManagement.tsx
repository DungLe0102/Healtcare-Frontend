"use client";

import React, { useEffect, useState } from 'react';
import { Card, Table, Button, Tag, Space, Modal, Form, Select, DatePicker, App, InputNumber, Row, Col, Typography, Input, Alert } from 'antd';
import { PlusOutlined, CalculatorOutlined, CheckCircleOutlined, CloseCircleOutlined, SearchOutlined } from '@ant-design/icons';
import { billingApi, DoctorPayoutRead, DoctorEarningsResponse } from '@/api/billing';
import { doctorApi, Doctor } from '@/api/doctor';
import dayjs from 'dayjs';
import { getErrorMessage } from '@/utils/errorHandler';

const { Option } = Select;
const { RangePicker } = DatePicker;
const { Title, Text } = Typography;

export default function PayoutManagement() {
  const [payouts, setPayouts] = useState<DoctorPayoutRead[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);
  const { message, modal } = App.useApp();

  // Filters
  const [filterDoctorId, setFilterDoctorId] = useState<string | undefined>(undefined);
  const [filterStatus, setFilterStatus] = useState<string | undefined>(undefined);

  // Calculate Modal
  const [isCalcModalOpen, setIsCalcModalOpen] = useState(false);
  const [calcForm] = Form.useForm();
  const [earningsResult, setEarningsResult] = useState<DoctorEarningsResponse | null>(null);
  const [calcLoading, setCalcLoading] = useState(false);

  // Create Payout Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm] = Form.useForm();

  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    fetchPayouts();
  }, [filterDoctorId, filterStatus]);

  const fetchDoctors = async () => {
    try {
      const data = await doctorApi.getDoctors(0, 100);
      setDoctors(data);
    } catch (error) {
      message.error('Lỗi khi tải danh sách bác sĩ');
    }
  };

  const fetchPayouts = async () => {
    setLoading(true);
    try {
      const data = await billingApi.getDoctorPayouts(filterDoctorId, filterStatus);
      setPayouts(data);
    } catch (error) {
      message.error('Lỗi khi tải danh sách thanh toán lương');
    } finally {
      setLoading(false);
    }
  };

  const handleCalculateEarnings = async (values: any) => {
    setCalcLoading(true);
    try {
      const payload = {
        doctor_id: values.doctor_id,
        period_start: values.period[0].format('YYYY-MM-DD'),
        period_end: values.period[1].format('YYYY-MM-DD'),
      };
      const result = await billingApi.calculateDoctorEarnings(payload);
      setEarningsResult(result);
      message.success('Tính toán thành công');
    } catch (error: any) {
      message.error(getErrorMessage(error, 'Lỗi khi tính toán thu nhập'));
    } finally {
      setCalcLoading(false);
    }
  };

  const openCreatePayoutFromCalc = () => {
    if (!earningsResult) return;
    setIsCalcModalOpen(false);
    createForm.setFieldsValue({
      doctor_id: earningsResult.doctor_id,
      amount: earningsResult.total_earnings,
      period: [dayjs(earningsResult.period_start), dayjs(earningsResult.period_end)],
      payout_date: dayjs().add(1, 'day'), // Mặc định ngày mai
    });
    setIsCreateModalOpen(true);
  };

  const handleCreatePayout = async (values: any) => {
    try {
      const payload = {
        doctor_id: values.doctor_id,
        amount: values.amount,
        payout_date: values.payout_date.format('YYYY-MM-DD'),
        period_start: values.period[0].format('YYYY-MM-DD'),
        period_end: values.period[1].format('YYYY-MM-DD'),
        notes: values.notes,
      };
      await billingApi.createDoctorPayout(payload);
      message.success('Tạo lệnh thanh toán thành công');
      setIsCreateModalOpen(false);
      createForm.resetFields();
      fetchPayouts();
    } catch (error: any) {
      message.error(getErrorMessage(error, 'Lỗi khi tạo lệnh thanh toán'));
    }
  };

  const handleUpdateStatus = async (payoutId: string, status: 'PAID' | 'CANCELLED') => {
    try {
      await billingApi.updatePayoutStatus(payoutId, { status });
      message.success(`Đã ${status === 'PAID' ? 'xác nhận thanh toán' : 'hủy'} lệnh`);
      fetchPayouts();
    } catch (error: any) {
      message.error(getErrorMessage(error, 'Cập nhật thất bại'));
    }
  };

  const showConfirmUpdate = (payoutId: string, status: 'PAID' | 'CANCELLED') => {
    modal.confirm({
      title: status === 'PAID' ? 'Xác nhận Đã Chuyển Khoản?' : 'Xác nhận Hủy lệnh?',
      content: status === 'PAID' 
        ? 'Thao tác này xác nhận bạn đã chuyển khoản tiền lương cho bác sĩ. Không thể hoàn tác.' 
        : 'Lệnh này sẽ bị hủy và không thể khôi phục.',
      okText: 'Xác nhận',
      cancelText: 'Đóng',
      okType: status === 'PAID' ? 'primary' : 'danger',
      onOk: () => handleUpdateStatus(payoutId, status),
    });
  };

  const columns = [
    {
      title: 'Bác sĩ',
      dataIndex: 'doctor_id',
      key: 'doctor_id',
      render: (docId: string) => {
        const doc = doctors.find(d => d.doctor_id === docId);
        return doc ? <span className="font-medium">{doc.last_name} {doc.first_name}</span> : docId;
      }
    },
    {
      title: 'Kỳ thanh toán',
      key: 'period',
      render: (_: any, record: DoctorPayoutRead) => (
        <span>{dayjs(record.period_start).format('DD/MM/YYYY')} - {dayjs(record.period_end).format('DD/MM/YYYY')}</span>
      )
    },
    {
      title: 'Số tiền',
      dataIndex: 'amount',
      key: 'amount',
      render: (val: number) => <span className="font-bold text-green-600">{val.toLocaleString('vi-VN')} đ</span>
    },
    {
      title: 'Ngày dự kiến',
      dataIndex: 'payout_date',
      key: 'payout_date',
      render: (val: string) => dayjs(val).format('DD/MM/YYYY')
    },
    {
      title: 'Ghi chú',
      dataIndex: 'notes',
      key: 'notes',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const color = status === 'PAID' ? 'green' : status === 'CANCELLED' ? 'red' : 'orange';
        const text = status === 'PAID' ? 'Đã thanh toán' : status === 'CANCELLED' ? 'Đã hủy' : 'Chờ thanh toán';
        return <Tag color={color}>{text}</Tag>;
      }
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_: any, record: DoctorPayoutRead) => {
        if (record.status !== 'PENDING') return null;
        return (
          <Space>
            <Button 
              size="small" 
              type="primary" 
              icon={<CheckCircleOutlined />} 
              onClick={() => showConfirmUpdate(record.payout_id, 'PAID')}
            >
              Đã trả
            </Button>
            <Button 
              size="small" 
              danger 
              icon={<CloseCircleOutlined />} 
              onClick={() => showConfirmUpdate(record.payout_id, 'CANCELLED')}
            />
          </Space>
        );
      }
    }
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <Card 
        title={<span className="text-xl font-semibold text-blue-800">Quản lý Lương Bác sĩ</span>}
        extra={
          <Space>
            <Button icon={<CalculatorOutlined />} onClick={() => {
              setEarningsResult(null);
              calcForm.resetFields();
              setIsCalcModalOpen(true);
            }}>
              Tính thu nhập
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => {
              createForm.resetFields();
              setIsCreateModalOpen(true);
            }}>
              Tạo Lệnh Thủ công
            </Button>
          </Space>
        }
        className="shadow-sm border-gray-100 rounded-xl"
      >
        <div className="mb-6 flex gap-4">
          <Select
            placeholder="Lọc theo bác sĩ"
            allowClear
            showSearch
            value={filterDoctorId}
            onChange={setFilterDoctorId}
            className="w-64"
            filterOption={(input, option) =>
              (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())
            }
            options={doctors.map(d => ({
              value: d.doctor_id,
              label: `${d.last_name} ${d.first_name}`
            }))}
          />
          <Select
            placeholder="Trạng thái lệnh"
            allowClear
            value={filterStatus}
            onChange={setFilterStatus}
            className="w-48"
          >
            <Option value="PENDING">Chờ thanh toán</Option>
            <Option value="PAID">Đã thanh toán</Option>
            <Option value="CANCELLED">Đã hủy</Option>
          </Select>
          <Button icon={<SearchOutlined />} onClick={fetchPayouts}>Làm mới</Button>
        </div>

        <Table 
          columns={columns}
          dataSource={payouts}
          rowKey="payout_id"
          loading={loading}
        />
      </Card>

      {/* Modal Tính Thu Nhập */}
      <Modal
        title="Tính thu nhập bác sĩ"
        open={isCalcModalOpen}
        onCancel={() => setIsCalcModalOpen(false)}
        footer={null}
        width={600}
        forceRender
      >
        <Form form={calcForm} layout="vertical" onFinish={handleCalculateEarnings}>
          <Form.Item name="doctor_id" label="Chọn Bác sĩ" rules={[{ required: true }]}>
            <Select showSearch placeholder="Chọn bác sĩ..." options={doctors.map(d => ({
              value: d.doctor_id,
              label: `${d.last_name} ${d.first_name} - ${d.specialization}`
            }))} filterOption={(input, option) => (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())} />
          </Form.Item>
          
          <Form.Item name="period" label="Kỳ tính lương (Từ ngày - Đến ngày)" rules={[{ required: true }]}>
            <RangePicker className="w-full" format="DD/MM/YYYY" />
          </Form.Item>

          <Button type="primary" htmlType="submit" loading={calcLoading} block icon={<CalculatorOutlined />}>
            Thực hiện tính toán
          </Button>
        </Form>

        {earningsResult && (
          <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-100">
            <Title level={5} className="text-green-800">Kết quả tính toán</Title>
            <Row className="mb-2">
              <Col span={12}><Text type="secondary">Kỳ lương:</Text></Col>
              <Col span={12} className="text-right font-medium">
                {dayjs(earningsResult.period_start).format('DD/MM/YYYY')} - {dayjs(earningsResult.period_end).format('DD/MM/YYYY')}
              </Col>
            </Row>
            <Row className="mb-2">
              <Col span={12}><Text type="secondary">Tổng số ca khám hoàn thành:</Text></Col>
              <Col span={12} className="text-right font-medium">{earningsResult.total_completed_appointments} ca</Col>
            </Row>
            <Row className="mb-4">
              <Col span={12}><Text type="secondary">Tổng tiền dự kiến nhận:</Text></Col>
              <Col span={12} className="text-right font-bold text-lg text-green-600">{earningsResult.total_earnings.toLocaleString('vi-VN')} VNĐ</Col>
            </Row>
            
            <Button type="primary" block onClick={openCreatePayoutFromCalc}>
              Tạo Lệnh Thanh Toán Cho Kỳ Này
            </Button>
          </div>
        )}
      </Modal>

      {/* Modal Tạo Lệnh Payout */}
      <Modal
        title="Tạo Lệnh Thanh Toán"
        open={isCreateModalOpen}
        onCancel={() => setIsCreateModalOpen(false)}
        footer={null}
        forceRender
      >
        <Alert title="Chỉ tạo lệnh khi bác sĩ đã hoàn thành khám. Khi thực chuyển tiền xong, vui lòng đánh dấu Đã Trả." type="info" showIcon className="mb-4" />
        <Form form={createForm} layout="vertical" onFinish={handleCreatePayout}>
          <Form.Item name="doctor_id" label="Bác sĩ nhận lương" rules={[{ required: true }]}>
            <Select showSearch placeholder="Chọn bác sĩ..." options={doctors.map(d => ({
              value: d.doctor_id,
              label: `${d.last_name} ${d.first_name}`
            }))} />
          </Form.Item>
          
          <Form.Item name="amount" label="Số tiền thanh toán (VNĐ)" rules={[{ required: true }]}>
            <InputNumber className="w-full" min={0} step={100000} formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
          </Form.Item>

          <Form.Item name="period" label="Kỳ lương (Từ ngày - Đến ngày)" rules={[{ required: true }]}>
            <RangePicker className="w-full" format="DD/MM/YYYY" />
          </Form.Item>

          <Form.Item name="payout_date" label="Ngày chuyển tiền dự kiến" rules={[{ required: true }]}>
            <DatePicker className="w-full" format="DD/MM/YYYY" />
          </Form.Item>

          <Form.Item name="notes" label="Ghi chú">
            <Input.TextArea rows={2} placeholder="Ví dụ: Lương tháng 5/2026..." />
          </Form.Item>

          <div className="flex justify-end gap-2 mt-4">
            <Button onClick={() => setIsCreateModalOpen(false)}>Hủy</Button>
            <Button type="primary" htmlType="submit">Tạo lệnh</Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
