"use client";

import React, { useEffect, useState } from 'react';
import {
  Card,
  Table,
  Button,
  DatePicker,
  Typography,
  Space,
  Row,
  Col,
  Statistic,
  App,
  Tabs
} from 'antd';
import {
  BarChartOutlined,
  UserOutlined,
  MedicineBoxOutlined,
  CalendarOutlined,
  DollarOutlined,
  ArrowUpOutlined
} from '@ant-design/icons';
import { reportApi, RevenueSummary, DoctorRevenueItem, MedicationRevenueItem } from '@/api/report';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { RangePicker } = DatePicker;

export default function ReportManagement() {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [dates, setDates] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(30, 'day'),
    dayjs()
  ]);

  const [summary, setSummary] = useState<RevenueSummary | null>(null);
  const [doctors, setDoctors] = useState<DoctorRevenueItem[]>([]);
  const [medications, setMedications] = useState<MedicationRevenueItem[]>([]);

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const fetchReports = async () => {
    if (!dates[0] || !dates[1]) return;
    setLoading(true);
    const startStr = dates[0].format('YYYY-MM-DD');
    const endStr = dates[1].format('YYYY-MM-DD');

    try {
      const [sumData, docData, medData] = await Promise.all([
        reportApi.getRevenueSummary(startStr, endStr),
        reportApi.getDoctorRevenue(startStr, endStr),
        reportApi.getMedicationRevenue(startStr, endStr)
      ]);

      setSummary(sumData);
      setDoctors(docData.doctors);
      setMedications(medData.medications);
    } catch (error) {
      message.error('Lỗi khi tải báo cáo thống kê');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isMounted) {
      fetchReports();
    }
  }, [dates, isMounted]);

  const formatCurrency = (val: number = 0) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const doctorColumns = [
    {
      title: 'Bác Sĩ',
      dataIndex: 'doctor_name',
      key: 'doctor_name',
      render: (text: string) => <span className="font-semibold text-gray-800">{text}</span>,
    },
    {
      title: 'Chuyên Khoa',
      dataIndex: 'specialization',
      key: 'specialization',
      render: (text: string) => <span className="text-gray-500">{text || 'Đang cập nhật'}</span>,
    },
    {
      title: 'Số Ca Khám Đã Hoàn Thành',
      dataIndex: 'completed_appointments',
      key: 'completed_appointments',
      sorter: (a: any, b: any) => a.completed_appointments - b.completed_appointments,
      render: (val: number) => <span className="font-medium">{val} ca</span>,
    },
    {
      title: 'Doanh Thu Mang Lại',
      dataIndex: 'total_earnings',
      key: 'total_earnings',
      sorter: (a: any, b: any) => a.total_earnings - b.total_earnings,
      render: (val: number) => <span className="text-green-600 font-bold">{formatCurrency(val)}</span>,
    },
  ];

  const medicationColumns = [
    {
      title: 'Tên Thuốc',
      dataIndex: 'medication_name',
      key: 'medication_name',
      render: (text: string) => <span className="font-semibold text-gray-800">{text}</span>,
    },
    {
      title: 'Số Lượng Đã Bán',
      dataIndex: 'quantity_sold',
      key: 'quantity_sold',
      sorter: (a: any, b: any) => a.quantity_sold - b.quantity_sold,
      render: (val: number) => <span className="font-medium">{val} sản phẩm</span>,
    },
    {
      title: 'Doanh Thu',
      dataIndex: 'total_revenue',
      key: 'total_revenue',
      sorter: (a: any, b: any) => a.total_revenue - b.total_revenue,
      render: (val: number) => <span className="text-blue-600 font-bold">{formatCurrency(val)}</span>,
    },
  ];

  if (!isMounted) return null;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Premium Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-600 p-8 text-white shadow-xl">
        <div className="relative z-10">
          <Space align="center" className="mb-2">
            <BarChartOutlined className="text-3xl text-emerald-100" />
            <span className="bg-white/20 text-white border border-white/30 text-xs px-3 py-1 rounded-full font-medium tracking-wide uppercase">
              Thống Kê Doanh Thu
            </span>
          </Space>
          <Title level={2} style={{ color: '#fff', margin: '4px 0 12px 0', fontWeight: 700 }}>
            Báo Cáo & Thống Kê
          </Title>
          <Paragraph className="text-emerald-50/90 text-base max-w-3xl mb-0 leading-relaxed">
            Xem tổng quan doanh thu toàn viện, doanh thu từ bác sĩ khám bệnh, và doanh thu từ xuất kho bán thuốc.
          </Paragraph>
        </div>
      </div>

      {/* Date Filter */}
      <Card className="shadow-sm rounded-xl border border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <Text className="text-gray-500 block mb-1">Thời gian thống kê</Text>
            <RangePicker
              value={dates}
              onChange={(val) => val && setDates(val as any)}
              format="DD/MM/YYYY"
              allowClear={false}
              className="w-full md:w-auto"
            />
          </div>
          <Button type="primary" onClick={fetchReports} loading={loading} className="bg-emerald-600 border-emerald-600 hover:bg-emerald-500 rounded-lg">
            Cập nhật dữ liệu
          </Button>
        </div>
      </Card>

      {/* Main Stats Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={24} md={6}>
          <Card className="rounded-xl shadow-sm border-gray-100 bg-gradient-to-br from-white to-emerald-50/40">
            <Statistic
              title={<span className="text-gray-500 font-medium">Tổng Doanh Thu</span>}
              value={summary?.total_revenue || 0}
              formatter={(val) => <span className="text-emerald-700 font-black text-2xl">{formatCurrency(val as number)}</span>}
              prefix={<ArrowUpOutlined className="text-emerald-500" />}
            />
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card className="rounded-xl shadow-sm border-gray-100">
            <Statistic
              title={<span className="text-gray-500 font-medium">Khám Lâm Sàng</span>}
              value={summary?.total_appointments_revenue || 0}
              formatter={(val) => <span className="text-gray-800 font-bold text-xl">{formatCurrency(val as number)}</span>}
              prefix={<UserOutlined className="text-blue-500" />}
            />
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card className="rounded-xl shadow-sm border-gray-100">
            <Statistic
              title={<span className="text-gray-500 font-medium">Quầy Bán Thuốc</span>}
              value={summary?.total_pharmacy_revenue || 0}
              formatter={(val) => <span className="text-gray-800 font-bold text-xl">{formatCurrency(val as number)}</span>}
              prefix={<MedicineBoxOutlined className="text-orange-500" />}
            />
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card className="rounded-xl shadow-sm border-gray-100">
            <Statistic
              title={<span className="text-gray-500 font-medium">Gia Hạn BHYT</span>}
              value={summary?.total_bhyt_extension_revenue || 0}
              formatter={(val) => <span className="text-gray-800 font-bold text-xl">{formatCurrency(val as number)}</span>}
              prefix={<DollarOutlined className="text-purple-500" />}
            />
          </Card>
        </Col>
      </Row>

      <Card className="shadow-sm rounded-xl border border-gray-100">
        <Tabs
          defaultActiveKey="1"
          items={[
            {
              key: '1',
              label: <span><UserOutlined />Hiệu Suất & Doanh Thu Bác Sĩ</span>,
              children: (
                <Table
                  columns={doctorColumns}
                  dataSource={doctors}
                  rowKey="doctor_id"
                  loading={loading}
                  pagination={{ pageSize: 10 }}
                  className="custom-table mt-4"
                />
              )
            },
            {
              key: '2',
              label: <span><MedicineBoxOutlined />Doanh Thu Bán Lẻ Dược Phẩm</span>,
              children: (
                <Table
                  columns={medicationColumns}
                  dataSource={medications}
                  rowKey="medication_id"
                  loading={loading}
                  pagination={{ pageSize: 10 }}
                  className="custom-table mt-4"
                />
              )
            }
          ]}
        />
      </Card>
    </div>
  );
}
