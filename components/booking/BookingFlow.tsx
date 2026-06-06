"use client";

import React, { useState, useEffect } from 'react';
import { Steps, Card, DatePicker, Select, Button, Form, Input, Typography, Tag, Spin, Result, App } from 'antd';
import { getErrorMessage } from '@/utils/errorHandler';
import { CalendarOutlined, InfoCircleOutlined, QrcodeOutlined, CheckCircleOutlined, SafetyOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { patientApi } from '@/api/patient';
import { doctorApi } from '@/api/doctor';
import { departmentApi } from '@/api/department';
import { appointmentApi } from '@/api/appointment';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

export default function BookingFlow() {
  const { message } = App.useApp();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [patientId, setPatientId] = useState<string | null>(null);

  // Data step 1
  const [departments, setDepartments] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [selectedDept, setSelectedDept] = useState<string | undefined>();
  const [selectedDate, setSelectedDate] = useState<string>(dayjs().add(1, 'day').format('YYYY-MM-DD'));
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [selectedSchedule, setSelectedSchedule] = useState<any | null>(null);

  // Data step 2
  const [activeBHYT, setActiveBHYT] = useState<any | null>(null);
  const [formStep2] = Form.useForm();

  // Data step 3 & 4
  const [appointmentData, setAppointmentData] = useState<any | null>(null);

  useEffect(() => {
    // Check patient logged in
    const role = localStorage.getItem('user_role');
    if (role !== 'PATIENT') {
      message.error('Chỉ bệnh nhân mới có thể đặt lịch khám');
      return;
    }
    fetchPatientData();
    fetchDepartments();
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      const res = await doctorApi.getDoctors(0, 100);
      setDoctors(res);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (selectedDate) {
      fetchSchedules();
    }
  }, [selectedDate, selectedDept]);

  const fetchPatientData = async () => {
    try {
      const profile = await patientApi.getMyProfile();
      setPatientId(profile.patient_id);

      // Get active BHYT if any (using list endpoint to avoid 404 error in console)
      try {
        const bhytList = await patientApi.getPatientBHYTList(profile.patient_id);
        const active = bhytList.find((b: any) =>
          b.is_active &&
          b.check_status === 'VERIFIED' &&
          dayjs().isBefore(dayjs(b.valid_to).endOf('day')) &&
          dayjs().isAfter(dayjs(b.valid_from).startOf('day'))
        );
        setActiveBHYT(active || null);
      } catch (err) {
        setActiveBHYT(null);
      }
    } catch (error) {
      message.error('Lỗi lấy thông tin bệnh nhân');
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await departmentApi.getDepartments();
      setDepartments(res);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const slots = await doctorApi.getAvailableSlots(selectedDate, selectedDept);
      setAvailableSlots(slots);
    } catch (error) {
      message.error('Không thể lấy lịch khám');
    } finally {
      setLoading(false);
    }
  };

  const handleNextToStep2 = () => {
    if (!selectedSchedule) {
      message.warning('Vui lòng chọn một ca khám');
      return;
    }
    setCurrentStep(1);
  };

  const handleBookAppointment = async (values: any) => {
    if (!patientId || !selectedSchedule) return;

    setLoading(true);
    try {
      const payload = {
        patient_id: patientId,
        schedule_id: selectedSchedule.schedule_id,
        symptoms: values.symptoms,
        applied_bhyt_id: values.use_bhyt && activeBHYT ? activeBHYT.bhyt_id : undefined,
      };

      const result = await appointmentApi.bookAppointment(payload);

      // Nếu backend chưa trả thẳng vietqr_url, ta sẽ gọi API lấy mã QR
      if (result.billing_id && !result.vietqr_url) {
        try {
          const qrData = await appointmentApi.getVietQR(result.billing_id);
          result.vietqr_url = qrData.qr_url || qrData.vietqr_url;
          result.transaction_id = qrData.transaction_id;
        } catch (e: any) {
          console.error('Không thể tự động tải mã QR:', e);
          message.error('Hệ thống ngân hàng VietQR đang bảo trì hoặc lỗi kết nối.');
          result.vietqr_url = "ERROR";
        }
      } else if (!result.vietqr_url) {
        console.error('Backend không trả về billing_id hoặc vietqr_url', result);
        result.vietqr_url = "ERROR";
      }

      setAppointmentData(result);
      setCurrentStep(2);
      message.success('Đặt lịch thành công, vui lòng thanh toán.');
    } catch (error: any) {
      message.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleSimulatePayment = async () => {
    if (!appointmentData?.transaction_id) {
      message.error('Không có thông tin giao dịch để thanh toán');
      return;
    }
    setLoading(true);
    try {
      // Amount must be the total amount, we can pass a dummy large amount that satisfies it
      await appointmentApi.simulatePayment(appointmentData.transaction_id, 500000);
      message.success('Thanh toán thành công!');
      setCurrentStep(3);
    } catch (error: any) {
      message.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const getDoctorName = (doctorId: string) => {
    const doc = doctors.find(d => d.doctor_id === doctorId);
    return doc ? `${doc.last_name} ${doc.first_name}` : 'Bác sĩ ẩn danh';
  };

  const getDoctorSpecialization = (doctorId: string) => {
    const doc = doctors.find(d => d.doctor_id === doctorId);
    return doc ? doc.specialization : '';
  };

  const renderStep1 = () => (
    <div className="mt-6">
      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <Text strong>Chọn ngày khám:</Text>
          <DatePicker
            className="w-full mt-2"
            value={dayjs(selectedDate)}
            onChange={(d) => setSelectedDate(d ? d.format('YYYY-MM-DD') : '')}
            disabledDate={(current) => current && current < dayjs().startOf('day')}
          />
        </div>
        <div className="flex-1">
          <Text strong>Chuyên khoa (Tùy chọn):</Text>
          <Select
            virtual={false}
            className="w-full mt-2"
            allowClear
            placeholder="Tất cả chuyên khoa"
            value={selectedDept}
            onChange={setSelectedDept}
          >
            {departments.map(d => (
              <Option key={d.department_id} value={d.department_id}>{d.department_name}</Option>
            ))}
          </Select>
        </div>
      </div>

      <Spin spinning={loading}>
        <Title level={5}>Các ca khám trống ({availableSlots.length})</Title>
        {availableSlots.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 mt-4">
            {availableSlots.map(item => (
              <Card
                key={item.schedule_id}
                hoverable
                className={`cursor-pointer transition-all ${selectedSchedule?.schedule_id === item.schedule_id ? 'border-blue-500 bg-blue-50' : ''}`}
                onClick={() => setSelectedSchedule(item)}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="font-semibold text-lg text-blue-800">
                    Bác sĩ {getDoctorName(item.doctor_id)}
                  </div>
                  <div className="flex flex-col gap-1 items-end">
                    <Tag color="purple">Giờ làm việc: {dayjs(item.start_time).format('HH:mm')}</Tag>
                    <Tag color="geekblue">Giờ kết thúc: {dayjs(item.end_time).format('HH:mm')}</Tag>
                  </div>
                </div>
                <div className="text-sm text-gray-500 mb-2">
                  Chuyên khoa: {getDoctorSpecialization(item.doctor_id) || 'Chưa rõ'}
                </div>
                <div className="flex justify-between items-center text-sm mt-3 pt-3 border-t border-gray-100">
                  <div className="text-gray-700">
                    <span className="font-medium mr-1">Phòng khám:</span><Tag color="blue">{item.room?.room_number || 'Chưa xếp'}</Tag>
                  </div>
                  <div className="text-gray-700">
                    <span className="font-medium mr-1">Còn trống:</span><Tag color={(item.slots_remaining ?? 0) > 0 ? "green" : "red"}>{item.slots_remaining ?? 0} slot</Tag>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center p-8 text-gray-500 mt-4 bg-gray-50 rounded-lg">
            Không có ca khám nào trống
          </div>
        )}
      </Spin>
      <div className="mt-6 flex justify-end">
        <Button type="primary" size="large" onClick={handleNextToStep2} disabled={!selectedSchedule}>
          Tiếp tục
        </Button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="mt-6 max-w-lg mx-auto">
      <Card className="mb-6 bg-gray-50">
        <Title level={5}>Thông tin ca khám</Title>
        <p><strong>Bác sĩ:</strong> {selectedSchedule ? getDoctorName(selectedSchedule.doctor_id) : ''}</p>
        <p><strong>Ngày:</strong> {selectedDate}</p>
        <p><strong>Giờ làm việc:</strong> {selectedSchedule ? dayjs(selectedSchedule.start_time).format('HH:mm') : ''}</p>
        <p><strong>Giờ kết thúc:</strong> {selectedSchedule ? dayjs(selectedSchedule.end_time).format('HH:mm') : ''}</p>
        <p><strong>Phòng khám:</strong> {selectedSchedule?.room?.room_number || 'Chưa xếp'}</p>
      </Card>

      <Form layout="vertical" form={formStep2} onFinish={handleBookAppointment}>
        <Form.Item name="symptoms" label="Triệu chứng" rules={[{ required: true, message: 'Vui lòng mô tả triệu chứng' }]}>
          <TextArea rows={4} placeholder="Mô tả triệu chứng của bạn để bác sĩ có thể chuẩn bị tốt hơn" />
        </Form.Item>

        {activeBHYT && (
          <Form.Item name="use_bhyt" valuePropName="checked">
            <Card size="small" className="border-blue-200 bg-blue-50">
              <Form.Item name="use_bhyt" valuePropName="checked" noStyle>
                <div className="flex items-center">
                  <input type="checkbox" id="use_bhyt" className="mr-2" defaultChecked />
                  <label htmlFor="use_bhyt" className="font-semibold cursor-pointer">
                    Sử dụng thẻ BHYT ({activeBHYT.bhyt_code})
                  </label>
                </div>
              </Form.Item>
            </Card>
          </Form.Item>
        )}

        <div className="mt-8 flex justify-between">
          <Button onClick={() => setCurrentStep(0)}>Quay lại</Button>
          <Button type="primary" htmlType="submit" loading={loading} size="large">
            Đặt lịch & Thanh toán
          </Button>
        </div>
      </Form>
    </div>
  );

  const renderStep3 = () => {
    const total = appointmentData?.total_amount ?? 150000;
    const bhytCovered = appointmentData?.bhyt_covered_amount ?? 0;
    const patientPaid = appointmentData?.patient_paid_amount ?? total;

    return (
      <div className="mt-6 text-center max-w-md mx-auto">
        <Title level={4} style={{ fontWeight: 700 }}>Thanh toán phí khám bệnh</Title>
        <Text className="text-gray-500 mb-6 block">Vui lòng dùng ứng dụng ngân hàng quét mã QR dưới đây. Bạn có 10 phút để thanh toán trước khi bị hủy lịch tự động.</Text>

        <Card className="mb-6 rounded-xl border border-blue-100 bg-gradient-to-br from-white to-blue-50/20 text-left shadow-sm">
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <Text className="text-gray-500">Giá khám gốc:</Text>
              <Text strong className="text-gray-800">{total.toLocaleString('vi-VN')} đ</Text>
            </div>
            {bhytCovered > 0 && (
              <div className="flex justify-between items-center text-sm">
                <Text className="text-green-600 flex items-center">
                  <SafetyOutlined className="mr-1" /> BHYT hỗ trợ (80%):
                </Text>
                <Text strong className="text-green-600">-{bhytCovered.toLocaleString('vi-VN')} đ</Text>
              </div>
            )}
            <div className="pt-2 border-t border-dashed border-gray-200 flex justify-between items-center">
              <Text strong className="text-gray-700">Số tiền cần thanh toán:</Text>
              <Text strong className="text-lg text-red-600">{patientPaid.toLocaleString('vi-VN')} đ</Text>
            </div>
          </div>
        </Card>

        {appointmentData?.vietqr_url === "ERROR" ? (
          <div className="h-64 flex flex-col items-center justify-center bg-red-50 text-red-500 rounded-xl mb-6 border border-red-200 p-4">
            <InfoCircleOutlined className="text-3xl mb-2" />
            <Text className="text-red-600 font-semibold">Lỗi kết nối đến cổng thanh toán VietQR.</Text>
            <Text className="text-sm text-red-500 mt-2">Dịch vụ tạo mã QR đang tạm gián đoạn. Vui lòng sử dụng nút "Mô phỏng thanh toán" bên dưới để hoàn tất luồng đặt lịch.</Text>
          </div>
        ) : appointmentData?.vietqr_url ? (
          <div className="bg-white p-4 rounded-xl shadow-sm inline-block mb-6 border">
            <img src={appointmentData.vietqr_url} alt="VietQR" className="w-64 h-64 object-contain" />
          </div>
        ) : (
          <div className="h-64 flex flex-col items-center justify-center bg-gray-100 rounded-xl mb-6">
            <Spin />
            <Text className="mt-4 text-gray-500">Đang khởi tạo mã QR...</Text>
          </div>
        )}

        <div className="p-4 bg-yellow-50 rounded-lg text-yellow-800 text-sm mb-6 text-left">
          <strong>Dành cho Demo:</strong> Bạn có thể sử dụng nút bên dưới để giả lập ngân hàng đã gửi Webhook thanh toán thành công.
        </div>

        <Button
          type="primary"
          size="large"
          block
          onClick={handleSimulatePayment}
          loading={loading}
          className="bg-green-600 hover:bg-green-700 border-green-600"
        >
          Mô phỏng thanh toán (Webhook)
        </Button>
      </div>
    );
  };

  const renderStep4 = () => (
    <div className="mt-6">
      <Result
        status="success"
        title="Đặt lịch khám thành công!"
        subTitle={`Mã số cuộc hẹn của bạn: ${appointmentData?.appointment_id.split('-')[0]}`}
        extra={[
          <Button type="primary" key="console" onClick={() => window.location.href = '/dashboard'}>
            Về trang chủ
          </Button>,
          <Button key="buy" onClick={() => window.location.reload()}>Đặt thêm lịch</Button>,
        ]}
      />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card className="shadow-md rounded-2xl border-0">
        <Title level={2} className="text-center mb-8 text-blue-800">Đặt lịch khám bệnh</Title>
        <Steps
          current={currentStep}
          items={[
            { title: 'Chọn lịch', icon: <CalendarOutlined /> },
            { title: 'Thông tin', icon: <InfoCircleOutlined /> },
            { title: 'Thanh toán', icon: <QrcodeOutlined /> },
            { title: 'Hoàn tất', icon: <CheckCircleOutlined /> },
          ]}
          className="mb-8"
        />

        <div className={currentStep === 0 ? 'block' : 'hidden'}>{renderStep1()}</div>
        <div className={currentStep === 1 ? 'block' : 'hidden'}>{renderStep2()}</div>
        <div className={currentStep === 2 ? 'block' : 'hidden'}>{renderStep3()}</div>
        <div className={currentStep === 3 ? 'block' : 'hidden'}>{renderStep4()}</div>
      </Card>
    </div>
  );
}
