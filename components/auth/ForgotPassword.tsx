"use client";

import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, message, Steps } from 'antd';
import { LockOutlined, MailOutlined, KeyOutlined } from '@ant-design/icons';
import { authApi } from '@/api/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const { Title } = Typography;

export default function ForgotPassword() {
  const [currentStep, setCurrentStep] = useState(0);
  const [email, setEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSendOTP = async (values: { email: string }) => {
    setLoading(true);
    try {
      await authApi.forgotPassword({ email: values.email });
      setEmail(values.email);
      message.success('Mã OTP đã được gửi đến email của bạn!');
      setCurrentStep(1);
    } catch (error: any) {
      message.error(error.response?.data?.detail || 'Có lỗi xảy ra, vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (values: { otp: string }) => {
    setLoading(true);
    try {
      const res = await authApi.verifyResetOtp({ email, otp: values.otp });
      setResetToken(res.reset_token);
      message.success('Xác minh thành công. Vui lòng nhập mật khẩu mới.');
      setCurrentStep(2);
    } catch (error: any) {
      message.error(error.response?.data?.detail || 'OTP không hợp lệ hoặc đã hết hạn.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (values: { password: string }) => {
    setLoading(true);
    try {
      await authApi.resetPassword({ token: resetToken, new_password: values.password });
      message.success('Đặt mật khẩu mới thành công! Vui lòng đăng nhập lại.');
      router.push('/login');
    } catch (error: any) {
      message.error(error.response?.data?.detail || 'Có lỗi xảy ra, vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-md shadow-lg rounded-xl">
        <div className="text-center mb-6">
          <Title level={3}>Khôi Phục Mật Khẩu</Title>
        </div>
        
        <Steps
          current={currentStep}
          className="mb-8"
          items={[
            { title: 'Email' },
            { title: 'Nhập OTP' },
            { title: 'Mật khẩu mới' },
          ]}
        />

        {currentStep === 0 && (
          <Form name="forgot_password" onFinish={handleSendOTP} layout="vertical" size="large">
            <Form.Item
              name="email"
              rules={[
                { required: true, message: 'Vui lòng nhập email!' },
                { type: 'email', message: 'Email không hợp lệ!' }
              ]}
            >
              <Input prefix={<MailOutlined />} placeholder="Nhập email của bạn" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" className="w-full bg-blue-600" loading={loading}>
                Gửi mã OTP
              </Button>
            </Form.Item>
          </Form>
        )}

        {currentStep === 1 && (
          <Form name="verify_otp" onFinish={handleVerifyOTP} layout="vertical" size="large">
            <p className="mb-4 text-center text-gray-500">Mã OTP đã được gửi đến: <strong>{email}</strong></p>
            <Form.Item
              name="otp"
              rules={[{ required: true, message: 'Vui lòng nhập mã OTP!' }]}
            >
              <Input prefix={<KeyOutlined />} placeholder="Mã OTP 6 chữ số" maxLength={6} />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" className="w-full bg-blue-600" loading={loading}>
                Xác nhận
              </Button>
            </Form.Item>
          </Form>
        )}

        {currentStep === 2 && (
          <Form name="reset_password" onFinish={handleResetPassword} layout="vertical" size="large">
            <Form.Item
              name="password"
              rules={[{ required: true, message: 'Vui lòng nhập mật khẩu mới!' }]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="Mật khẩu mới" />
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
              <Input.Password prefix={<LockOutlined />} placeholder="Xác nhận mật khẩu mới" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" className="w-full bg-blue-600" loading={loading}>
                Đặt mật khẩu
              </Button>
            </Form.Item>
          </Form>
        )}

        <div className="text-center mt-4">
          <Link href="/login" className="text-blue-600 hover:underline">
            Quay lại đăng nhập
          </Link>
        </div>
      </Card>
    </div>
  );
}
