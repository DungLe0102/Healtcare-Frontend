"use client";

import React, { useEffect, useState } from 'react';
import { Card, Table, Typography, Tag, Select, Button, Space, DatePicker, Modal, App } from 'antd';
import { SyncOutlined, CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { appointmentApi } from '@/api/appointment';
import { doctorApi, Doctor } from '@/api/doctor';
import dayjs from 'dayjs';
import { getErrorMessage } from '@/utils/errorHandler';
import MedicalRecordModal from './MedicalRecordModal';

const { Title, Text } = Typography;
const { Option } = Select;
const { confirm } = Modal;

export default function AppointmentManagement() {
  const { message } = App.useApp();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Filters
  const [selectedDoctor, setSelectedDoctor] = useState<string | undefined>();
  const [selectedDate, setSelectedDate] = useState<string>(dayjs().format('YYYY-MM-DD'));
  const [statusFilter, setStatusFilter] = useState<string | undefined>();

  // Medical Record Modal state
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);

  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [selectedDoctor, selectedDate, statusFilter]);

  const fetchDoctors = async () => {
    try {
      const res = await doctorApi.getDoctors(0, 100);
      setDoctors(res);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      if (selectedDoctor) {
        // Use doctor endpoint if doctor selected
        const res = await appointmentApi.getDoctorAppointments(selectedDoctor, selectedDate, statusFilter);
        setAppointments(res.appointments || res.items || []);
      } else {
        // Fallback to fetch appointments for all doctors individually due to backend route conflict
        let currentDoctors = doctors;
        if (currentDoctors.length === 0) {
          currentDoctors = await doctorApi.getDoctors(0, 100);
          setDoctors(currentDoctors);
        }

        const allAppointments: any[] = [];
        const promises = currentDoctors.map(doctor => 
          appointmentApi.getDoctorAppointments(doctor.doctor_id, selectedDate, statusFilter)
            .catch(() => ({ appointments: [] }))
        );
        
        const results = await Promise.all(promises);
        results.forEach(res => {
          if (res && (res.appointments || res.items)) {
            allAppointments.push(...(res.appointments || res.items || []));
          }
        });
        
        // Sort appointments by start_time
        allAppointments.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
        setAppointments(allAppointments);
      }
    } catch (error: any) {
      message.error(getErrorMessage(error, 'Không thể tải danh sách cuộc hẹn'));
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCleanup = async () => {
    setLoading(true);
    try {
      const res = await appointmentApi.markNoShows();
      message.success(res.detail || 'Đã dọn dẹp lịch hẹn quá hạn thành công');
      fetchAppointments();
    } catch (error: any) {
      message.error(getErrorMessage(error, 'Dọn dẹp thất bại'));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = (record: any, newStatus: string) => {
    confirm({
      title: 'Xác nhận chuyển trạng thái?',
      content: `Chuyển trạng thái cuộc hẹn của ${record.patient_id} thành ${newStatus}`,
      onOk: async () => {
        try {
          await appointmentApi.updateStatus(record.appointment_id, newStatus);
          message.success('Cập nhật trạng thái thành công');
          fetchAppointments();
        } catch (error: any) {
          message.error(getErrorMessage(error, 'Cập nhật thất bại'));
        }
      }
    });
  };

  const getStatusTag = (status: string) => {
    switch (status) {
      case 'PENDING_PAYMENT':
        return <Tag color="warning" icon={<ClockCircleOutlined />}>Chờ thanh toán</Tag>;
      case 'SCHEDULED':
        return <Tag color="processing" icon={<SyncOutlined spin />}>Đã lên lịch</Tag>;
      case 'IN_PROGRESS':
        return <Tag color="blue" icon={<SyncOutlined spin />}>Đang khám</Tag>;
      case 'COMPLETED':
        return <Tag color="success" icon={<CheckCircleOutlined />}>Hoàn thành</Tag>;
      case 'CANCELLED':
        return <Tag color="error" icon={<CloseCircleOutlined />}>Đã hủy</Tag>;
      case 'NO_SHOW':
        return <Tag color="default" icon={<ExclamationCircleOutlined />}>Vắng mặt</Tag>;
      default:
        return <Tag>{status}</Tag>;
    }
  };

  const columns = [
    {
      title: 'Giờ',
      dataIndex: 'start_time',
      key: 'start_time',
      render: (text: string, record: any) => (
        <Text strong>{dayjs(text).format('HH:mm')} - {dayjs(record.end_time).format('HH:mm')}</Text>
      )
    },
    {
      title: 'Bệnh nhân',
      dataIndex: 'patient_id',
      key: 'patient_id',
      render: (text: string) => <Text ellipsis style={{ maxWidth: 150 }} title={text}>{text.split('-')[0]}</Text>
    },
    {
      title: 'Triệu chứng',
      dataIndex: 'symptoms',
      key: 'symptoms',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getStatusTag(status)
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_: any, record: any) => {
        if (record.status === 'SCHEDULED') {
          return (
            <Space>
              <Button size="small" type="primary" onClick={() => handleUpdateStatus(record, 'IN_PROGRESS')}>
                Bắt đầu khám
              </Button>
              <Button size="small" danger onClick={() => handleUpdateStatus(record, 'CANCELLED')}>
                Hủy
              </Button>
            </Space>
          );
        } else if (record.status === 'IN_PROGRESS') {
          return (
            <Button 
              size="small" 
              type="primary" 
              className="bg-green-600" 
              onClick={() => {
                setSelectedAppointment(record);
                setIsRecordModalOpen(true);
              }}
            >
              Ghi bệnh án
            </Button>
          );
        } else if (record.status === 'COMPLETED') {
          return (
            <Button 
              size="small" 
              onClick={() => {
                setSelectedAppointment(record);
                setIsRecordModalOpen(true);
              }}
            >
              Xem bệnh án
            </Button>
          );
        }
        return null;
      }
    }
  ];

  return (
    <Card className="shadow-sm rounded-xl" title={<Title level={4}>Quản lý Cuộc Hẹn</Title>}>
      <div className="flex gap-4 mb-6 bg-gray-50 p-4 rounded-lg">
        <div className="flex-1">
          <Text strong className="mb-2 block">Ngày:</Text>
          <DatePicker 
            className="w-full"
            value={dayjs(selectedDate)}
            onChange={(d) => setSelectedDate(d ? d.format('YYYY-MM-DD') : '')}
          />
        </div>
        <div className="flex-1">
          <Text strong className="mb-2 block">Bác sĩ:</Text>
          <Select
            virtual={false}
            className="w-full"
            allowClear
            placeholder="Tất cả bác sĩ (chỉ áp dụng hôm nay)"
            value={selectedDoctor}
            onChange={setSelectedDoctor}
          >
            {doctors.map(d => (
              <Option key={d.doctor_id} value={d.doctor_id}>
                {d.first_name} {d.last_name}
              </Option>
            ))}
          </Select>
        </div>
        <div className="flex-1">
          <Text strong className="mb-2 block">Trạng thái:</Text>
          <Select
            virtual={false}
            className="w-full"
            allowClear
            placeholder="Tất cả"
            value={statusFilter}
            onChange={setStatusFilter}
          >
            <Option value="SCHEDULED">Đã lên lịch</Option>
            <Option value="IN_PROGRESS">Đang khám</Option>
            <Option value="COMPLETED">Hoàn thành</Option>
          </Select>
        </div>
        <div className="flex items-end gap-2">
          <Button icon={<SyncOutlined />} onClick={fetchAppointments}>
            Làm mới
          </Button>
          <Button type="default" danger icon={<ExclamationCircleOutlined />} onClick={handleCleanup}>
            Dọn dẹp quá hạn
          </Button>
        </div>
      </div>

      <Table
        columns={columns}
        dataSource={appointments}
        rowKey="appointment_id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <MedicalRecordModal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        appointment={selectedAppointment}
        onSuccess={() => fetchAppointments()}
      />
    </Card>
  );
}
