"use client";

import React, { useEffect, useState } from 'react';
import { Form, Input, Button, DatePicker, Select, message, Spin, Card, Space, Divider, Tag, Typography } from 'antd';
import { SafetyOutlined, CalendarOutlined, CheckCircleOutlined, ExclamationCircleOutlined, SyncOutlined } from '@ant-design/icons';
import { patientApi, PatientCreate, BHYTRecord } from '@/api/patient';
import dayjs from 'dayjs';
import { getErrorMessage } from '@/utils/errorHandler';

const { Option } = Select;
const { TextArea } = Input;
const { Text } = Typography;

export default function PatientProfileForm() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);
  const [patientId, setPatientId] = useState<string | null>(null);
  
  // BHYT States
  const [bhyt, setBhyt] = useState<BHYTRecord | null>(null);
  const [bhytLoading, setBhytLoading] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    try {
      setFetching(true);
      const data = await patientApi.getMyProfile();
      if (data && data.patient_id) {
        setHasProfile(true);
        setPatientId(data.patient_id);
        form.setFieldsValue({
          ...data,
          dob: data.dob ? dayjs(data.dob) : undefined,
        });
        
        // Fetch BHYT
        fetchBHYT(data.patient_id);
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        setHasProfile(false); // No profile yet
      } else {
        message.error('Không thể tải hồ sơ bệnh nhân.');
      }
    } finally {
      setFetching(false);
    }
  }

  async function fetchBHYT(pId: string) {
    try {
      const bhytData = await patientApi.getLatestBHYT(pId);
      setBhyt(bhytData);
    } catch (err) {
      setBhyt(null);
    }
  }

  const handleCreateBHYT = async (values: any) => {
    if (!patientId) return;
    setBhytLoading(true);
    try {
      const payload = {
        patient_id: patientId,
        bhyt_code: values.bhyt_code,
        registered_hospital_code: values.registered_hospital_code,
        valid_from: values.valid_from.format('YYYY-MM-DD'),
        valid_to: values.valid_to.format('YYYY-MM-DD'),
      };
      await patientApi.createBHYT(payload);
      message.success('Đã gửi thông tin BHYT! Chờ quản trị viên xác minh.');
      fetchBHYT(patientId);
    } catch (error: any) {
      message.error(getErrorMessage(error, 'Không thể cập nhật BHYT.'));
    } finally {
      setBhytLoading(false);
    }
  };

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const payload: any = {
        first_name: values.first_name,
        last_name: values.last_name,
        dob: values.dob ? values.dob.format('YYYY-MM-DD') : undefined,
        gender: values.gender,
        phone: values.phone || undefined,
        cccd: values.cccd || undefined,
        blood_type: values.blood_type || undefined,
        address: values.address || undefined,
        emergency_contact_name: values.emergency_contact_name || undefined,
        emergency_contact_phone: values.emergency_contact_phone || undefined,
        allergies: values.allergies || undefined,
        medical_history: values.medical_history || undefined,
      };

      if (hasProfile) {
        // Prevent sending masked values back to the server
        if (payload.phone && payload.phone.includes('*')) delete payload.phone;
        if (payload.cccd && payload.cccd.includes('*')) delete payload.cccd;
        
        await patientApi.updateMyProfile(payload);
        message.success('Cập nhật hồ sơ bệnh nhân thành công!');
      } else {
        const res = await patientApi.createMyProfile(payload);
        message.success('Tạo hồ sơ bệnh nhân thành công!');
        setHasProfile(true);
        setPatientId(res.patient_id);
        
        // Save BHYT if entered during registration
        if (values.bhyt_code) {
          try {
            const bhytPayload = {
              patient_id: res.patient_id,
              bhyt_code: values.bhyt_code,
              registered_hospital_code: values.registered_hospital_code,
              valid_from: values.valid_from.format('YYYY-MM-DD'),
              valid_to: values.valid_to.format('YYYY-MM-DD'),
            };
            await patientApi.createBHYT(bhytPayload);
            message.success('Đăng ký thẻ BHYT thành công! Chờ quản trị viên xác minh.');
          } catch (bhytErr) {
            message.error('Không thể lưu thẻ BHYT. Vui lòng cập nhật lại sau.');
          }
        }
        
        fetchBHYT(res.patient_id);
      }
    } catch (error: any) {
      message.error(getErrorMessage(error, 'Lưu hồ sơ thất bại.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Spin spinning={fetching}>
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-x-6"
      >
      <Form.Item
        name="last_name"
        label="Họ"
        rules={[{ required: true, message: 'Vui lòng nhập họ' }]}
      >
        <Input placeholder="Nhập họ (VD: Nguyễn)" />
      </Form.Item>
      
      <Form.Item
        name="first_name"
        label="Tên"
        rules={[{ required: true, message: 'Vui lòng nhập tên' }]}
      >
        <Input placeholder="Nhập tên (VD: Văn A)" />
      </Form.Item>

      <Form.Item
        name="dob"
        label="Ngày sinh"
        rules={[{ required: true, message: 'Vui lòng chọn ngày sinh' }]}
      >
        <DatePicker className="w-full" format="DD/MM/YYYY" placeholder="Chọn ngày sinh" />
      </Form.Item>

      <Form.Item
        name="gender"
        label="Giới tính"
        rules={[{ required: true, message: 'Vui lòng chọn giới tính' }]}
      >
        <Select placeholder="Chọn giới tính">
          <Option value="MALE">Nam</Option>
          <Option value="FEMALE">Nữ</Option>
          <Option value="OTHER">Khác</Option>
        </Select>
      </Form.Item>

      <Form.Item
        name="phone"
        label="Số điện thoại"
      >
        <Input placeholder="Nhập số điện thoại" />
      </Form.Item>

      <Form.Item
        name="cccd"
        label="CMND/CCCD"
      >
        <Input placeholder="Nhập số CMND hoặc CCCD" />
      </Form.Item>

      <Form.Item
        name="blood_type"
        label="Nhóm máu"
      >
        <Select placeholder="Chọn nhóm máu" allowClear>
          <Option value="A">A</Option>
          <Option value="B">B</Option>
          <Option value="AB">AB</Option>
          <Option value="O">O</Option>
        </Select>
      </Form.Item>

      <Form.Item
        name="address"
        label="Địa chỉ"
        className="md:col-span-2"
      >
        <Input placeholder="Nhập địa chỉ liên hệ" />
      </Form.Item>

      <Form.Item
        name="emergency_contact_name"
        label="Tên người liên hệ khẩn cấp"
      >
        <Input placeholder="Nhập tên người liên hệ" />
      </Form.Item>

      <Form.Item
        name="emergency_contact_phone"
        label="SĐT khẩn cấp"
      >
        <Input placeholder="Nhập số điện thoại khẩn cấp" />
      </Form.Item>

      <Form.Item
        name="allergies"
        label="Dị ứng"
        className="md:col-span-2"
      >
        <TextArea rows={2} placeholder="Các loại dị ứng (nếu có)" />
      </Form.Item>

      <Form.Item
        name="medical_history"
        label="Tiền sử bệnh lý"
        className="md:col-span-2"
      >
        <TextArea rows={3} placeholder="Mô tả tiền sử bệnh lý của bạn" />
      </Form.Item>

      {!hasProfile && (
        <div className="md:col-span-2 mt-4 bg-blue-50/30 p-4 rounded-xl border border-blue-100/50 mb-6">
          <Divider titlePlacement="left" className="m-0 mb-4 border-blue-200">
            <Space>
              <SafetyOutlined className="text-blue-600" />
              <span className="font-semibold text-blue-800 text-sm">Thông tin thẻ Bảo hiểm Y tế (BHYT) - Tùy chọn</span>
            </Space>
          </Divider>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            <Form.Item 
              name="bhyt_code" 
              label="Mã số thẻ BHYT (15 ký tự)" 
              rules={[
                { len: 15, message: 'Mã số thẻ BHYT bắt buộc phải đúng 15 ký tự' }
              ]}
            >
              <Input placeholder="Ví dụ: GD4797932200145" maxLength={15} />
            </Form.Item>

            <Form.Item 
              name="registered_hospital_code" 
              label="Mã nơi đăng ký KCB ban đầu"
            >
              <Input placeholder="Ví dụ: 79-024" />
            </Form.Item>

            <Form.Item 
              name="valid_from" 
              label="Thời hạn từ ngày"
            >
              <DatePicker className="w-full" format="DD/MM/YYYY" placeholder="Chọn ngày" />
            </Form.Item>

            <Form.Item 
              name="valid_to" 
              label="Thời hạn đến ngày"
            >
              <DatePicker className="w-full" format="DD/MM/YYYY" placeholder="Chọn ngày" />
            </Form.Item>
          </div>
        </div>
      )}

      <div className="md:col-span-2 flex justify-end">
        <Button type="primary" htmlType="submit" loading={loading}>
          {hasProfile ? 'Cập nhật hồ sơ' : 'Tạo hồ sơ mới'}
        </Button>
      </div>
    </Form>

    {hasProfile && (
      <>
        <Divider className="my-8" />
        <Card 
          title={
            <Space>
              <SafetyOutlined className="text-xl text-blue-600" />
              <span className="font-bold">Thông tin Bảo hiểm Y tế (BHYT)</span>
            </Space>
          }
          className="shadow-sm rounded-xl border border-gray-100"
        >
          {bhyt ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border">
                <div>
                  <Text className="text-gray-400 block text-xs uppercase font-semibold">Mã số BHYT</Text>
                  <Text className="text-lg font-bold text-gray-800">{bhyt.bhyt_code}</Text>
                </div>
                <div>
                  <Text className="text-gray-400 block text-xs uppercase font-semibold">Trạng thái xác minh</Text>
                  {bhyt.check_status === 'VERIFIED' ? (
                    <Tag color="success" icon={<CheckCircleOutlined />}>Đã xác minh</Tag>
                  ) : bhyt.check_status === 'REJECTED' ? (
                    <Tag color="error" icon={<ExclamationCircleOutlined />}>Bị từ chối</Tag>
                  ) : (
                    <Tag color="orange" icon={<SyncOutlined spin />}>Chờ xác minh</Tag>
                  )}
                </div>
                <div className="mt-2">
                  <Text className="text-gray-400 block text-xs uppercase font-semibold">Nơi ĐK KCB Ban Đầu</Text>
                  <Text className="font-medium text-gray-700">{bhyt.registered_hospital_code || 'Chưa cập nhật'}</Text>
                </div>
                <div className="mt-2">
                  <Text className="text-gray-400 block text-xs uppercase font-semibold">Thời hạn sử dụng</Text>
                  <Text className="font-medium text-gray-700">
                    {dayjs(bhyt.valid_from).format('DD/MM/YYYY')} - {dayjs(bhyt.valid_to).format('DD/MM/YYYY')}
                  </Text>
                </div>
              </div>
              <div className="text-xs text-gray-400">
                * Lưu ý: Thẻ BHYT cần được Admin duyệt xác minh trước khi sử dụng để được khấu trừ chi phí khi đặt lịch khám hoặc thanh toán hóa đơn.
              </div>
            </div>
          ) : (
            <div>
              <Text className="block text-gray-500 mb-6">Bạn chưa cập nhật thông tin thẻ bảo hiểm y tế. Vui lòng điền thông tin bên dưới để được hưởng ưu đãi miễn giảm chi phí khám bệnh.</Text>
              
              <Form layout="vertical" onFinish={handleCreateBHYT}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                  <Form.Item 
                    name="bhyt_code" 
                    label="Mã số thẻ BHYT (15 ký tự)" 
                    rules={[
                      { required: true, message: 'Vui lòng nhập mã thẻ BHYT' },
                      { len: 15, message: 'Mã số thẻ BHYT bắt buộc phải đúng 15 ký tự' }
                    ]}
                  >
                    <Input placeholder="Ví dụ: DN4797932200145" maxLength={15} />
                  </Form.Item>

                  <Form.Item 
                    name="registered_hospital_code" 
                    label="Mã nơi đăng ký KCB ban đầu" 
                    rules={[{ required: true, message: 'Vui lòng nhập mã bệnh viện ĐK KCB' }]}
                  >
                    <Input placeholder="Ví dụ: 79-024" />
                  </Form.Item>

                  <Form.Item 
                    name="valid_from" 
                    label="Thời hạn từ ngày" 
                    rules={[{ required: true, message: 'Vui lòng chọn ngày bắt đầu' }]}
                  >
                    <DatePicker className="w-full" format="DD/MM/YYYY" placeholder="Chọn ngày" />
                  </Form.Item>

                  <Form.Item 
                    name="valid_to" 
                    label="Thời hạn đến ngày" 
                    rules={[{ required: true, message: 'Vui lòng chọn ngày hết hạn' }]}
                  >
                    <DatePicker className="w-full" format="DD/MM/YYYY" placeholder="Chọn ngày" />
                  </Form.Item>
                </div>

                <div className="flex justify-end mt-4">
                  <Button type="primary" htmlType="submit" loading={bhytLoading} className="bg-blue-600 hover:bg-blue-500">
                    Cập nhật BHYT
                  </Button>
                </div>
              </Form>
            </div>
          )}
        </Card>
      </>
    )}
    </Spin>
  );
}
