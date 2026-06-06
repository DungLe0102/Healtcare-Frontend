"use client";

import React, { useEffect, useState } from 'react';
import { Table, Tag, Typography, message, Space, Button, Modal, Form, Input, Select } from 'antd';
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

  // States for cancel form
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelForm] = Form.useForm();
  const [selectedApptId, setSelectedApptId] = useState<string | null>(null);
  const [isScheduledAppt, setIsScheduledAppt] = useState(false);

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
            <div><strong>Ngày khám:</strong> {dayjs(detail.appointment_date).format('DD/MM/YYYY')}</div>
            <div><strong>Thời gian:</strong> {dayjs(detail.appointment_date).format('HH:mm')} - {dayjs(detail.appointment_date).add(30, 'minute').format('HH:mm')}</div>
            <div><strong>Trạng thái:</strong> {getStatusTag(detail.status)}</div>
            <div><strong>Triệu chứng:</strong> {detail.symptoms || 'Không có'}</div>
            {(detail.doctor_name || detail.doctor) && (
              <div>
                <strong>Bác sĩ:</strong> {detail.doctor_name || `${detail.doctor?.first_name} ${detail.doctor?.last_name}`} 
                {(detail.specialization || detail.doctor?.specialization) && ` - ${detail.specialization || detail.doctor?.specialization}`}
              </div>
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

  const handleCancelClick = (record: any) => {
    setSelectedApptId(record.appointment_id);
    setIsScheduledAppt(record.status === 'SCHEDULED');
    cancelForm.resetFields();
    setIsCancelModalOpen(true);
  };

  const handleCancelSubmit = async (values: any) => {
    if (!selectedApptId) return;
    try {
      const refundData = isScheduledAppt ? {
        refund_bank_code: values.refund_bank_code,
        refund_account_no: values.refund_account_no,
        refund_account_name: values.refund_account_name,
        refund_reason: values.refund_reason,
      } : undefined;

      await appointmentApi.cancelAppointment(selectedApptId, refundData);
      message.success('Hủy cuộc hẹn thành công');
      setIsCancelModalOpen(false);
      fetchPatientAndAppointments();
    } catch (error: any) {
      message.error(getErrorMessage(error, 'Không thể hủy cuộc hẹn'));
    }
  };

  const columns = [
    {
      title: 'Ngày khám',
      dataIndex: 'appointment_date',
      key: 'appointment_date',
      render: (text: string) => <Text strong>{dayjs(text).format('DD/MM/YYYY')}</Text>
    },
    {
      title: 'Thời gian',
      key: 'time',
      render: (_: any, record: any) => (
        <Text>{dayjs(record.appointment_date).format('HH:mm')} - {dayjs(record.appointment_date).add(30, 'minute').format('HH:mm')}</Text>
      )
    },
    {
      title: 'Bác sĩ',
      dataIndex: 'doctor_name',
      key: 'doctor_name',
      render: (text: string, record: any) => (
        <div>
          <Text strong>{text || 'Chưa phân công'}</Text>
          {record.specialization && <span className="text-xs text-blue-500 block">{record.specialization}</span>}
        </div>
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
        <Space size="small">
          <Button 
            type="link" 
            icon={<EyeOutlined />} 
            onClick={() => showDetail(record.appointment_id)}
          >
            Chi tiết
          </Button>
          {(record.status === 'PENDING_PAYMENT' || record.status === 'SCHEDULED') && (
            <Button 
              type="link" 
              danger 
              icon={<CloseCircleOutlined />} 
              onClick={() => handleCancelClick(record)}
            >
              Hủy lịch
            </Button>
          )}
        </Space>
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

      <Modal
        title="Xác nhận hủy lịch khám"
        open={isCancelModalOpen}
        onCancel={() => setIsCancelModalOpen(false)}
        footer={null}
        forceRender
      >
        <div className="mb-4">
          <Text>Bạn có chắc chắn muốn hủy cuộc hẹn này không?</Text>
          {isScheduledAppt && (
            <div className="bg-yellow-50 p-3 mt-2 rounded border border-yellow-200">
              <Text className="text-yellow-800 text-xs">
                Lịch này đã được thanh toán. Vui lòng điền thông tin tài khoản ngân hàng để hệ thống ghi nhận yêu cầu hoàn tiền.
              </Text>
            </div>
          )}
        </div>
        <Form form={cancelForm} layout="vertical" onFinish={handleCancelSubmit}>
          {isScheduledAppt && (
            <>
              <Form.Item 
                name="refund_bank_code" 
                label="Ngân hàng nhận hoàn tiền" 
                rules={[{ required: true, message: 'Vui lòng chọn ngân hàng!' }]}
              >
                <Select placeholder="Chọn ngân hàng nhận tiền...">
                  <Select.Option value="VCB">Vietcombank (VCB)</Select.Option>
                  <Select.Option value="CTG">VietinBank (CTG)</Select.Option>
                  <Select.Option value="BIDV">BIDV (BIDV)</Select.Option>
                  <Select.Option value="TCB">Techcombank (TCB)</Select.Option>
                  <Select.Option value="MB">MBBank (MB)</Select.Option>
                  <Select.Option value="ACB">ACB (ACB)</Select.Option>
                  <Select.Option value="VPB">VPBank (VPB)</Select.Option>
                  <Select.Option value="STB">Sacombank (STB)</Select.Option>
                  <Select.Option value="HDB">HDBank (HDB)</Select.Option>
                </Select>
              </Form.Item>

              <Form.Item 
                name="refund_account_no" 
                label="Số tài khoản nhận" 
                rules={[{ required: true, message: 'Vui lòng nhập số tài khoản!' }]}
              >
                <Input placeholder="Nhập số tài khoản ngân hàng..." />
              </Form.Item>

              <Form.Item 
                name="refund_account_name" 
                label="Tên chủ tài khoản (viết hoa không dấu)"
                rules={[{ required: true, message: 'Vui lòng nhập tên chủ tài khoản!' }]}
              >
                <Input placeholder="Nhập tên chủ tài khoản, ví dụ: NGUYEN VAN A..." />
              </Form.Item>

              <Form.Item 
                name="refund_reason" 
                label="Lý do hủy lịch" 
                rules={[{ required: true, message: 'Vui lòng nhập lý do hủy lịch!' }]}
              >
                <Input.TextArea rows={2} placeholder="Nhập lý do hủy..." />
              </Form.Item>
            </>
          )}

          {!isScheduledAppt && (
            <Form.Item 
              name="refund_reason" 
              label="Lý do hủy lịch (không bắt buộc)" 
            >
              <Input.TextArea rows={2} placeholder="Nhập lý do hủy..." />
            </Form.Item>
          )}

          <div className="flex justify-end gap-2 mt-4">
            <Button onClick={() => setIsCancelModalOpen(false)}>Quay lại</Button>
            <Button type="primary" danger htmlType="submit">Xác nhận hủy lịch</Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
