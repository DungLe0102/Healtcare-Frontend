"use client";

import React, { useEffect, useState } from 'react';
import { Card, Form, Input, Button, Typography, message, Tabs } from 'antd';
import { UserOutlined, MailOutlined, LockOutlined, SolutionOutlined, SafetyCertificateOutlined, CalendarOutlined } from '@ant-design/icons';
import { authApi } from '@/api/auth';
import { getErrorMessage } from '@/utils/errorHandler';
import { useRouter } from 'next/navigation';
import PatientProfileForm from './PatientProfileForm';
import PatientConsentForm from './PatientConsentForm';
import PatientAppointmentHistory from './PatientAppointmentHistory';
import PatientInvoices from './PatientInvoices';
import PatientNotifications from './PatientNotifications';
import PatientSupport from './PatientSupport';
import PatientOrders from './PatientOrders';
import { BellOutlined, CustomerServiceOutlined, ShoppingCartOutlined } from '@ant-design/icons';

const { Title } = Typography;

export default function UserProfile() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    setUserRole(localStorage.getItem('user_role'));
    fetchProfile();
  }, []);

  async function fetchProfile() {
    try {
      const data = await authApi.getMe();
      profileForm.setFieldsValue({
        email: data.email,
        full_name: data.full_name,
      });
    } catch (error) {
      message.error('Không thể tải thông tin người dùng.');
    }
  }

  const onUpdateProfile = async (values: any) => {
    setLoading(true);
    try {
      await authApi.updateMe(values);
      message.success('Cập nhật thông tin thành công!');
      fetchProfile();
    } catch (error: any) {
      message.error(getErrorMessage(error, 'Cập nhật thất bại.'));
    } finally {
      setLoading(false);
    }
  };

  const onChangePassword = async (values: any) => {
    setLoading(true);
    try {
      await authApi.changePassword({
        current_password: values.current_password,
        new_password: values.new_password,
      });
      message.success('Đổi mật khẩu thành công!');
      passwordForm.resetFields();
    } catch (error: any) {
      message.error(getErrorMessage(error, 'Đổi mật khẩu thất bại.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <Card 
        className="shadow-sm rounded-xl"
        extra={
          userRole === 'PATIENT' ? (
            <Button 
              type="primary" 
              className="bg-green-600 hover:bg-green-700" 
              icon={<CalendarOutlined />}
              onClick={() => router.push('/booking')}
            >
              Đặt lịch khám ngay
            </Button>
          ) : (
            <Button danger onClick={() => {
              localStorage.clear();
              router.push('/login');
            }}>Đăng xuất</Button>
          )
        }
      >
        <Title level={3} className="mb-6">Hồ sơ tài khoản</Title>
        <Tabs defaultActiveKey="1" items={[
          {
            key: '1',
            label: 'Thông tin chung',
            forceRender: true,
            children: (
              <Form form={profileForm} layout="vertical" onFinish={onUpdateProfile} className="mt-4">
                <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
                  <Input prefix={<MailOutlined />} disabled />
                </Form.Item>
                <Form.Item name="full_name" label="Họ và tên">
                  <Input prefix={<UserOutlined />} placeholder="Nhập họ và tên" />
                </Form.Item>
                <Button type="primary" htmlType="submit" loading={loading}>
                  Lưu thay đổi
                </Button>
              </Form>
            )
          },
          {
            key: '2',
            label: 'Đổi mật khẩu',
            forceRender: true,
            children: (
              <Form form={passwordForm} layout="vertical" onFinish={onChangePassword} className="mt-4">
                <Form.Item
                  name="current_password"
                  label="Mật khẩu hiện tại"
                  rules={[{ required: true, message: 'Vui lòng nhập mật khẩu hiện tại' }]}
                >
                  <Input.Password prefix={<LockOutlined />} />
                </Form.Item>
                <Form.Item
                  name="new_password"
                  label="Mật khẩu mới"
                  rules={[{ required: true, message: 'Vui lòng nhập mật khẩu mới' }]}
                >
                  <Input.Password prefix={<LockOutlined />} />
                </Form.Item>
                <Form.Item
                  name="confirm_password"
                  label="Xác nhận mật khẩu mới"
                  dependencies={['new_password']}
                  rules={[
                    { required: true, message: 'Vui lòng xác nhận mật khẩu' },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue('new_password') === value) {
                          return Promise.resolve();
                        }
                        return Promise.reject(new Error('Mật khẩu không khớp!'));
                      },
                    }),
                  ]}
                >
                  <Input.Password prefix={<LockOutlined />} />
                </Form.Item>
                <Button type="primary" htmlType="submit" loading={loading}>
                  Cập nhật mật khẩu
                </Button>
              </Form>
            )
          },
          ...(userRole === 'PATIENT' ? [
            {
              key: '3',
              label: <span><SolutionOutlined /> Hồ sơ y tế</span>,
              children: <PatientProfileForm />
            },
            {
              key: '4',
              label: <span><SafetyCertificateOutlined /> Quyền riêng tư</span>,
              children: <PatientConsentForm />
            },
            {
              key: '5',
              label: <span><SolutionOutlined /> Lịch sử khám bệnh</span>,
              children: <PatientAppointmentHistory />
            },
            {
              key: '6',
              label: <span><SolutionOutlined /> Hóa đơn & Thanh toán</span>,
              children: <PatientInvoices />
            },
            {
              key: '7',
              label: <span><BellOutlined /> Thông báo</span>,
              children: <PatientNotifications />
            },
            {
              key: '8',
              label: <span><CustomerServiceOutlined /> Hỗ trợ</span>,
              children: <PatientSupport />
            },
            {
              key: '9',
              label: <span><ShoppingCartOutlined /> Đơn mua hàng</span>,
              children: <PatientOrders />
            }
          ] : [])
        ]} />
      </Card>
    </div>
  );
}
