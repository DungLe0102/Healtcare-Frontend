"use client";

import React, { useEffect, useState } from 'react';
import { Card, Typography, Button } from 'antd';
import { useRouter } from 'next/navigation';

const { Title } = Typography;

export default function DashboardPage() {
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('access_token');
    const userRole = localStorage.getItem('user_role');
    
    if (!token) {
      router.push('/login');
    } else {
      setRole(userRole);
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_role');
    localStorage.removeItem('account_id');
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <Card className="max-w-4xl mx-auto shadow-sm rounded-xl">
        <Title level={2}>Dashboard</Title>
        <p className="text-gray-600 mb-6">
          Chào mừng bạn đã đăng nhập thành công vào hệ thống.
        </p>
        
        <div className="bg-blue-50 p-4 rounded-lg mb-6">
          <p><strong>Vai trò của bạn:</strong> {role === 'PATIENT' ? 'Bệnh nhân' : role}</p>
        </div>

        <Button danger type="primary" onClick={handleLogout}>
          Đăng xuất
        </Button>
      </Card>
    </div>
  );
}
