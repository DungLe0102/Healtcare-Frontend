import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Button, Space, Typography, Tag, App, Spin } from 'antd';
import { FileTextOutlined, EditOutlined, LockOutlined } from '@ant-design/icons';
import { medicalRecordApi, MedicalRecord, MedicalRecordCreate, MedicalRecordUpdate } from '@/api/medical_record';
import { appointmentApi } from '@/api/appointment';
import { getErrorMessage } from '@/utils/errorHandler';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Title, Text } = Typography;

interface MedicalRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: any;
  onSuccess: () => void;
}

export default function MedicalRecordModal({ isOpen, onClose, appointment, onSuccess }: MedicalRecordModalProps) {
  const { message, modal } = App.useApp();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [record, setRecord] = useState<MedicalRecord | null>(null);

  useEffect(() => {
    if (isOpen && appointment) {
      fetchMedicalRecord();
    } else {
      form.resetFields();
      setRecord(null);
    }
  }, [isOpen, appointment]);

  const fetchMedicalRecord = async () => {
    setLoading(true);
    try {
      const data = await medicalRecordApi.getRecordByAppointment(appointment.appointment_id);
      setRecord(data);
      form.setFieldsValue({
        diagnosis: data.diagnosis,
        icd10_code: data.icd10_code,
        symptoms: data.symptoms,
        treatment_plan: data.treatment_plan,
      });
    } catch (error: any) {
      if (error?.response?.status === 404) {
        // Not found, means we create a new one
        setRecord(null);
        form.resetFields();
      } else {
        message.error('Không thể tải thông tin bệnh án');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      
      if (record) {
        // Update
        await medicalRecordApi.updateRecord(record.record_id, values);
        message.success('Đã lưu nháp bệnh án');
      } else {
        // Create
        const payload: MedicalRecordCreate = {
          appointment_id: appointment.appointment_id,
          doctor_id: appointment.doctor_id,
          ...values,
        };
        const newRecord = await medicalRecordApi.createRecord(payload);
        setRecord(newRecord);
        message.success('Đã tạo mới bệnh án');
      }
      onSuccess();
    } catch (error: any) {
      if (error.errorFields) return; // validation error
      message.error(getErrorMessage(error, 'Lưu bệnh án thất bại'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignRecord = () => {
    modal.confirm({
      title: 'Ký số và Hoàn thành khám?',
      content: 'Sau khi ký số, bệnh án sẽ bị khóa vĩnh viễn và không thể chỉnh sửa. Cuộc hẹn sẽ được chuyển sang trạng thái HOÀN THÀNH. Bạn có chắc chắn?',
      icon: <LockOutlined style={{ color: '#faad14' }} />,
      onOk: async () => {
        try {
          setSubmitting(true);
          // Auto-save first
          const values = await form.validateFields();
          let currentRecordId = record?.record_id;
          
          if (!record) {
            const payload: MedicalRecordCreate = {
              appointment_id: appointment.appointment_id,
              doctor_id: appointment.doctor_id,
              ...values,
            };
            const newRecord = await medicalRecordApi.createRecord(payload);
            currentRecordId = newRecord.record_id;
          } else {
            await medicalRecordApi.updateRecord(record.record_id, values);
          }

          // Sign
          if (currentRecordId) {
            await medicalRecordApi.signRecord(currentRecordId, {
              doctor_signature_hash: `signed-by-${appointment.doctor_id}-${Date.now()}` // Mock signature hash
            });
            
            // Mark appointment as COMPLETED
            await appointmentApi.updateStatus(appointment.appointment_id, 'COMPLETED');
            
            message.success('Đã ký số và hoàn thành phiên khám bệnh');
            onSuccess();
            onClose();
          }
        } catch (error: any) {
          if (error.errorFields) return;
          message.error(getErrorMessage(error, 'Thao tác thất bại'));
        } finally {
          setSubmitting(false);
        }
      }
    });
  };

  const isReadOnly = record?.is_signed || appointment?.status === 'COMPLETED' || appointment?.status === 'CANCELLED';

  return (
    <Modal
      title={
        <Space>
          <FileTextOutlined className="text-blue-500" />
          <span>Hồ Sơ Bệnh Án</span>
          {record?.is_signed && <Tag color="success">Đã Ký Số</Tag>}
          {record && !record.is_signed && <Tag color="warning">Bản Nháp</Tag>}
        </Space>
      }
      open={isOpen}
      onCancel={onClose}
      width={700}
      forceRender
      footer={
        <Space>
          <Button onClick={onClose}>Đóng</Button>
          {!isReadOnly && (
            <>
              <Button onClick={handleSaveDraft} loading={submitting} icon={<EditOutlined />}>Lưu nháp</Button>
              <Button type="primary" onClick={handleSignRecord} loading={submitting} className="bg-green-600" icon={<LockOutlined />}>
                Ký số & Hoàn thành khám
              </Button>
            </>
          )}
        </Space>
      }
    >
      <Spin spinning={loading} size="large" tip="Đang tải dữ liệu...">
        <div className="py-4">
          <div className="bg-blue-50 p-4 rounded-lg mb-6 border border-blue-100 flex gap-4 text-sm">
            <div className="flex-1">
              <div><Text type="secondary">Bệnh nhân:</Text> <Text strong>{appointment?.patient?.full_name || appointment?.patient_id}</Text></div>
              <div><Text type="secondary">Ngày khám:</Text> <Text strong>{dayjs(appointment?.start_time).format('DD/MM/YYYY HH:mm')}</Text></div>
            </div>
            <div className="flex-1">
              <div><Text type="secondary">Bác sĩ khám:</Text> <Text strong>{appointment?.doctor?.first_name} {appointment?.doctor?.last_name}</Text></div>
              <div><Text type="secondary">Trạng thái:</Text> <Text strong>{appointment?.status}</Text></div>
            </div>
          </div>

          <Form form={form} layout="vertical" disabled={isReadOnly}>
            <Form.Item
              name="diagnosis"
              label={<span className="font-semibold text-gray-700">Chẩn đoán bệnh (Bắt buộc)</span>}
              rules={[{ required: true, message: 'Vui lòng nhập chẩn đoán' }]}
            >
              <TextArea rows={2} placeholder="Nhập chẩn đoán chính xác..." />
            </Form.Item>

            <Form.Item
              name="icd10_code"
              label={<span className="font-semibold text-gray-700">Mã ICD-10</span>}
            >
              <Input placeholder="VD: J06.9, K29.7..." />
            </Form.Item>

            <Form.Item
              name="symptoms"
              label={<span className="font-semibold text-gray-700">Triệu chứng lâm sàng</span>}
            >
              <TextArea rows={2} placeholder="Mô tả triệu chứng của bệnh nhân..." />
            </Form.Item>

            <Form.Item
              name="treatment_plan"
              label={<span className="font-semibold text-gray-700">Kế hoạch điều trị</span>}
            >
              <TextArea rows={3} placeholder="Hướng dẫn sử dụng thuốc, dặn dò..." />
            </Form.Item>
          </Form>

          {record?.is_signed && record?.signed_at && (
            <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-500">
              <LockOutlined className="mr-2" />
              Bệnh án đã được khóa và ký số vào lúc {dayjs(record.signed_at).format('DD/MM/YYYY HH:mm:ss')}.
              Không thể chỉnh sửa thông tin.
            </div>
          )}
        </div>
      </Spin>
    </Modal>
  );
}
