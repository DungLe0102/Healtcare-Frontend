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
  DatePicker,
  Input,
  Row,
  Col
} from 'antd';
import {
  SafetyOutlined,
  SearchOutlined,
  SyncOutlined,
  ClearOutlined
} from '@ant-design/icons';
import { auditApi, AuditLog, AuditLogQuery } from '@/api/audit';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { RangePicker } = DatePicker;

export default function AuditManagement() {
  const { message } = App.useApp();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const fetchLogs = async (values: any = {}) => {
    setLoading(true);
    try {
      const query: AuditLogQuery = {
        skip: 0,
        limit: 100,
      };

      if (values.actor_id) query.actor_id = values.actor_id;
      if (values.target_table) query.target_table = values.target_table;
      if (values.action_type) query.action_type = values.action_type;
      if (values.dates && values.dates[0] && values.dates[1]) {
        query.from_dt = values.dates[0].startOf('day').toISOString();
        query.to_dt = values.dates[1].endOf('day').toISOString();
      }

      const data = await auditApi.listLogs(query);
      setLogs(data);
    } catch (error) {
      message.error('Lỗi khi tải nhật ký hệ thống');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isMounted) {
      fetchLogs();
    }
  }, [isMounted]);

  const handleSearch = (values: any) => {
    fetchLogs(values);
  };

  const handleReset = () => {
    form.resetFields();
    fetchLogs();
  };

  const columns = [
    {
      title: 'Thời Gian',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (dateStr: string) => (
        <span className="text-gray-500 font-medium">
          {dayjs(dateStr).format('DD/MM/YYYY HH:mm:ss')}
        </span>
      ),
    },
    {
      title: 'Tác Nhân (Actor)',
      dataIndex: 'actor_id',
      key: 'actor_id',
      render: (actorId: string, record: AuditLog) => (
        <div>
          <span className="text-xs text-gray-400 block font-mono">{actorId.substring(0, 8).toUpperCase()}...</span>
          <Tag color={record.actor_role === 'ADMIN' ? 'red' : 'blue'}>{record.actor_role}</Tag>
        </div>
      ),
    },
    {
      title: 'Hành Động',
      dataIndex: 'action_type',
      key: 'action_type',
      render: (action: string) => {
        const colors: any = {
          CREATE: 'green',
          UPDATE: 'blue',
          DELETE: 'red',
          READ: 'orange',
        };
        return (
          <Tag color={colors[action] || 'default'} className="font-bold">
            {action}
          </Tag>
        );
      },
    },
    {
      title: 'Bảng Tác Động',
      dataIndex: 'target_table',
      key: 'target_table',
      render: (table: string) => <Tag color="purple">{table}</Tag>,
    },
    {
      title: 'ID Bản Ghi',
      dataIndex: 'target_record_id',
      key: 'target_record_id',
      render: (id: string) => <span className="font-mono text-xs text-gray-500">{id}</span>,
    },
    {
      title: 'IP Address',
      dataIndex: 'ip_address',
      key: 'ip_address',
      render: (ip: string) => <span className="text-sm text-gray-600">{ip || 'N/A'}</span>,
    },
  ];

  if (!isMounted) return null;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-800 via-slate-700 to-slate-900 p-8 text-white shadow-xl">
        <div className="relative z-10">
          <Space align="center" className="mb-2">
            <SafetyOutlined className="text-3xl text-slate-100" />
            <span className="bg-white/20 text-white border border-white/30 text-xs px-3 py-1 rounded-full font-medium tracking-wide uppercase">
              Bảo Mật & Giám Sát
            </span>
          </Space>
          <Title level={2} style={{ color: '#fff', margin: '4px 0 12px 0', fontWeight: 700 }}>
            Nhật Ký Hoạt Động (Audit Logs)
          </Title>
          <Paragraph className="text-slate-200/90 text-base max-w-3xl mb-0 leading-relaxed">
            Giám sát các thao tác chỉnh sửa dữ liệu, theo dõi lịch sử truy cập hệ thống để đảm bảo tính an toàn dữ liệu và tuân thủ quy trình kiểm toán.
          </Paragraph>
        </div>
      </div>

      {/* Filter Section */}
      <Card className="shadow-sm rounded-xl border border-gray-100 p-4">
        <Form form={form} layout="vertical" onFinish={handleSearch}>
          <Row gutter={[16, 8]}>
            <Col xs={24} md={6}>
              <Form.Item name="actor_id" label="Actor UUID">
                <Input placeholder="Nhập UUID của tác nhân..." allowClear />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item name="target_table" label="Bảng tác động">
                <Select placeholder="Chọn bảng" allowClear options={[
                  { label: 'medications', value: 'medications' },
                  { label: 'inventory', value: 'inventory' },
                  { label: 'prescriptions', value: 'prescriptions' },
                  { label: 'clinical_services', value: 'clinical_services' },
                  { label: 'appointments', value: 'appointments' },
                  { label: 'billing', value: 'billing' },
                  { label: 'support_requests', value: 'support_requests' },
                ]} />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item name="action_type" label="Loại Hành Động">
                <Select placeholder="Chọn hành động" allowClear options={[
                  { label: 'CREATE', value: 'CREATE' },
                  { label: 'UPDATE', value: 'UPDATE' },
                  { label: 'DELETE', value: 'DELETE' },
                  { label: 'READ', value: 'READ' },
                ]} />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item name="dates" label="Khoảng Thời Gian">
                <RangePicker className="w-full" format="DD/MM/YYYY" placeholder={['Từ ngày', 'Đến ngày']} />
              </Form.Item>
            </Col>
          </Row>
          <div className="flex justify-end gap-2 mt-2">
            <Button icon={<ClearOutlined />} onClick={handleReset}>
              Reset
            </Button>
            <Button type="primary" htmlType="submit" icon={<SearchOutlined />} className="bg-slate-700 hover:bg-slate-600 border-slate-700">
              Lọc Nhật Ký
            </Button>
          </div>
        </Form>
      </Card>

      {/* Main Table */}
      <Card className="shadow-sm rounded-xl border border-gray-100">
        <div className="flex justify-between items-center pb-4 border-b border-gray-100 mb-6">
          <Title level={4} style={{ margin: 0, fontWeight: 700 }} className="text-gray-800">
            Lịch Sử Audit Trail (Tối đa 100 dòng gần nhất)
          </Title>
          <Button icon={<SyncOutlined />} onClick={() => fetchLogs(form.getFieldsValue())} loading={loading}>
            Làm mới
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={logs}
          rowKey="log_id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showTotal: (total, range) => `Hiển thị ${range[0]}-${range[1]} trong số ${total} bản ghi`,
          }}
          className="custom-table"
        />
      </Card>
    </div>
  );
}
