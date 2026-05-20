"use client";

import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, message } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { authApi } from '@/api/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const { Title } = Typography;

export default function Register() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      await authApi.register({
        email: values.email,
        password: values.password,
      });
      message.success('Đăng ký thành công! Vui lòng đăng nhập.');
      router.push('/login');
    } catch (error: any) {
      message.error(error.response?.data?.detail || 'Đăng ký thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-md shadow-lg rounded-xl">
        <div className="text-center mb-6">
          <Title level={3}>Đăng Ký Tài Khoản</Title>
          <p className="text-gray-500">Tham gia hệ thống Y tế của chúng tôi</p>
        </div>

        <Form
          name="register"
          onFinish={onFinish}
          size="large"
          layout="vertical"
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, message: 'Vui lòng nhập email!' },
              { type: 'email', message: 'Email không hợp lệ!' }
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="Email" />
          </Form.Item>



          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Mật khẩu" />
          </Form.Item>

          <Form.Item
            name="confirm"
            dependencies={['password']}
            hasFeedback
            rules={[
              { required: true, message: 'Vui lòng xác nhận mật khẩu!' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'));
                },
              }),
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Xác nhận mật khẩu" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" className="w-full bg-blue-600" loading={loading}>
              Đăng Ký
            </Button>
          </Form.Item>

          <div className="text-center mt-4">
            <span className="text-gray-500">Đã có tài khoản? </span>
            <Link href="/login" className="text-blue-600 hover:underline">
              Đăng nhập ngay
            </Link>
          </div>
        </Form>
      </Card>
    </div>
  );
}
