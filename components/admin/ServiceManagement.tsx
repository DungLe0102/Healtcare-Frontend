"use client";

import React, { useEffect, useState } from 'react';
import {
  Card,
  Table,
  Button,
  Tag,
  Space,
  Input,
  Switch,
  Typography,
  Form,
  App,
  Modal,
  InputNumber,
  Badge,
  Empty,
  Tooltip
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  MedicineBoxOutlined,
  PlusOutlined,
  EditOutlined,
  StopOutlined
} from '@ant-design/icons';
import { clinicalServiceApi, ClinicalService, ClinicalServiceCreate } from '@/api/clinical_service';

const { Title, Text, Paragraph } = Typography;

const getErrorMessage = (error: any, defaultMsg = 'Thao tác thất bại') => {
  const detail = error?.response?.data?.detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) return detail.map((e: any) => e.msg).join(', ') || defaultMsg;
  return defaultMsg;
};

export default function ServiceManagement() {
  const { message } = App.useApp();
  const [services, setServices] = useState<ClinicalService[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [activeOnly, setActiveOnly] = useState(true);
  const [bhytOnly, setBhytOnly] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<ClinicalService | null>(null);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) fetchServices();
  }, [activeOnly, bhytOnly, isMounted]);

  const fetchServices = async (searchVal = search) => {
    setLoading(true);
    try {
      const data = await clinicalServiceApi.listServices(activeOnly, bhytOnly, searchVal);
      setServices(data);
    } catch (error) {
      message.error('Lỗi khi tải danh sách dịch vụ');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      fetchServices();
    }
  };

  const handleSearchClearOrChange = (val: string) => {
    setSearch(val);
    if (val === '') {
      fetchServices('');
    }
  };

  const handleOpenModal = () => {
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleCreate = async (values: any) => {
    try {
      const finalServiceCode = values.service_code?.trim() || `SV${Math.floor(Date.now() / 1000)}`;
      const payload: ClinicalServiceCreate = {
        service_code: finalServiceCode,
        service_name: values.service_name,
        price: values.price,
        is_bhyt_covered: values.is_bhyt_covered || false,
      };
      await clinicalServiceApi.createService(payload);
      message.success('Thêm dịch vụ mới thành công');
      setIsModalOpen(false);
      fetchServices();
    } catch (error: any) {
      message.error(getErrorMessage(error, 'Thêm dịch vụ thất bại'));
    }
  };

  const handleOpenEditModal = (record: ClinicalService) => {
    setEditingService(record);
    editForm.setFieldsValue({
      service_code: record.service_code, // will be disabled
      service_name: record.service_name,
      price: record.price,
      is_bhyt_covered: record.is_bhyt_covered,
    });
    setIsEditModalOpen(true);
  };

  const handleUpdate = async (values: any) => {
    if (!editingService) return;
    try {
      await clinicalServiceApi.updateService(editingService.service_id, {
        service_name: values.service_name,
        price: values.price,
        is_bhyt_covered: values.is_bhyt_covered,
      });
      message.success('Cập nhật dịch vụ thành công');
      setIsEditModalOpen(false);
      fetchServices();
    } catch (error: any) {
      message.error(getErrorMessage(error, 'Cập nhật thất bại'));
    }
  };

  const handleToggleStatus = async (record: ClinicalService) => {
    try {
      if (record.is_active) {
        await clinicalServiceApi.deactivateService(record.service_id);
        message.success(`Đã vô hiệu hóa dịch vụ ${record.service_name}`);
      } else {
        await clinicalServiceApi.reactivateService(record.service_id);
        message.success(`Đã kích hoạt lại dịch vụ ${record.service_name}`);
      }
      fetchServices();
    } catch (error: any) {
      message.error(getErrorMessage(error, 'Thao tác thất bại'));
    }
  };

  const columns = [
    {
      title: 'STT',
      key: 'index',
      width: 80,
      align: 'center' as const,
      render: (_: any, __: any, index: number) => index + 1,
    },
    {
      title: 'Mã dịch vụ',
      dataIndex: 'service_code',
      key: 'service_code',
      width: 150,
      render: (code: string) => (
        <Badge
          count={code}
          style={{
            backgroundColor: '#e6f7ff',
            color: '#1890ff',
            border: '1px solid #91d5ff',
            fontWeight: '600',
            fontSize: '12px'
          }}
        />
      ),
    },
    {
      title: 'Tên Dịch Vụ',
      dataIndex: 'service_name',
      key: 'service_name',
      render: (name: string) => <span className="font-semibold text-gray-800">{name}</span>,
    },
    {
      title: 'Giá (VNĐ)',
      dataIndex: 'price',
      key: 'price',
      render: (price: number) => (
        <span className="font-medium text-orange-600">
          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)}
        </span>
      ),
    },
    {
      title: 'BHYT Thanh toán',
      dataIndex: 'is_bhyt_covered',
      key: 'is_bhyt_covered',
      align: 'center' as const,
      render: (is_bhyt_covered: boolean) => (
        <Tag color={is_bhyt_covered ? 'blue' : 'default'} style={{ padding: '4px 12px', borderRadius: '4px' }}>
          {is_bhyt_covered ? 'Có BHYT' : 'Không'}
        </Tag>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 160,
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'success' : 'default'} style={{ padding: '4px 12px', borderRadius: '4px', fontSize: '13px' }}>
          <Space>
            {isActive ? <CheckCircleOutlined /> : <ExclamationCircleOutlined />}
            {isActive ? 'Đang hoạt động' : 'Tạm ngưng'}
          </Space>
        </Tag>
      ),
    },
    {
      title: 'Hành động',
      key: 'actions',
      render: (_: any, record: ClinicalService) => (
        <Space size="middle">
          <Tooltip title="Sửa dịch vụ">
            <Button icon={<EditOutlined />} onClick={() => handleOpenEditModal(record)} size="small" />
          </Tooltip>
          <Tooltip title={record.is_active ? "Ngừng cung cấp" : "Khôi phục"}>
            <Button 
              icon={record.is_active ? <StopOutlined /> : <CheckCircleOutlined />} 
              onClick={() => handleToggleStatus(record)}
              danger={record.is_active}
              size="small"
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  if (!isMounted) return null;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Dynamic Glassmorphism Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-teal-600 via-teal-500 to-emerald-600 p-8 text-white shadow-xl">
        <div className="relative z-10">
          <Space align="center" className="mb-2">
            <MedicineBoxOutlined className="text-3xl text-teal-100" />
            <span className="bg-white/20 text-white border border-white/30 text-xs px-3 py-1 rounded-full font-medium tracking-wide uppercase">
              Danh Mục Dịch Vụ
            </span>
          </Space>
          <Title level={2} style={{ color: '#fff', margin: '4px 0 12px 0', fontWeight: 700 }}>
            Quản lý Dịch vụ Khám Chữa Bệnh
          </Title>
          <Paragraph className="text-teal-50/90 text-base max-w-3xl mb-0 leading-relaxed">
            Xem và quản lý danh mục dịch vụ, thiết lập giá và chế độ thanh toán BHYT cho các dịch vụ.
          </Paragraph>
        </div>
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-y-1/4 translate-x-1/4 scale-150">
          <MedicineBoxOutlined style={{ fontSize: '240px' }} />
        </div>
      </div>

      <Card className="shadow-sm rounded-xl border border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-100 mb-6">
          <div>
            <Title level={4} style={{ margin: 0, fontWeight: 700 }} className="text-gray-800">
              Danh Sách Dịch Vụ
            </Title>
          </div>

          {/* Filters & Actions */}
          <div className="flex flex-wrap items-center gap-4">
            <Input
              placeholder="Tìm theo tên hoặc mã..."
              prefix={<SearchOutlined className="text-gray-400" />}
              value={search}
              onChange={(e) => handleSearchClearOrChange(e.target.value)}
              onKeyDown={handleSearch}
              className="w-full md:w-64 rounded-lg"
              allowClear
            />
            
            <div className="hidden md:block w-px h-6 bg-gray-200" />

            <Space>
              <Text className="text-sm text-gray-500">Chỉ hoạt động:</Text>
              <Switch
                checked={activeOnly}
                onChange={(checked) => setActiveOnly(checked)}
              />
            </Space>
            
            <Space>
              <Text className="text-sm text-gray-500">Chỉ BHYT:</Text>
              <Switch
                checked={bhytOnly}
                onChange={(checked) => setBhytOnly(checked)}
              />
            </Space>

            <Tooltip title="Làm mới dữ liệu">
              <Button
                icon={<ReloadOutlined />}
                onClick={() => fetchServices()}
                className="flex items-center justify-center rounded-lg"
              />
            </Tooltip>
            
            <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenModal} className="rounded-lg">
              Thêm dịch vụ
            </Button>
          </div>
        </div>

        {/* Data Table */}
        <Table
          columns={columns}
          dataSource={services}
          rowKey="service_id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showTotal: (total, range) => `Hiển thị ${range[0]}-${range[1]} trong tổng số ${total} dịch vụ`,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50']
          }}
          className="custom-table"
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={<span className="text-gray-500">Chưa có dịch vụ nào.</span>}
              />
            )
          }}
        />
      </Card>

      {/* Create Modal */}
      <Modal
        title="Thêm Dịch Vụ Mới"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        forceRender
      >
        <Form form={form} layout="vertical" onFinish={handleCreate} initialValues={{ is_bhyt_covered: false }}>
          <Form.Item 
            name="service_name" 
            label="Tên Dịch Vụ" 
            rules={[{ required: true, message: 'Vui lòng nhập tên dịch vụ' }]}
          >
            <Input placeholder="VD: Siêu âm ổ bụng tổng quát" />
          </Form.Item>
          <Form.Item 
            name="price" 
            label="Giá Dịch Vụ (VNĐ)" 
            rules={[{ required: true, message: 'Vui lòng nhập giá dịch vụ' }]}
          >
            <InputNumber 
              className="w-full"
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => value!.replace(/\$\s?|(,*)/g, '') as any}
              min={0}
            />
          </Form.Item>
          <Form.Item name="is_bhyt_covered" label="Được BHYT thanh toán" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item className="mt-4 mb-0 text-right">
            <Space>
              <Button onClick={() => setIsModalOpen(false)}>Hủy</Button>
              <Button type="primary" htmlType="submit">Lưu thông tin</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        title="Cập Nhật Dịch Vụ"
        open={isEditModalOpen}
        onCancel={() => setIsEditModalOpen(false)}
        footer={null}
        forceRender
      >
        <Form form={editForm} layout="vertical" onFinish={handleUpdate}>
          <Form.Item 
            name="service_code" 
            label="Mã Dịch Vụ" 
          >
            <Input disabled className="bg-gray-50 text-gray-500 font-semibold" />
          </Form.Item>
          <Form.Item 
            name="service_name" 
            label="Tên Dịch Vụ" 
            rules={[{ required: true, message: 'Vui lòng nhập tên dịch vụ' }]}
          >
            <Input placeholder="VD: Siêu âm ổ bụng tổng quát" />
          </Form.Item>
          <Form.Item 
            name="price" 
            label="Giá Dịch Vụ (VNĐ)" 
            rules={[{ required: true, message: 'Vui lòng nhập giá dịch vụ' }]}
          >
            <InputNumber 
              className="w-full"
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => value!.replace(/\$\s?|(,*)/g, '') as any}
              min={0}
            />
          </Form.Item>
          <Form.Item name="is_bhyt_covered" label="Được BHYT thanh toán" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item className="mt-4 mb-0 text-right">
            <Space>
              <Button onClick={() => setIsEditModalOpen(false)}>Hủy</Button>
              <Button type="primary" htmlType="submit">Cập nhật</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
