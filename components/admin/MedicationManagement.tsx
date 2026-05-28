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
import { inventoryApi, Medication, MedicationCreate, MedicationUpdate } from '@/api/inventory';

const { Title, Text, Paragraph } = Typography;

const getErrorMessage = (error: any, defaultMsg = 'Thao tác thất bại') => {
  const detail = error?.response?.data?.detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) return detail.map((e: any) => e.msg).join(', ') || defaultMsg;
  return defaultMsg;
};

export default function MedicationManagement() {
  const { message } = App.useApp();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [activeOnly, setActiveOnly] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingMedication, setEditingMedication] = useState<Medication | null>(null);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) fetchMedications();
  }, [activeOnly, isMounted]);

  const fetchMedications = async () => {
    setLoading(true);
    try {
      const data = await inventoryApi.listMedications(activeOnly);
      setMedications(data);
    } catch (error) {
      message.error('Lỗi khi tải danh sách thuốc');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      // API currently might not support search param directly, but let's implement local filtering or just refetch
      fetchMedications();
    }
  };

  const handleSearchClearOrChange = (val: string) => {
    setSearch(val);
    if (val === '') {
      fetchMedications();
    }
  };

  const filteredMedications = medications.filter(m => 
    m.med_name.toLowerCase().includes(search.toLowerCase()) || 
    m.med_code.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenModal = () => {
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleCreate = async (values: any) => {
    try {
      const finalMedCode = values.med_code?.trim() || `MED${Math.floor(Date.now() / 1000)}`;
      const payload: MedicationCreate = {
        med_code: finalMedCode,
        med_name: values.med_name,
        active_ingredient: values.active_ingredient,
        unit: values.unit,
        price: values.price,
        is_bhyt_covered: values.is_bhyt_covered || false,
      };
      await inventoryApi.createMedication(payload);
      message.success('Thêm thuốc mới thành công');
      setIsModalOpen(false);
      fetchMedications();
    } catch (error: any) {
      message.error(getErrorMessage(error, 'Thêm thuốc thất bại'));
    }
  };

  const handleOpenEditModal = (record: Medication) => {
    setEditingMedication(record);
    editForm.setFieldsValue({
      med_code: record.med_code,
      med_name: record.med_name,
      active_ingredient: record.active_ingredient,
      unit: record.unit,
      price: record.price,
      is_bhyt_covered: record.is_bhyt_covered,
    });
    setIsEditModalOpen(true);
  };

  const handleUpdate = async (values: any) => {
    if (!editingMedication) return;
    try {
      const payload: MedicationUpdate = {
        med_name: values.med_name,
        active_ingredient: values.active_ingredient,
        unit: values.unit,
        price: values.price,
        is_bhyt_covered: values.is_bhyt_covered,
      };
      await inventoryApi.updateMedication(editingMedication.medication_id, payload);
      message.success('Cập nhật thuốc thành công');
      setIsEditModalOpen(false);
      fetchMedications();
    } catch (error: any) {
      message.error(getErrorMessage(error, 'Cập nhật thất bại'));
    }
  };

  const handleToggleStatus = async (record: Medication) => {
    try {
      if (record.is_active) {
        await inventoryApi.deactivateMedication(record.medication_id);
        message.success(`Đã ngừng lưu hành thuốc ${record.med_name}`);
      } else {
        await inventoryApi.reactivateMedication(record.medication_id);
        message.success(`Đã lưu hành lại thuốc ${record.med_name}`);
      }
      fetchMedications();
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
      title: 'Mã Thuốc',
      dataIndex: 'med_code',
      key: 'med_code',
      width: 120,
      render: (code: string) => (
        <Badge
          count={code}
          style={{
            backgroundColor: '#f6ffed',
            color: '#52c41a',
            border: '1px solid #b7eb8f',
            fontWeight: '600',
            fontSize: '12px'
          }}
        />
      ),
    },
    {
      title: 'Tên Thuốc',
      dataIndex: 'med_name',
      key: 'med_name',
      render: (name: string) => <span className="font-semibold text-gray-800">{name}</span>,
    },
    {
      title: 'Hoạt Chất',
      dataIndex: 'active_ingredient',
      key: 'active_ingredient',
      render: (text: string) => <Text className="text-gray-500 text-sm">{text || '-'}</Text>,
    },
    {
      title: 'Đơn Vị',
      dataIndex: 'unit',
      key: 'unit',
      width: 100,
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
      title: 'BHYT',
      dataIndex: 'is_bhyt_covered',
      key: 'is_bhyt_covered',
      align: 'center' as const,
      width: 100,
      render: (is_bhyt_covered: boolean) => (
        <Tag color={is_bhyt_covered ? 'blue' : 'default'} style={{ padding: '2px 8px', borderRadius: '4px' }}>
          {is_bhyt_covered ? 'Có' : 'Không'}
        </Tag>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 140,
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'success' : 'default'} style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '13px' }}>
          <Space>
            {isActive ? <CheckCircleOutlined /> : <ExclamationCircleOutlined />}
            {isActive ? 'Đang lưu hành' : 'Ngừng bán'}
          </Space>
        </Tag>
      ),
    },
    {
      title: 'Hành động',
      key: 'actions',
      render: (_: any, record: Medication) => (
        <Space size="small">
          <Tooltip title="Sửa thông tin thuốc">
            <Button icon={<EditOutlined />} onClick={() => handleOpenEditModal(record)} size="small" />
          </Tooltip>
          <Tooltip title={record.is_active ? "Ngừng lưu hành" : "Khôi phục lưu hành"}>
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
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 p-8 text-white shadow-xl">
        <div className="relative z-10">
          <Space align="center" className="mb-2">
            <MedicineBoxOutlined className="text-3xl text-blue-100" />
            <span className="bg-white/20 text-white border border-white/30 text-xs px-3 py-1 rounded-full font-medium tracking-wide uppercase">
              Kho Thuốc
            </span>
          </Space>
          <Title level={2} style={{ color: '#fff', margin: '4px 0 12px 0', fontWeight: 700 }}>
            Quản lý Danh Mục Thuốc
          </Title>
          <Paragraph className="text-blue-50/90 text-base max-w-3xl mb-0 leading-relaxed">
            Xem và quản lý danh mục thuốc, thiết lập giá, hoạt chất, đơn vị và chế độ BHYT.
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
              Danh Sách Thuốc
            </Title>
          </div>

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
              <Text className="text-sm text-gray-500">Chỉ đang bán:</Text>
              <Switch
                checked={activeOnly}
                onChange={(checked) => setActiveOnly(checked)}
              />
            </Space>

            <Tooltip title="Làm mới dữ liệu">
              <Button
                icon={<ReloadOutlined />}
                onClick={() => fetchMedications()}
                className="flex items-center justify-center rounded-lg"
              />
            </Tooltip>
            
            <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenModal} className="rounded-lg bg-blue-600">
              Thêm thuốc mới
            </Button>
          </div>
        </div>

        <Table
          columns={columns}
          dataSource={filteredMedications}
          rowKey="medication_id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showTotal: (total, range) => `Hiển thị ${range[0]}-${range[1]} trong tổng số ${total} thuốc`,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50']
          }}
          className="custom-table"
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={<span className="text-gray-500">Chưa có thuốc nào.</span>}
              />
            )
          }}
        />
      </Card>

      {/* Create Modal */}
      <Modal
        title="Thêm Thuốc Mới"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        forceRender
      >
        <Form form={form} layout="vertical" onFinish={handleCreate} initialValues={{ is_bhyt_covered: false }}>
          <Form.Item 
            name="med_name" 
            label="Tên Thuốc" 
            rules={[{ required: true, message: 'Vui lòng nhập tên thuốc' }]}
          >
            <Input placeholder="VD: Amoxicillin 500mg" />
          </Form.Item>
          
          <Form.Item 
            name="active_ingredient" 
            label="Hoạt chất chính" 
          >
            <Input placeholder="VD: Amoxicillin" />
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item 
              name="unit" 
              label="Đơn vị tính" 
              rules={[{ required: true, message: 'Vui lòng nhập đơn vị' }]}
            >
              <Input placeholder="VD: Viên, Vỉ, Hộp, Lọ" />
            </Form.Item>

            <Form.Item 
              name="price" 
              label="Giá Bán Lẻ (VNĐ)" 
              rules={[{ required: true, message: 'Vui lòng nhập giá' }]}
            >
              <InputNumber 
                className="w-full"
                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={(value) => value!.replace(/\$\s?|(,*)/g, '') as any}
                min={0}
              />
            </Form.Item>
          </div>

          <Form.Item name="is_bhyt_covered" label="Được BHYT hỗ trợ" valuePropName="checked">
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
        title="Cập Nhật Thuốc"
        open={isEditModalOpen}
        onCancel={() => setIsEditModalOpen(false)}
        footer={null}
        forceRender
      >
        <Form form={editForm} layout="vertical" onFinish={handleUpdate}>
          <Form.Item 
            name="med_code" 
            label="Mã Thuốc" 
          >
            <Input disabled className="bg-gray-50 text-gray-500 font-semibold" />
          </Form.Item>
          <Form.Item 
            name="med_name" 
            label="Tên Thuốc" 
            rules={[{ required: true, message: 'Vui lòng nhập tên thuốc' }]}
          >
            <Input placeholder="VD: Amoxicillin 500mg" />
          </Form.Item>
          
          <Form.Item 
            name="active_ingredient" 
            label="Hoạt chất chính" 
          >
            <Input placeholder="VD: Amoxicillin" />
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item 
              name="unit" 
              label="Đơn vị tính" 
              rules={[{ required: true, message: 'Vui lòng nhập đơn vị' }]}
            >
              <Input placeholder="VD: Viên, Vỉ, Hộp, Lọ" />
            </Form.Item>

            <Form.Item 
              name="price" 
              label="Giá Bán Lẻ (VNĐ)" 
              rules={[{ required: true, message: 'Vui lòng nhập giá' }]}
            >
              <InputNumber 
                className="w-full"
                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={(value) => value!.replace(/\$\s?|(,*)/g, '') as any}
                min={0}
              />
            </Form.Item>
          </div>

          <Form.Item name="is_bhyt_covered" label="Được BHYT hỗ trợ" valuePropName="checked">
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
