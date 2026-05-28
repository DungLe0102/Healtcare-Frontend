"use client";

import React, { useEffect, useState } from 'react';
import { Layout, Menu, Button, Avatar, Space, Typography, ConfigProvider, theme, App } from 'antd';
import {
  UserOutlined,
  ApartmentOutlined,
  LogoutOutlined,
  DashboardOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  IdcardOutlined,
  CalendarOutlined,
  TeamOutlined,
  BankOutlined,
  PayCircleOutlined,
  MedicineBoxOutlined,
  DatabaseOutlined,
  BellOutlined,
  BarChartOutlined,
  SafetyOutlined,
  ShoppingCartOutlined
} from '@ant-design/icons';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

const { Header, Sider, Content } = Layout;
const { Text, Title } = Typography;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [adminEmail, setAdminEmail] = useState<string>('Admin');

  useEffect(() => {
    // Basic auth check
    const token = localStorage.getItem('access_token');
    const role = localStorage.getItem('user_role');
    
    if (!token || role !== 'ADMIN') {
      router.push('/login');
    }
    
    // Set admin email/info from local storage if available
    try {
      const email = localStorage.getItem('user_email') || 'admin@healthcare.com';
      setAdminEmail(email);
    } catch (e) {
      // Ignore
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_role');
    localStorage.removeItem('account_id');
    localStorage.removeItem('user_email');
    router.push('/login');
  };

  const menuItems = [
    {
      key: '/admin/accounts',
      icon: <UserOutlined style={{ fontSize: '18px' }} />,
      label: <Link href="/admin/accounts">Quản lý Tài Khoản</Link>,
    },
    {
      key: '/admin/departments',
      icon: <ApartmentOutlined style={{ fontSize: '18px' }} />,
      label: <Link href="/admin/departments">Quản lý Khoa/Phòng</Link>,
    },
    {
      key: '/admin/doctors',
      icon: <IdcardOutlined style={{ fontSize: '18px' }} />,
      label: <Link href="/admin/doctors">Quản lý Bác Sĩ</Link>,
    },
    {
      key: '/admin/services',
      icon: <MedicineBoxOutlined style={{ fontSize: '18px' }} />,
      label: <Link href="/admin/services">Quản lý Dịch vụ</Link>,
    },
    {
      key: '/admin/medications',
      icon: <MedicineBoxOutlined style={{ fontSize: '18px' }} />,
      label: <Link href="/admin/medications">Quản lý Thuốc</Link>,
    },
    {
      key: '/admin/inventory',
      icon: <DatabaseOutlined style={{ fontSize: '18px' }} />,
      label: <Link href="/admin/inventory">Quản lý Lô Thuốc</Link>,
    },
    {
      key: '/admin/schedules',
      icon: <CalendarOutlined style={{ fontSize: '18px' }} />,
      label: <Link href="/admin/schedules">Quản lý Lịch Khám</Link>,
    },
    {
      key: '/admin/patients',
      icon: <TeamOutlined style={{ fontSize: '18px' }} />,
      label: <Link href="/admin/patients">Quản lý Bệnh Nhân</Link>,
    },
    {
      key: '/admin/notifications',
      icon: <BellOutlined style={{ fontSize: '18px' }} />,
      label: <Link href="/admin/notifications">Hỗ trợ & Thông báo</Link>,
    },
    {
      key: '/admin/appointments',
      icon: <DashboardOutlined style={{ fontSize: '18px' }} />,
      label: <Link href="/admin/appointments">Quản lý Cuộc Hẹn</Link>,
    },
    {
      key: '/admin/reports',
      icon: <BarChartOutlined style={{ fontSize: '18px' }} />,
      label: <Link href="/admin/reports">Báo cáo & Thống kê</Link>,
    },
    {
      key: '/admin/audit-logs',
      icon: <SafetyOutlined style={{ fontSize: '18px' }} />,
      label: <Link href="/admin/audit-logs">Nhật ký Hệ thống</Link>,
    },
    {
      key: '/admin/orders',
      icon: <ShoppingCartOutlined style={{ fontSize: '18px' }} />,
      label: <Link href="/admin/orders">Quản lý Đơn Hàng</Link>,
    },
    {
      key: '/admin/billing',
      icon: <BankOutlined style={{ fontSize: '18px' }} />,
      label: <Link href="/admin/billing">Quản lý Thu Ngân</Link>,
    },
    {
      key: '/admin/payouts',
      icon: <PayCircleOutlined style={{ fontSize: '18px' }} />,
      label: <Link href="/admin/payouts">Lương Bác Sĩ</Link>,
    },
  ];

  // Determine selected menu key based on pathname
  let selectedKey = '/admin/accounts';
  if (pathname.startsWith('/admin/departments')) {
    selectedKey = '/admin/departments';
  } else if (pathname.startsWith('/admin/doctors')) {
    selectedKey = '/admin/doctors';
  } else if (pathname.startsWith('/admin/services')) {
    selectedKey = '/admin/services';
  } else if (pathname.startsWith('/admin/medications')) {
    selectedKey = '/admin/medications';
  } else if (pathname.startsWith('/admin/inventory')) {
    selectedKey = '/admin/inventory';
  } else if (pathname.startsWith('/admin/schedules')) {
    selectedKey = '/admin/schedules';
  } else if (pathname.startsWith('/admin/patients')) {
    selectedKey = '/admin/patients';
  } else if (pathname.startsWith('/admin/notifications')) {
    selectedKey = '/admin/notifications';
  } else if (pathname.startsWith('/admin/appointments')) {
    selectedKey = '/admin/appointments';
  } else if (pathname.startsWith('/admin/reports')) {
    selectedKey = '/admin/reports';
  } else if (pathname.startsWith('/admin/audit-logs')) {
    selectedKey = '/admin/audit-logs';
  } else if (pathname.startsWith('/admin/orders')) {
    selectedKey = '/admin/orders';
  } else if (pathname.startsWith('/admin/billing')) {
    selectedKey = '/admin/billing';
  } else if (pathname.startsWith('/admin/payouts')) {
    selectedKey = '/admin/payouts';
  }

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1890ff',
          borderRadius: 8,
        },
      }}
    >
      <App>
        <Layout className="min-h-screen">
          {/* Sidebar */}
        <Sider
          trigger={null}
          collapsible
          collapsed={collapsed}
          width={260}
          theme="light"
          className="shadow-md border-r border-gray-100 sticky top-0 h-screen"
        >
          {/* Logo container */}
          <div className="h-16 flex items-center justify-center border-b border-gray-100 px-4 bg-white">
            <Space className="w-full justify-start overflow-hidden whitespace-nowrap">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-blue-200">
                H
              </div>
              {!collapsed && (
                <Title level={4} style={{ margin: 0, fontWeight: 700 }} className="text-gray-800 tracking-wide">
                  Healthcare Admin
                </Title>
              )}
            </Space>
          </div>

          <Menu
            mode="inline"
            selectedKeys={[selectedKey]}
            items={menuItems}
            className="border-none mt-4 px-2"
            style={{ fontSize: '15px' }}
          />

          {/* User profile section at the bottom of the sidebar */}
          {!collapsed && (
            <div className="absolute bottom-0 left-0 w-full p-4 border-t border-gray-100 bg-gray-50 flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <Avatar icon={<UserOutlined />} className="bg-blue-100 text-blue-600" />
                <div className="overflow-hidden">
                  <div className="font-semibold text-gray-800 text-sm truncate">{adminEmail.split('@')[0]}</div>
                  <div className="text-xs text-gray-400 truncate">{adminEmail}</div>
                </div>
              </div>
              <Button
                type="text"
                danger
                icon={<LogoutOutlined />}
                onClick={handleLogout}
                className="w-full text-left flex items-center justify-start mt-2 hover:bg-red-50"
              >
                Đăng xuất
              </Button>
            </div>
          )}

          {collapsed && (
            <div className="absolute bottom-4 left-0 w-full flex justify-center">
              <Button
                type="text"
                danger
                icon={<LogoutOutlined />}
                onClick={handleLogout}
                title="Đăng xuất"
              />
            </div>
          )}
        </Sider>

        <Layout className="flex flex-col">
          {/* Header */}
          <Header className="bg-white p-0 flex items-center justify-between border-b border-gray-100 px-6 h-16 shadow-sm z-10 sticky top-0">
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              className="text-lg w-10 h-10 flex items-center justify-center text-gray-500 hover:text-blue-600 rounded-lg hover:bg-gray-50"
            />
            
            <Space size="large">
              <Text className="text-gray-500 text-sm hidden sm:inline">
                Chào mừng trở lại, <strong className="text-gray-700">{adminEmail}</strong>
              </Text>
              <div className="bg-red-50 text-red-600 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border border-red-100">
                Hệ thống Admin
              </div>
            </Space>
          </Header>

          {/* Content */}
          <Content className="bg-gray-50/50 p-6 md:p-8 flex-1 overflow-auto">
            {children}
          </Content>
        </Layout>
      </Layout>
      </App>
    </ConfigProvider>
  );
}
