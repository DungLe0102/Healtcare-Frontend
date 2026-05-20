"use client";

import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { authApi } from '@/api/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const { Title } = Typography;

export default function Login() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const response = await authApi.login({
        username: values.username,
        password: values.password,
      });
      // Lưu token và thông tin user
      localStorage.setItem('access_token', response.access_token);
      if (response.role) localStorage.setItem('user_role', response.role);
      if (response.account_id) localStorage.setItem('account_id', response.account_id);
      
      message.success('Đăng nhập thành công!');
      
      // Redirect based on role
      if (response.role === 'ADMIN') {
        router.push('/admin'); 
      } else {
        router.push('/dashboard'); 
      }
    } catch (error: any) {
      message.error(error.response?.data?.detail || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-md shadow-lg rounded-xl">
        <div className="text-center mb-6">
          <Title level={3}>Đăng Nhập</Title>
          <p className="text-gray-500">Chào mừng bạn quay lại hệ thống Y tế</p>
        </div>
        
        <Form
          name="login"
          initialValues={{ remember: true }}
          onFinish={onFinish}
          size="large"
          layout="vertical"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: 'Vui lòng nhập tên đăng nhập!' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="Tên đăng nhập" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Mật khẩu" />
          </Form.Item>

          <div className="flex justify-end mb-4 -mt-2">
            <Link href="/forgot-password" className="text-blue-600 hover:underline text-sm">
              Quên mật khẩu?
            </Link>
          </div>

          <Form.Item>
            <Button type="primary" htmlType="submit" className="w-full bg-blue-600" loading={loading}>
              Đăng Nhập
            </Button>
          </Form.Item>

          <div className="text-center mt-4">
            <span className="text-gray-500">Chưa có tài khoản? </span>
            <Link href="/register" className="text-blue-600 hover:underline">
              Đăng ký ngay
            </Link>
          </div>
        </Form>
      </Card>
    </div>
  );
}
