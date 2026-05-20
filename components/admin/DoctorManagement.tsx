"use client";

import React, { useEffect, useState } from 'react';
import { Card, Table, Button, Tag, Space, Modal, Form, Input, Select, InputNumber, Switch, Popconfirm, App } from 'antd';
import { PlusOutlined, EditOutlined, SearchOutlined, DeleteOutlined } from '@ant-design/icons';
import { doctorApi, Doctor } from '@/api/doctor';
import { departmentApi, Department } from '@/api/department';

const { Option } = Select;

export default function DoctorManagement() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [form] = Form.useForm();
  const { message } = App.useApp();
  
  // Filters
  const [search, setSearch] = useState<string>('');
  const [departmentId, setDepartmentId] = useState<string | undefined>(undefined);

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    fetchDoctors();
  }, [search, departmentId]);

  const fetchDepartments = async () => {
    try {
      const data = await departmentApi.getDepartments(false);
      setDepartments(data);
    } catch (error) {
      message.error('Lỗi khi tải danh sách khoa/phòng');
    }
  };

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const data = await doctorApi.getDoctors(0, 100, departmentId, false, search);
      setDoctors(data);
    } catch (error) {
      message.error('Lỗi khi tải danh sách bác sĩ');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (record?: Doctor) => {
    setEditingDoctor(record || null);
    if (record) {
      form.setFieldsValue({
        first_name: record.first_name,
        last_name: record.last_name,
        specialization: record.specialization,
        department_id: record.department_id,
        hourly_consultation_fee: record.hourly_consultation_fee,
        is_active: record.is_active,
        is_simulator: record.is_simulator,
      });
    } else {
      form.resetFields();
      form.setFieldsValue({
        is_active: true,
        is_simulator: false,
        hourly_consultation_fee: 0,
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editingDoctor) {
        await doctorApi.updateDoctor(editingDoctor.doctor_id, values);
        message.success('Cập nhật thông tin bác sĩ thành công');
      } else {
        await doctorApi.createDoctor(values);
        message.success('Thêm bác sĩ thành công');
      }
      setIsModalOpen(false);
      fetchDoctors();
    } catch (error: any) {
      message.error(error.response?.data?.detail || 'Thao tác thất bại');
    }
  };

  const handleDelete = async (doctorId: string) => {
    try {
      await doctorApi.deactivateDoctor(doctorId);
      message.success('Đã vô hiệu hóa bác sĩ thành công');
      fetchDoctors();
    } catch (error: any) {
      message.error(error.response?.data?.detail || 'Xóa thất bại');
    }
  };

  const columns = [
    { 
      title: 'Họ và Tên', 
      key: 'full_name',
      render: (_: any, record: Doctor) => `${record.last_name} ${record.first_name}`
    },
    { title: 'Chuyên khoa', dataIndex: 'specialization', key: 'specialization' },
    { 
      title: 'Khoa/Phòng', 
      dataIndex: 'department_id', 
      key: 'department_id',
      render: (depId: string) => {
        const dep = departments.find(d => d.department_id === depId);
        return dep ? dep.department_name : <span className="text-gray-400">Không có</span>;
      }
    },
    { 
      title: 'Phí tư vấn/giờ', 
      dataIndex: 'hourly_consultation_fee', 
      key: 'hourly_consultation_fee',
      render: (fee: number) => `${fee.toLocaleString('vi-VN')} đ`
    },
    { 
      title: 'Trạng thái', 
      dataIndex: 'is_active', 
      key: 'is_active',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'success' : 'default'}>
          {isActive ? 'Hoạt động' : 'Vô hiệu hóa'}
        </Tag>
      )
    },
    {
      title: 'Hành động',
      key: 'actions',
      render: (_: any, record: Doctor) => (
        <Space size="middle">
          <Button icon={<EditOutlined />} onClick={() => handleOpenModal(record)} size="small" title="Chỉnh sửa" />
          <Popconfirm
            title="Vô hiệu hóa bác sĩ?"
            description="Bạn có chắc chắn muốn vô hiệu hóa bác sĩ này (Soft Delete)?"
            onConfirm={() => handleDelete(record.doctor_id)}
            okText="Có"
            cancelText="Không"
          >
            <Button icon={<DeleteOutlined />} danger size="small" title="Vô hiệu hóa" disabled={!record.is_active} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <Card 
        title={<span className="text-xl font-semibold">Quản lý Bác Sĩ (Admin)</span>} 
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenModal()}>
            Thêm Bác Sĩ
          </Button>
        }
      >
        <div className="mb-4 flex flex-wrap gap-4">
          <Input
            placeholder="Tìm kiếm theo tên hoặc chuyên khoa..."
            prefix={<SearchOutlined className="text-gray-400" />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64"
            allowClear
          />
          <Select
            placeholder="Lọc theo Khoa/Phòng"
            value={departmentId}
            onChange={(value) => setDepartmentId(value)}
            className="w-64"
            allowClear
          >
            {departments.map((dep) => (
              <Option key={dep.department_id} value={dep.department_id}>
                {dep.department_name}
              </Option>
            ))}
          </Select>
        </div>

        <Table 
          columns={columns} 
          dataSource={doctors} 
          rowKey="doctor_id" 
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title={editingDoctor ? "Sửa thông tin Bác sĩ" : "Thêm Bác sĩ mới"}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="last_name" label="Họ và tên đệm" rules={[{ required: true, message: 'Vui lòng nhập họ' }]}>
              <Input placeholder="VD: Nguyễn Văn" />
            </Form.Item>
            <Form.Item name="first_name" label="Tên" rules={[{ required: true, message: 'Vui lòng nhập tên' }]}>
              <Input placeholder="VD: A" />
            </Form.Item>
          </div>
          
          <Form.Item name="specialization" label="Chuyên khoa" rules={[{ required: true, message: 'Vui lòng nhập chuyên khoa' }]}>
            <Input placeholder="VD: Nội tim mạch" />
          </Form.Item>
          
          <Form.Item name="department_id" label="Khoa/Phòng">
            <Select placeholder="Chọn khoa/phòng" allowClear>
              {departments.map((dep) => (
                <Option key={dep.department_id} value={dep.department_id}>
                  {dep.department_name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item name="hourly_consultation_fee" label="Phí tư vấn/giờ (VNĐ)" rules={[{ required: true, message: 'Vui lòng nhập phí' }]}>
            <InputNumber className="w-full" min={0} step={10000} formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
          </Form.Item>
          
          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="is_active" label="Trạng thái hoạt động" valuePropName="checked">
              <Switch checkedChildren="Hoạt động" unCheckedChildren="Vô hiệu hóa" />
            </Form.Item>
            
            <Form.Item name="is_simulator" label="Là Simulator (Mô phỏng)" valuePropName="checked">
              <Switch />
            </Form.Item>
          </div>

          <Form.Item className="mt-6 mb-0 text-right">
            <Space>
              <Button onClick={() => setIsModalOpen(false)}>Hủy</Button>
              <Button type="primary" htmlType="submit">Lưu</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
