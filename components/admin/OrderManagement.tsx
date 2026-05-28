"use client";

import React, { useEffect, useState } from 'react';
import {
  Card,
  Table,
  Button,
  Tag,
  Space,
  Typography,
  App,
  Tooltip
} from 'antd';
import {
  ShoppingCartOutlined,
  SyncOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  HourglassOutlined,
  ClearOutlined
} from '@ant-design/icons';
import { orderApi, Order } from '@/api/order';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;

export default function OrderManagement() {
  const { message } = App.useApp();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [cleanupLoading, setCleanupLoading] = useState(false);

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await orderApi.listOrders();
      setOrders(data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
    } catch (error) {
      message.error('Lỗi khi tải danh sách đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isMounted) {
      fetchOrders();
    }
  }, [isMounted]);

  const handleCleanup = async () => {
    setCleanupLoading(true);
    try {
      const res = await orderApi.checkExpiredOrders();
      message.success(res.message);
      fetchOrders();
    } catch (error) {
      message.error('Không thể dọn dẹp đơn hàng hết hạn');
    } finally {
      setCleanupLoading(false);
    }
  };

  const columns = [
    {
      title: 'Mã Đơn Hàng',
      dataIndex: 'order_id',
      key: 'order_id',
      render: (id: string) => <span className="font-mono text-xs text-gray-500">{id}</span>,
    },
    {
      title: 'Loại Đơn',
      dataIndex: 'order_type',
      key: 'order_type',
      render: (type: string) => (
        <Tag color={type === 'BHYT_EXTENSION' ? 'purple' : 'orange'}>
          {type === 'BHYT_EXTENSION' ? 'Gia hạn BHYT' : 'Mua thuốc online'}
        </Tag>
      ),
    },
    {
      title: 'Giá Trị',
      dataIndex: 'total_amount',
      key: 'total_amount',
      render: (amount: number) => <span className="font-bold text-gray-800">{amount.toLocaleString('vi-VN')} đ</span>,
    },
    {
      title: 'Trạng Thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        let color = 'default';
        let icon = null;
        if (status === 'PENDING') { color = 'orange'; icon = <HourglassOutlined />; }
        if (status === 'PAID') { color = 'success'; icon = <CheckCircleOutlined />; }
        if (status === 'CANCELLED') { color = 'error'; icon = <CloseCircleOutlined />; }
        return <Tag color={color} icon={icon}>{status}</Tag>;
      },
    },
    {
      title: 'Ngày Tạo',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (dateStr: string) => dayjs(dateStr).format('DD/MM/YYYY HH:mm'),
    },
    {
      title: 'Hạn Thanh Toán',
      dataIndex: 'expires_at',
      key: 'expires_at',
      render: (dateStr: string, record: Order) => (
        record.status === 'PENDING' ? (
          <span className="text-red-500 font-medium">
            {dayjs(dateStr).format('DD/MM/YYYY HH:mm')}
          </span>
        ) : (
          <span className="text-gray-400">---</span>
        )
      ),
    },
  ];

  if (!isMounted) return null;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-orange-600 via-rose-500 to-red-600 p-8 text-white shadow-xl">
        <div className="relative z-10">
          <Space align="center" className="mb-2">
            <ShoppingCartOutlined className="text-3xl text-orange-100" />
            <span className="bg-white/20 text-white border border-white/30 text-xs px-3 py-1 rounded-full font-medium tracking-wide uppercase">
              Bán Hàng
            </span>
          </Space>
          <Title level={2} style={{ color: '#fff', margin: '4px 0 12px 0', fontWeight: 700 }}>
            Quản lý Đơn Hàng (BHYT & Thuốc)
          </Title>
          <Paragraph className="text-rose-50/90 text-base max-w-3xl mb-0 leading-relaxed">
            Xem và xử lý các đơn hàng gia hạn thẻ bảo hiểm y tế hoặc đơn thuốc trực tuyến của bệnh nhân.
          </Paragraph>
        </div>
      </div>

      {/* Main Table */}
      <Card className="shadow-sm rounded-xl border border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-100 mb-6">
          <Title level={4} style={{ margin: 0, fontWeight: 700 }} className="text-gray-800">
            Danh Sách Đơn Hàng Trực Tuyến
          </Title>
          <Space>
            <Button icon={<ClearOutlined />} onClick={handleCleanup} loading={cleanupLoading}>
              Dọn Dẹp Đơn Hết Hạn
            </Button>
            <Button icon={<SyncOutlined />} onClick={fetchOrders} loading={loading}>
              Làm mới
            </Button>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={orders}
          rowKey="order_id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          className="custom-table"
        />
      </Card>
    </div>
  );
}
