"use client";

import React, { useEffect, useState } from 'react';
import { Table, Tag, Typography, message, Space, Button, Modal } from 'antd';
import { SyncOutlined, CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined, ExclamationCircleOutlined, EyeOutlined } from '@ant-design/icons';
import { appointmentApi } from '@/api/appointment';
import { patientApi } from '@/api/patient';
import dayjs from 'dayjs';
import { getErrorMessage } from '@/utils/errorHandler';

const { Text } = Typography;

export default function PatientAppointmentHistory() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [patientId, setPatientId] = useState<string | null>(null);

  useEffect(() => {
    fetchPatientAndAppointments();
  }, []);

  const fetchPatientAndAppointments = async () => {
    setLoading(true);
    try {
      const profile = await patientApi.getMyProfile();
      setPatientId(profile.patient_id);
      
      const res = await appointmentApi.getPatientAppointments(profile.patient_id);
      setAppointments(res.appointments || res.items || []);
    } catch (error: any) {
      message.error(getErrorMessage(error, 'Không thể tải lịch sử cuộc hẹn'));
    } finally {
      setLoading(false);
    }
  };

  const showDetail = async (appointmentId: string) => {
    try {
      const detail = await appointmentApi.getAppointment(appointmentId);
      Modal.info({
        title: 'Chi tiết cuộc hẹn',
        width: 600,
        content: (
          <div className="mt-4 flex flex-col gap-3">
            <div><strong>Mã cuộc hẹn:</strong> {detail.appointment_id.split('-')[0]}</div>
            <div><strong>Ngày khám:</strong> {detail.appointment_date}</div>
            <div><strong>Thời gian:</strong> {dayjs(detail.start_time).format('HH:mm')} - {dayjs(detail.end_time).format('HH:mm')}</div>
            <div><strong>Trạng thái:</strong> {getStatusTag(detail.status)}</div>
            <div><strong>Triệu chứng:</strong> {detail.symptoms || 'Không có'}</div>
            {detail.doctor && (
              <div>
                <strong>Bác sĩ:</strong> {detail.doctor.first_name} {detail.doctor.last_name} 
                {detail.doctor.specialization && ` - ${detail.doctor.specialization}`}
              </div>
            )}
            {detail.room && (
              <div><strong>Phòng khám:</strong> {detail.room.room_number}</div>
            )}
          </div>
        ),
        okText: 'Đóng'
      });
    } catch (error: any) {
      message.error('Không thể lấy chi tiết cuộc hẹn');
    }
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
      title: 'Ngày khám',
      dataIndex: 'appointment_date',
      key: 'appointment_date',
      render: (text: string) => <Text strong>{text}</Text>
    },
    {
      title: 'Thời gian',
      key: 'time',
      render: (_: any, record: any) => (
        <Text>{dayjs(record.start_time).format('HH:mm')} - {dayjs(record.end_time).format('HH:mm')}</Text>
      )
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getStatusTag(status)
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_: any, record: any) => (
        <Button 
          type="link" 
          icon={<EyeOutlined />} 
          onClick={() => showDetail(record.appointment_id)}
        >
          Chi tiết
        </Button>
      )
    }
  ];

  return (
    <div className="mt-4">
      <div className="flex justify-between items-center mb-4">
        <Typography.Title level={5}>Lịch sử khám bệnh</Typography.Title>
        <Button icon={<SyncOutlined />} onClick={fetchPatientAndAppointments} loading={loading}>
          Làm mới
        </Button>
      </div>
      <Table 
        columns={columns} 
        dataSource={appointments} 
        rowKey="appointment_id"
        loading={loading}
        pagination={{ pageSize: 5 }}
      />
    </div>
  );
}
