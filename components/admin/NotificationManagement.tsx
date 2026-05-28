"use client";

import React, { useEffect, useState } from 'react';
import {
  Card,
  Table,
  Button,
  Tag,
  Space,
  Select,
  Typography,
  Form,
  App,
  Modal,
  Input,
  Tabs,
  Badge,
  Tooltip
} from 'antd';
import {
  BellOutlined,
  SendOutlined,
  CustomerServiceOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  SyncOutlined
} from '@ant-design/icons';
import { notificationApi, Notification, NotificationCreate, SupportRequest, SupportRequestUpdate } from '@/api/notification';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

export default function NotificationManagement() {
  const { message } = App.useApp();
  const [activeTab, setActiveTab] = useState('1');

  // Notifications State
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [notifForm] = Form.useForm();

  // Support Requests State
  const [supportRequests, setSupportRequests] = useState<SupportRequest[]>([]);
  const [supportLoading, setSupportLoading] = useState(false);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [selectedSupport, setSelectedSupport] = useState<SupportRequest | null>(null);
  const [supportForm] = Form.useForm();

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) {
      if (activeTab === '1') fetchNotifications();
      if (activeTab === '2') fetchSupportRequests();
    }
  }, [activeTab, isMounted]);

  const fetchNotifications = async () => {
    setNotifLoading(true);
    try {
      const data = await notificationApi.listNotifications();
      setNotifications(data);
    } catch (error) {
      message.error('Lỗi khi tải thông báo');
    } finally {
      setNotifLoading(false);
    }
  };

  const fetchSupportRequests = async () => {
    setSupportLoading(true);
    try {
      const data = await notificationApi.listSupportRequests();
      setSupportRequests(data);
    } catch (error) {
      message.error('Lỗi khi tải yêu cầu hỗ trợ');
    } finally {
      setSupportLoading(false);
    }
  };

  const handleSendNotification = async (values: any) => {
    try {
      const payload: NotificationCreate = {
        recipient_id: values.recipient_id,
        recipient_type: values.recipient_type,
        notification_type: values.notification_type || 'GENERAL',
        channel: values.channel,
        title: values.title,
        content: values.content,
      };
      await notificationApi.createNotification(payload);
      message.success('Đã đưa thông báo vào hàng đợi gửi');
      setIsSendModalOpen(false);
      notifForm.resetFields();
      fetchNotifications();
    } catch (error) {
      message.error('Gửi thông báo thất bại');
    }
  };

  const handleTriggerBhytAlerts = async () => {
    try {
      const res = await notificationApi.triggerBhytExpiryAlerts(30);
      message.success(res.detail);
      fetchNotifications();
    } catch (error) {
      message.error('Không thể quét BHYT');
    }
  };

  const handleMarkStatus = async (id: string, status: 'SENT' | 'FAILED') => {
    try {
      if (status === 'SENT') {
        await notificationApi.markNotificationSent(id);
      } else {
        await notificationApi.markNotificationFailed(id);
      }
      message.success(`Đã cập nhật trạng thái thành ${status}`);
      fetchNotifications();
    } catch (error) {
      message.error('Cập nhật trạng thái thất bại');
    }
  };

  const handleOpenSupportUpdate = (record: SupportRequest) => {
    setSelectedSupport(record);
    supportForm.setFieldsValue({
      status: record.status,
      priority: record.priority,
    });
    setIsSupportModalOpen(true);
  };

  const handleUpdateSupport = async (values: any) => {
    if (!selectedSupport) return;
    try {
      const payload: SupportRequestUpdate = {
        status: values.status,
        priority: values.priority,
        response_note: values.response_note,
      };
      await notificationApi.updateSupportRequest(selectedSupport.request_id, payload);
      message.success('Cập nhật trạng thái hỗ trợ thành công');
      setIsSupportModalOpen(false);
      fetchSupportRequests();
    } catch (error) {
      message.error('Cập nhật thất bại');
    }
  };

  const notifColumns = [
    {
      title: 'Tiêu đề',
      dataIndex: 'title',
      key: 'title',
      render: (text: string) => <span className="font-semibold">{text || 'Không có tiêu đề'}</span>,
    },
    {
      title: 'Loại thông báo',
      dataIndex: 'notification_type',
      key: 'notification_type',
      render: (type: string) => <Tag color="blue">{type}</Tag>,
    },
    {
      title: 'Kênh',
      dataIndex: 'channel',
      key: 'channel',
      render: (ch: string) => <Tag>{ch}</Tag>,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        let color = 'default';
        let icon = <SyncOutlined spin />;
        if (status === 'SENT') { color = 'success'; icon = <CheckCircleOutlined />; }
        if (status === 'FAILED') { color = 'error'; icon = <ExclamationCircleOutlined />; }
        return <Tag color={color} icon={icon}>{status}</Tag>;
      },
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => dayjs(date).format('DD/MM/YYYY HH:mm'),
    },
    {
      title: 'Hành động',
      key: 'actions',
      render: (_: any, record: Notification) => (
        record.status === 'PENDING' ? (
          <Space size="small">
            <Tooltip title="Mô phỏng: Đã gửi">
              <Button size="small" type="text" icon={<CheckCircleOutlined className="text-green-500" />} onClick={() => handleMarkStatus(record.notification_id, 'SENT')} />
            </Tooltip>
            <Tooltip title="Mô phỏng: Lỗi gửi">
              <Button size="small" type="text" icon={<ExclamationCircleOutlined className="text-red-500" />} onClick={() => handleMarkStatus(record.notification_id, 'FAILED')} />
            </Tooltip>
          </Space>
        ) : null
      ),
    },
  ];

  const supportColumns = [
    {
      title: 'Vấn đề',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: SupportRequest) => (
        <div>
          <div className="font-semibold text-gray-800">{text}</div>
          <div className="text-xs text-gray-400 truncate max-w-[200px]">{record.content}</div>
        </div>
      ),
    },
    {
      title: 'Phân loại',
      dataIndex: 'request_type',
      key: 'request_type',
      render: (type: string) => <Tag>{type}</Tag>,
    },
    {
      title: 'Mức độ',
      dataIndex: 'priority',
      key: 'priority',
      render: (p: string) => {
        const colors: any = { LOW: 'green', NORMAL: 'blue', HIGH: 'orange', URGENT: 'red' };
        return <Tag color={colors[p]}>{p}</Tag>;
      },
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (s: string) => {
        const colors: any = { OPEN: 'warning', IN_PROGRESS: 'processing', RESOLVED: 'success', CLOSED: 'default' };
        return <Badge status={colors[s]} text={s} />;
      },
    },
    {
      title: 'Ngày gửi',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => <span className="text-sm text-gray-500">{dayjs(date).format('DD/MM/YYYY')}</span>,
    },
    {
      title: 'Hành động',
      key: 'actions',
      render: (_: any, record: SupportRequest) => (
        <Button size="small" type="primary" ghost onClick={() => handleOpenSupportUpdate(record)}>
          Xử lý
        </Button>
      ),
    },
  ];

  if (!isMounted) return null;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-500 to-blue-600 p-8 text-white shadow-xl">
        <div className="relative z-10">
          <Space align="center" className="mb-2">
            <BellOutlined className="text-3xl text-purple-100" />
            <span className="bg-white/20 text-white border border-white/30 text-xs px-3 py-1 rounded-full font-medium tracking-wide uppercase">
              Giao Tiếp
            </span>
          </Space>
          <Title level={2} style={{ color: '#fff', margin: '4px 0 12px 0', fontWeight: 700 }}>
            Thông Báo & Hỗ Trợ
          </Title>
          <Paragraph className="text-blue-50/90 text-base max-w-3xl mb-0 leading-relaxed">
            Gửi thông báo đến bệnh nhân/bác sĩ và quản lý các yêu cầu hỗ trợ từ hệ thống.
          </Paragraph>
        </div>
      </div>

      <Card className="shadow-sm rounded-xl border border-gray-100">
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab} 
          tabBarExtraContent={
            activeTab === '1' && (
              <Space>
                <Button icon={<SyncOutlined />} onClick={handleTriggerBhytAlerts}>
                  Quét Hết Hạn BHYT
                </Button>
                <Button type="primary" icon={<SendOutlined />} onClick={() => setIsSendModalOpen(true)} className="bg-purple-600">
                  Gửi Thông Báo Mới
                </Button>
              </Space>
            )
          }
          items={[
            {
              key: '1',
              label: <span><BellOutlined />Danh Sách Thông Báo</span>,
              children: (
                <Table
                  columns={notifColumns}
                  dataSource={notifications}
                  rowKey="notification_id"
                  loading={notifLoading}
                  pagination={{ pageSize: 10 }}
                  className="custom-table mt-4"
                />
              )
            },
            {
              key: '2',
              label: <span><CustomerServiceOutlined />Yêu Cầu Hỗ Trợ (Tickets)</span>,
              children: (
                <Table
                  columns={supportColumns}
                  dataSource={supportRequests}
                  rowKey="request_id"
                  loading={supportLoading}
                  pagination={{ pageSize: 10 }}
                  className="custom-table mt-4"
                />
              )
            }
          ]}
        />
      </Card>

      {/* Send Notification Modal */}
      <Modal
        title="Tạo Thông Báo Mới"
        open={isSendModalOpen}
        onCancel={() => setIsSendModalOpen(false)}
        footer={null}
      >
        <Form form={notifForm} layout="vertical" onFinish={handleSendNotification} initialValues={{ channel: 'EMAIL', recipient_type: 'PATIENT' }}>
          <Form.Item name="recipient_id" label="UUID Người Nhận" rules={[{ required: true }]}>
            <Input placeholder="Nhập UUID của người dùng..." />
          </Form.Item>
          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="recipient_type" label="Loại Người Nhận">
              <Select options={[{ label: 'Bệnh Nhân', value: 'PATIENT' }, { label: 'Bác Sĩ', value: 'DOCTOR' }]} />
            </Form.Item>
            <Form.Item name="channel" label="Kênh Gửi">
              <Select options={[{ label: 'Email', value: 'EMAIL' }, { label: 'SMS', value: 'SMS' }, { label: 'In-App', value: 'PUSH' }]} />
            </Form.Item>
          </div>
          <Form.Item name="title" label="Tiêu Đề">
            <Input placeholder="Nhập tiêu đề thông báo..." />
          </Form.Item>
          <Form.Item name="content" label="Nội Dung">
            <TextArea rows={4} placeholder="Nhập nội dung chi tiết..." />
          </Form.Item>
          <Form.Item className="mt-4 mb-0 text-right">
            <Space>
              <Button onClick={() => setIsSendModalOpen(false)}>Hủy</Button>
              <Button type="primary" htmlType="submit">Gửi thông báo</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Update Support Request Modal */}
      <Modal
        title="Xử Lý Yêu Cầu Hỗ Trợ"
        open={isSupportModalOpen}
        onCancel={() => setIsSupportModalOpen(false)}
        footer={null}
      >
        {selectedSupport && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-100">
            <h4 className="font-semibold text-gray-800 mb-1">{selectedSupport.title}</h4>
            <p className="text-gray-600 text-sm mb-0">{selectedSupport.content}</p>
          </div>
        )}
        <Form form={supportForm} layout="vertical" onFinish={handleUpdateSupport}>
          <Form.Item name="status" label="Trạng thái xử lý">
            <Select options={[
              { label: 'Đang mở (OPEN)', value: 'OPEN' },
              { label: 'Đang xử lý (IN_PROGRESS)', value: 'IN_PROGRESS' },
              { label: 'Đã giải quyết (RESOLVED)', value: 'RESOLVED' },
              { label: 'Đã đóng (CLOSED)', value: 'CLOSED' },
            ]} />
          </Form.Item>
          <Form.Item name="priority" label="Mức độ ưu tiên">
            <Select options={[
              { label: 'Thấp', value: 'LOW' },
              { label: 'Bình thường', value: 'NORMAL' },
              { label: 'Cao', value: 'HIGH' },
              { label: 'Khẩn cấp', value: 'URGENT' },
            ]} />
          </Form.Item>
          <Form.Item name="response_note" label="Nội dung phản hồi (Gửi cho bệnh nhân)">
            <TextArea rows={3} placeholder="VD: Đã hỗ trợ đặt lại lịch khám. Lịch hẹn mới: 15/06/2026 09:00" />
          </Form.Item>
          <Form.Item className="mt-4 mb-0 text-right">
            <Space>
              <Button onClick={() => setIsSupportModalOpen(false)}>Hủy</Button>
              <Button type="primary" htmlType="submit">Cập nhật Ticket</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
