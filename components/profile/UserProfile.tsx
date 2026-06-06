"use client";

import React, { useEffect, useState } from 'react';
import {
  Form, Input, Button, Typography, message, Avatar, Tag, Divider, Tooltip
} from 'antd';
import {
  UserOutlined, MailOutlined, LockOutlined, SolutionOutlined,
  SafetyCertificateOutlined, CalendarOutlined, BellOutlined,
  CustomerServiceOutlined, ShoppingCartOutlined, MedicineBoxOutlined,
  LogoutOutlined, SettingOutlined, IdcardOutlined, HomeOutlined
} from '@ant-design/icons';
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
import PatientServices from './PatientServices';

const { Text } = Typography;

type TabKey =
  | 'overview'
  | 'password'
  | 'medical'
  | 'consent'
  | 'appointments'
  | 'invoices'
  | 'notifications'
  | 'support'
  | 'orders'
  | 'services';

interface NavItem {
  key: TabKey;
  label: string;
  icon: React.ReactNode;
  patientOnly?: boolean;
  badge?: string;
}

const navItems: NavItem[] = [
  { key: 'overview',       label: 'Tài khoản & Mật khẩu',    icon: <SettingOutlined /> },
  { key: 'medical',        label: 'Hồ sơ y tế',               icon: <SolutionOutlined />, patientOnly: true },
  { key: 'consent',        label: 'Quyền riêng tư',           icon: <SafetyCertificateOutlined />, patientOnly: true },
  { key: 'appointments',   label: 'Lịch sử khám bệnh',        icon: <CalendarOutlined />, patientOnly: true },
  { key: 'invoices',       label: 'Hóa đơn & Thanh toán',     icon: <IdcardOutlined />, patientOnly: true },
  { key: 'notifications',  label: 'Thông báo',                 icon: <BellOutlined />, patientOnly: true },
  { key: 'support',        label: 'Hỗ trợ khách hàng',        icon: <CustomerServiceOutlined />, patientOnly: true },
  { key: 'orders',         label: 'Đơn mua thuốc',            icon: <ShoppingCartOutlined />, patientOnly: true },
  { key: 'services',       label: 'Đăng ký Dịch vụ',          icon: <MedicineBoxOutlined />, patientOnly: true },
];

export default function UserProfile() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [activeKey, setActiveKey] = useState<TabKey>('overview');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const role = localStorage.getItem('user_role');
    setUserRole(role);
    fetchProfile();
  }, []);

  async function fetchProfile() {
    try {
      const data = await authApi.getMe();
      profileForm.setFieldsValue({
        email: data.email,
        full_name: data.full_name,
      });
      setUserEmail(data.email || '');
      setUserName(data.full_name || data.email || '');
    } catch {
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

  const handleLogout = () => {
    localStorage.clear();
    router.push('/login');
  };

  const visibleNavItems = navItems.filter(
    item => !item.patientOnly || userRole === 'PATIENT'
  );

  const getInitials = (name: string) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : name.slice(0, 2).toUpperCase();
  };

  const renderContent = () => {
    switch (activeKey) {
      case 'overview':
        return (
          <div className="space-y-8">
            {/* Thông tin chung */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <UserOutlined className="text-blue-600" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-800 m-0">Thông tin tài khoản</h2>
                  <p className="text-xs text-gray-400 m-0">Cập nhật tên hiển thị và email của bạn</p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                <Form form={profileForm} layout="vertical" onFinish={onUpdateProfile}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                    <Form.Item name="email" label={<span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Email đăng nhập</span>} rules={[{ required: true, type: 'email' }]}>
                      <Input prefix={<MailOutlined className="text-gray-400" />} disabled className="rounded-xl bg-gray-100 border-0" />
                    </Form.Item>
                    <Form.Item name="full_name" label={<span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Họ và tên</span>}>
                      <Input prefix={<UserOutlined className="text-gray-400" />} placeholder="Nhập họ và tên" className="rounded-xl" />
                    </Form.Item>
                  </div>
                  <div className="flex justify-end">
                    <Button type="primary" htmlType="submit" loading={loading} className="rounded-xl px-6 bg-blue-600 border-blue-600 hover:bg-blue-500">
                      Lưu thay đổi
                    </Button>
                  </div>
                </Form>
              </div>
            </section>

            <Divider className="my-0" />

            {/* Đổi mật khẩu */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                  <LockOutlined className="text-orange-600" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-800 m-0">Đổi mật khẩu</h2>
                  <p className="text-xs text-gray-400 m-0">Cập nhật mật khẩu để bảo vệ tài khoản</p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                <Form form={passwordForm} layout="vertical" onFinish={onChangePassword}>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6">
                    <Form.Item
                      name="current_password"
                      label={<span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Mật khẩu hiện tại</span>}
                      rules={[{ required: true, message: 'Vui lòng nhập mật khẩu hiện tại' }]}
                    >
                      <Input.Password prefix={<LockOutlined className="text-gray-400" />} className="rounded-xl" />
                    </Form.Item>
                    <Form.Item
                      name="new_password"
                      label={<span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Mật khẩu mới</span>}
                      rules={[{ required: true, message: 'Vui lòng nhập mật khẩu mới' }]}
                    >
                      <Input.Password prefix={<LockOutlined className="text-gray-400" />} className="rounded-xl" />
                    </Form.Item>
                    <Form.Item
                      name="confirm_password"
                      label={<span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Xác nhận mật khẩu</span>}
                      dependencies={['new_password']}
                      rules={[
                        { required: true, message: 'Vui lòng xác nhận mật khẩu' },
                        ({ getFieldValue }) => ({
                          validator(_, value) {
                            if (!value || getFieldValue('new_password') === value) return Promise.resolve();
                            return Promise.reject(new Error('Mật khẩu không khớp!'));
                          },
                        }),
                      ]}
                    >
                      <Input.Password prefix={<LockOutlined className="text-gray-400" />} className="rounded-xl" />
                    </Form.Item>
                  </div>
                  <div className="flex justify-end">
                    <Button type="primary" htmlType="submit" loading={loading} className="rounded-xl px-6 bg-orange-500 border-orange-500 hover:bg-orange-400">
                      Cập nhật mật khẩu
                    </Button>
                  </div>
                </Form>
              </div>
            </section>
          </div>
        );
      case 'medical':        return <PatientProfileForm />;
      case 'consent':        return <PatientConsentForm />;
      case 'appointments':   return <PatientAppointmentHistory />;
      case 'invoices':       return <PatientInvoices />;
      case 'notifications':  return <PatientNotifications />;
      case 'support':        return <PatientSupport />;
      case 'orders':         return <PatientOrders />;
      case 'services':       return <PatientServices />;
      default:               return null;
    }
  };

  const activeNav = visibleNavItems.find(n => n.key === activeKey);

  if (!isMounted) return null;

  return (
    <div className="layout-fullscreen flex w-full bg-[#f0f2f5]">
      {/* ── Sidebar ── */}
      <aside className="flex flex-col w-64 min-w-64 bg-white border-r border-gray-100 h-full shadow-sm">
        {/* Logo / Back */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-colors text-sm font-medium"
          >
            <HomeOutlined className="text-base" />
            <span>Trang chủ</span>
          </button>
        </div>

        {/* User Card */}
        <div className="px-5 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <Avatar
              size={44}
              className="bg-gradient-to-br from-blue-500 to-indigo-600 flex-shrink-0 text-sm font-bold shadow-md"
            >
              {getInitials(userName)}
            </Avatar>
            <div className="min-w-0">
              <div className="font-bold text-gray-800 text-sm truncate">{userName || 'Đang tải...'}</div>
              <div className="text-[11px] text-gray-400 truncate">{userEmail}</div>
              <Tag
                color={userRole === 'PATIENT' ? 'blue' : 'green'}
                className="mt-1 border-0 text-[10px] px-1.5 py-0 rounded-md"
              >
                {userRole === 'PATIENT' ? 'Bệnh nhân' : userRole || 'Người dùng'}
              </Tag>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-3">
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 mb-2">Menu</div>
          {visibleNavItems.map(item => (
            <button
              key={item.key}
              onClick={() => setActiveKey(item.key)}
              className={[
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 text-left mb-0.5',
                activeKey === item.key
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              ].join(' ')}
            >
              <span className={`text-base flex-shrink-0 ${activeKey === item.key ? 'text-white' : 'text-gray-400'}`}>
                {item.icon}
              </span>
              <span className="truncate">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Actions */}
        <div className="border-t border-gray-100 p-3 space-y-1">
          {userRole === 'PATIENT' && (
            <button
              onClick={() => router.push('/booking')}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 transition-all shadow-sm"
            >
              <CalendarOutlined className="text-base flex-shrink-0" />
              <span>Đặt lịch khám ngay</span>
            </button>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 hover:text-red-600 transition-all"
          >
            <LogoutOutlined className="text-base flex-shrink-0" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header Bar */}
        <header className="bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex-shrink-0">
          <div>
            <h1 className="text-lg font-bold text-gray-800 m-0 flex items-center gap-2">
              <span className="text-gray-400">{activeNav?.icon}</span>
              {activeNav?.label || 'Hồ sơ'}
            </h1>
            <p className="text-xs text-gray-400 m-0 mt-0.5">
              Healthcare System — Cổng thông tin bệnh nhân
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Tooltip title="Xem thông báo">
              <button
                onClick={() => setActiveKey('notifications')}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${activeKey === 'notifications' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
              >
                <BellOutlined />
              </button>
            </Tooltip>
            <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2 border border-gray-100">
              <Avatar size={28} className="bg-gradient-to-br from-blue-500 to-indigo-600 text-xs font-bold">
                {getInitials(userName)}
              </Avatar>
              <span className="text-sm font-medium text-gray-700 hidden sm:block">{userName || '...'}</span>
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-8">
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
}
