"use client";

import React, { useEffect, useState } from 'react';
import { Table, Tag, Typography, Badge, message, Button, Modal, Form, Input, Select, Space } from 'antd';
import { CustomerServiceOutlined, PlusOutlined, SyncOutlined } from '@ant-design/icons';
import { notificationApi, SupportRequest } from '@/api/notification';
import dayjs from 'dayjs';

const { Text } = Typography;
const { TextArea } = Input;

export default function PatientSupport() {
  const [requests, setRequests] = useState<SupportRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [isMounted, setIsMounted] = useState(false);
  
  // Actually, we don't need patient_id in payload, wait let's check backend payload `patient_id` is required in SupportRequestCreate.
  // Wait, `authApi.getMe()` returns the `account_id` which acts as `patient_id` in this context.
  const [patientId, setPatientId] = useState<string | null>(null);

  const fetchRequests = async () => {
    // Do hạn chế của backend, bệnh nhân không có endpoint để tải danh sách yêu cầu hỗ trợ (yêu cầu quyền ADMIN).
    // Chúng ta sẽ bỏ qua gọi API để tránh lỗi 403 Forbidden.
    setRequests([]);
  };

  useEffect(() => {
    setIsMounted(true);
    const pId = localStorage.getItem('account_id'); // From login
    setPatientId(pId);
    fetchRequests();
  }, []);

  const handleCreate = async (values: any) => {
    try {
      if (!patientId) {
        message.error('Lỗi định danh người dùng');
        return;
      }
      const payload = {
        patient_id: patientId,
        request_type: values.request_type,
        title: values.title,
        content: values.content,
        priority: values.priority || 'NORMAL'
      };
      // Note: We need to cast it since API expects NotificationCreate. Actually support request API takes SupportRequestCreate.
      const newRequest = await notificationApi.createSupportRequest(payload as any);
      message.success('Đã gửi yêu cầu hỗ trợ thành công. Vui lòng theo dõi email hoặc mục thông báo.');
      setIsModalOpen(false);
      form.resetFields();
      setRequests(prev => [newRequest, ...prev]);
    } catch (error) {
      message.error('Không thể gửi yêu cầu hỗ trợ');
    }
  };

  const columns = [
    {
      title: 'Vấn đề',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: SupportRequest) => (
        <div>
          <div className="font-semibold text-gray-800">{text}</div>
          <div className="text-xs text-gray-400 mt-1 truncate max-w-[200px]">{record.content}</div>
        </div>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (s: string) => {
        const colors: any = { OPEN: 'warning', IN_PROGRESS: 'processing', RESOLVED: 'success', CLOSED: 'default' };
        const text: any = { OPEN: 'Đang mở', IN_PROGRESS: 'Đang xử lý', RESOLVED: 'Đã giải quyết', CLOSED: 'Đã đóng' };
        return <Badge status={colors[s]} text={text[s]} />;
      },
    },
    {
      title: 'Ngày gửi',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => <span className="text-sm text-gray-500">{dayjs(date).format('DD/MM/YYYY HH:mm')}</span>,
    },
  ];

  if (!isMounted) return null;

  return (
    <div className="space-y-4 pt-4">
      <div className="flex justify-between items-center mb-4">
        <Text className="text-gray-600">Gửi và theo dõi các yêu cầu hỗ trợ, thắc mắc tới phòng khám.</Text>
        <Space>
          <Button icon={<SyncOutlined />} onClick={fetchRequests} loading={loading} />
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>
            Gửi Yêu Cầu
          </Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={requests}
        rowKey="request_id"
        loading={loading}
        pagination={{ pageSize: 5 }}
        className="custom-table"
        locale={{ 
          emptyText: "Lịch sử yêu cầu hỗ trợ chỉ khả dụng cho Quản trị viên. Các yêu cầu mới tạo trong phiên này sẽ hiển thị ở đây. Phản hồi sẽ được gửi qua mục thông báo hoặc email."
        }}
      />

      <Modal
        title="Gửi Yêu Cầu Hỗ Trợ"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate} initialValues={{ priority: 'NORMAL' }}>
          <Form.Item name="request_type" label="Chủ đề / Phân loại" rules={[{ required: true }]}>
            <Select placeholder="Chọn chủ đề" options={[
              { label: 'Vấn đề Đặt lịch / Cuộc hẹn', value: 'APPOINTMENT' },
              { label: 'Vấn đề Thanh toán / Hóa đơn', value: 'PAYMENT' },
              { label: 'Vấn đề Lỗi kỹ thuật', value: 'TECHNICAL' },
              { label: 'Hỏi đáp & Góp ý khác', value: 'OTHER' },
            ]} />
          </Form.Item>
          <Form.Item name="title" label="Tiêu đề tóm tắt" rules={[{ required: true }]}>
            <Input placeholder="Ví dụ: Không thể đặt lịch khám vào ngày mai" />
          </Form.Item>
          <Form.Item name="content" label="Nội dung chi tiết" rules={[{ required: true }]}>
            <TextArea rows={4} placeholder="Mô tả chi tiết vấn đề bạn đang gặp phải..." />
          </Form.Item>
          <Form.Item name="priority" label="Mức độ ưu tiên">
            <Select options={[
              { label: 'Bình thường', value: 'NORMAL' },
              { label: 'Cao (Cần hỗ trợ sớm)', value: 'HIGH' },
              { label: 'Khẩn cấp', value: 'URGENT' },
            ]} />
          </Form.Item>
          <Form.Item className="mt-4 mb-0 text-right">
            <Space>
              <Button onClick={() => setIsModalOpen(false)}>Hủy</Button>
              <Button type="primary" htmlType="submit">Gửi yêu cầu</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
