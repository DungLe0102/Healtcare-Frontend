"use client";

import React, { useEffect, useState } from 'react';
import { Table, Tag, Typography, Badge, message, Button, Space } from 'antd';
import { BellOutlined, CheckCircleOutlined, ExclamationCircleOutlined, SyncOutlined } from '@ant-design/icons';
import { notificationApi, Notification } from '@/api/notification';
import dayjs from 'dayjs';

const { Text } = Typography;

export default function PatientNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const data = await notificationApi.listNotifications();
      setNotifications(data);
    } catch (error) {
      message.error('Không thể tải thông báo');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const columns = [
    {
      title: 'Tiêu đề',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: Notification) => (
        <div>
          <div className="font-semibold text-gray-800">{text || 'Thông báo hệ thống'}</div>
          <div className="text-sm text-gray-500 mt-1">{record.content}</div>
        </div>
      ),
    },
    {
      title: 'Phân loại',
      dataIndex: 'notification_type',
      key: 'notification_type',
      render: (type: string) => <Tag color="blue">{type}</Tag>,
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
        return <Tag color={color} icon={icon}>{status === 'SENT' ? 'Đã nhận' : status}</Tag>;
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
        <Text className="text-gray-600">Danh sách các thông báo từ phòng khám dành cho bạn.</Text>
        <Button icon={<SyncOutlined />} onClick={fetchNotifications} loading={loading}>Làm mới</Button>
      </div>
      <Table
        columns={columns}
        dataSource={notifications}
        rowKey="notification_id"
        loading={loading}
        pagination={{ pageSize: 5 }}
        className="custom-table"
      />
    </div>
  );
}
