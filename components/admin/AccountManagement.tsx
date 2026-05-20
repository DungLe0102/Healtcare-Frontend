"use client";

import React, { useEffect, useState } from 'react';
import { Card, Table, Button, Tag, Space, Modal, Form, Input, Select, App } from 'antd';
import { PlusOutlined, EditOutlined, StopOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { authApi } from '@/api/auth';

const { Option } = Select;

export default function AccountManagement() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<any>(null);
  const [form] = Form.useForm();
  const { message } = App.useApp();

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const data = await authApi.getAccounts();
      setAccounts(data);
    } catch (error) {
      message.error('Lỗi khi tải danh sách tài khoản');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (record?: any) => {
    setEditingAccount(record);
    if (record) {
      form.setFieldsValue({
        email: record.email,
        full_name: record.full_name,
        role: record.role,
      });
    } else {
      form.resetFields();
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editingAccount) {
        await authApi.updateAccount(editingAccount.account_id, values);
        message.success('Cập nhật thành công');
      } else {
        await authApi.createAccount(values);
        message.success('Tạo tài khoản thành công');
      }
      setIsModalOpen(false);
      fetchAccounts();
    } catch (error: any) {
      message.error(error.response?.data?.detail || 'Thao tác thất bại');
    }
  };

  const toggleStatus = async (record: any) => {
    try {
      if (record.is_active) {
        await authApi.deactivateAccount(record.account_id);
      } else {
        await authApi.reactivateAccount(record.account_id);
      }
      message.success('Đã cập nhật trạng thái');
      fetchAccounts();
    } catch (error: any) {
      message.error(error.response?.data?.detail || 'Cập nhật thất bại');
    }
  };

  const columns = [
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Họ tên', dataIndex: 'full_name', key: 'full_name' },
    { 
      title: 'Vai trò', 
      dataIndex: 'role', 
      key: 'role',
      render: (role: string) => (
        <Tag color={role === 'ADMIN' ? 'red' : 'blue'}>{role}</Tag>
      )
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
      render: (_: any, record: any) => (
        <Space size="middle">
          <Button icon={<EditOutlined />} onClick={() => handleOpenModal(record)} size="small" />
          <Button 
            icon={record.is_active ? <StopOutlined /> : <CheckCircleOutlined />} 
            onClick={() => toggleStatus(record)}
            danger={record.is_active}
            size="small"
            title={record.is_active ? "Vô hiệu hóa" : "Kích hoạt"}
          />
        </Space>
      ),
    },
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <Card title="Quản lý Tài Khoản (Admin)" extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenModal()}>Tạo tài khoản</Button>}>
        <Table 
          columns={columns} 
          dataSource={accounts} 
          rowKey="account_id" 
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title={editingAccount ? "Sửa tài khoản" : "Tạo tài khoản mới"}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
            <Input disabled={!!editingAccount} />
          </Form.Item>
          {!editingAccount && (
            <Form.Item name="password" label="Mật khẩu" rules={[{ required: true }]}>
              <Input.Password />
            </Form.Item>
          )}
          <Form.Item name="full_name" label="Họ tên">
            <Input />
          </Form.Item>
          <Form.Item name="role" label="Vai trò" rules={[{ required: true }]}>
            <Select>
              <Option value="ADMIN">Admin</Option>
              <Option value="PATIENT">Bệnh nhân</Option>
            </Select>
          </Form.Item>
          <Form.Item className="mt-4 mb-0">
            <Space className="w-full justify-end">
              <Button onClick={() => setIsModalOpen(false)}>Hủy</Button>
              <Button type="primary" htmlType="submit">Lưu</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
