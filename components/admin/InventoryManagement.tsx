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
  InputNumber,
  Input,
  DatePicker,
  Tooltip,
  Row,
  Col,
  Statistic
} from 'antd';
import {
  PlusOutlined,
  WarningOutlined,
  DatabaseOutlined,
  HistoryOutlined,
  SearchOutlined
} from '@ant-design/icons';
import { inventoryApi, InventoryBatch, InventoryCreate, Medication } from '@/api/inventory';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

const getErrorMessage = (error: any, defaultMsg = 'Thao tác thất bại') => {
  const detail = error?.response?.data?.detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) return detail.map((e: any) => e.msg).join(', ') || defaultMsg;
  return defaultMsg;
};

export default function InventoryManagement() {
  const { message } = App.useApp();
  const [batches, setBatches] = useState<InventoryBatch[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [selectedMedication, setSelectedMedication] = useState<string | undefined>(undefined);
  const [viewExpiring, setViewExpiring] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) fetchMedications();
  }, [isMounted]);

  useEffect(() => {
    if (isMounted) fetchInventory();
  }, [selectedMedication, viewExpiring, isMounted]);

  const fetchMedications = async () => {
    try {
      const data = await inventoryApi.listMedications();
      setMedications(data);
    } catch (error) {
      message.error('Lỗi tải danh mục thuốc');
    }
  };

  const fetchInventory = async () => {
    setLoading(true);
    try {
      let data: InventoryBatch[] = [];
      if (viewExpiring) {
        data = await inventoryApi.getExpiringSoon(30);
      } else {
        data = await inventoryApi.listInventory(selectedMedication);
      }
      setBatches(data);
    } catch (error) {
      message.error('Lỗi khi tải danh sách lô thuốc');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = () => {
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleCreate = async (values: any) => {
    try {
      const payload: InventoryCreate = {
        medication_id: values.medication_id,
        batch_number: values.batch_number,
        quantity: values.quantity,
        expiration_date: values.expiration_date.format('YYYY-MM-DD'),
      };
      await inventoryApi.addInventoryBatch(payload);
      message.success('Nhập lô thuốc mới thành công');
      setIsModalOpen(false);
      fetchInventory();
    } catch (error: any) {
      message.error(getErrorMessage(error, 'Nhập kho thất bại'));
    }
  };

  const getMedicationName = (id: string) => {
    return medications.find(m => m.medication_id === id)?.med_name || 'Không xác định';
  };
  
  const getMedicationUnit = (id: string) => {
    return medications.find(m => m.medication_id === id)?.unit || '';
  };

  const isExpiringSoon = (dateStr: string) => {
    const days = dayjs(dateStr).diff(dayjs(), 'day');
    return days <= 30 && days >= 0;
  };

  const isExpired = (dateStr: string) => {
    return dayjs(dateStr).isBefore(dayjs(), 'day');
  };

  const columns = [
    {
      title: 'Tên Thuốc',
      dataIndex: 'medication_id',
      key: 'medication_id',
      render: (id: string) => <span className="font-semibold text-gray-800">{getMedicationName(id)}</span>,
    },
    {
      title: 'Số Lô',
      dataIndex: 'batch_number',
      key: 'batch_number',
      render: (batch: string) => <Tag color="blue">{batch}</Tag>,
    },
    {
      title: 'Số Lượng',
      key: 'quantity',
      render: (_: any, record: InventoryBatch) => (
        <span className="font-medium">
          {record.quantity} {getMedicationUnit(record.medication_id)}
        </span>
      ),
    },
    {
      title: 'Ngày Hết Hạn',
      dataIndex: 'expiration_date',
      key: 'expiration_date',
      render: (dateStr: string) => {
        let color = 'default';
        let icon = null;
        if (isExpired(dateStr)) {
          color = 'red';
          icon = <WarningOutlined />;
        } else if (isExpiringSoon(dateStr)) {
          color = 'warning';
          icon = <HistoryOutlined />;
        } else {
          color = 'success';
        }

        return (
          <Tag color={color} icon={icon} style={{ padding: '4px 8px', fontSize: '13px' }}>
            {dayjs(dateStr).format('DD/MM/YYYY')}
            {isExpired(dateStr) && ' (Đã hết hạn)'}
            {isExpiringSoon(dateStr) && ` (Còn ${dayjs(dateStr).diff(dayjs(), 'day')} ngày)`}
          </Tag>
        );
      },
    },
    {
      title: 'Ngày Nhập',
      dataIndex: 'updated_at',
      key: 'updated_at',
      render: (dateStr: string) => <span className="text-gray-500 text-sm">{dayjs(dateStr).format('DD/MM/YYYY HH:mm')}</span>,
    },
  ];

  const totalStock = batches.reduce((acc, curr) => acc + curr.quantity, 0);

  if (!isMounted) return null;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-orange-500 via-red-500 to-pink-600 p-8 text-white shadow-xl">
        <div className="relative z-10">
          <Space align="center" className="mb-2">
            <DatabaseOutlined className="text-3xl text-orange-100" />
            <span className="bg-white/20 text-white border border-white/30 text-xs px-3 py-1 rounded-full font-medium tracking-wide uppercase">
              Lô Thuốc
            </span>
          </Space>
          <Title level={2} style={{ color: '#fff', margin: '4px 0 12px 0', fontWeight: 700 }}>
            Quản lý Kho Tồn
          </Title>
          <Paragraph className="text-red-50/90 text-base max-w-3xl mb-0 leading-relaxed">
            Kiểm soát các lô thuốc, theo dõi số lượng tồn kho và phát hiện sớm các lô sắp hết hạn.
          </Paragraph>
        </div>
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-y-1/4 translate-x-1/4 scale-150">
          <DatabaseOutlined style={{ fontSize: '240px' }} />
        </div>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card className="rounded-xl shadow-sm border-gray-100">
            <Statistic 
              title="Tổng số lô hàng" 
              value={batches.length} 
              prefix={<DatabaseOutlined className="text-blue-500" />} 
            />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card className="rounded-xl shadow-sm border-gray-100">
            <Statistic 
              title="Tổng số lượng tồn (sản phẩm)" 
              value={totalStock} 
            />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card className="rounded-xl shadow-sm border-gray-100 bg-red-50 cursor-pointer hover:bg-red-100 transition-colors" onClick={() => setViewExpiring(!viewExpiring)}>
            <Statistic 
              title={<span className="text-red-600 font-medium">Sắp hết hạn (30 ngày)</span>} 
              value={viewExpiring ? "Đang xem" : "Bấm để xem"} 
              prefix={<WarningOutlined className="text-red-500" />} 
              styles={{ content: { color: viewExpiring ? '#cf1322' : '#8c8c8c', fontSize: '18px', marginTop: '8px' } }}
            />
          </Card>
        </Col>
      </Row>

      <Card className="shadow-sm rounded-xl border border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-100 mb-6">
          <div>
            <Title level={4} style={{ margin: 0, fontWeight: 700 }} className="text-gray-800">
              {viewExpiring ? 'Thuốc Sắp Hết Hạn' : 'Danh Sách Lô Thuốc'}
            </Title>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {!viewExpiring && (
              <Select
                showSearch
                placeholder="Lọc theo tên thuốc"
                allowClear
                style={{ width: 250 }}
                value={selectedMedication}
                onChange={(val) => setSelectedMedication(val)}
                optionFilterProp="children"
                filterOption={(input, option) =>
                  (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())
                }
                options={medications.map(m => ({ label: m.med_name, value: m.medication_id }))}
              />
            )}

            <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenModal} className="rounded-lg bg-orange-600 border-orange-600 hover:bg-orange-500">
              Nhập Lô Mới
            </Button>
          </div>
        </div>

        <Table
          columns={columns}
          dataSource={batches}
          rowKey="inventory_id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showTotal: (total, range) => `Hiển thị ${range[0]}-${range[1]} trong tổng số ${total} lô`,
          }}
          className="custom-table"
        />
      </Card>

      {/* Create Modal */}
      <Modal
        title="Nhập Lô Thuốc Mới"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        forceRender
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item 
            name="medication_id" 
            label="Loại Thuốc" 
            rules={[{ required: true, message: 'Vui lòng chọn thuốc' }]}
          >
            <Select 
              showSearch 
              placeholder="Chọn thuốc cần nhập"
              optionFilterProp="children"
              filterOption={(input, option) =>
                (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())
              }
              options={medications.filter(m => m.is_active).map(m => ({ label: m.med_name, value: m.medication_id }))}
            />
          </Form.Item>
          
          <div className="grid grid-cols-2 gap-4">
            <Form.Item 
              name="batch_number" 
              label="Số Lô" 
              rules={[{ required: true, message: 'Vui lòng nhập số lô' }]}
            >
              <Input placeholder="VD: LOT2026001" />
            </Form.Item>

            <Form.Item 
              name="quantity" 
              label="Số Lượng" 
              rules={[{ required: true, message: 'Vui lòng nhập số lượng' }]}
            >
              <InputNumber className="w-full" min={1} placeholder="VD: 100" />
            </Form.Item>
          </div>

          <Form.Item 
            name="expiration_date" 
            label="Ngày Hết Hạn" 
            rules={[{ required: true, message: 'Vui lòng chọn ngày hết hạn' }]}
          >
            <DatePicker 
              className="w-full" 
              format="DD/MM/YYYY" 
              placeholder="Chọn ngày" 
              disabledDate={(current) => current && current < dayjs().endOf('day')}
            />
          </Form.Item>

          <Form.Item className="mt-4 mb-0 text-right">
            <Space>
              <Button onClick={() => setIsModalOpen(false)}>Hủy</Button>
              <Button type="primary" htmlType="submit" className="bg-orange-600 hover:bg-orange-500">Xác nhận nhập kho</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
