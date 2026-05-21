"use client";

import React, { useEffect, useState } from 'react';
import { Form, Input, Button, DatePicker, Select, message, Spin } from 'antd';
import { patientApi, PatientCreate } from '@/api/patient';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

export default function PatientProfileForm() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    try {
      setFetching(true);
      const data = await patientApi.getMyProfile();
      if (data && data.id) {
        setHasProfile(true);
        form.setFieldsValue({
          ...data,
          dob: data.dob ? dayjs(data.dob) : undefined,
        });
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

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const payload: any = {
        ...values,
        dob: values.dob ? values.dob.format('YYYY-MM-DD') : undefined,
      };

      if (hasProfile) {
        // Prevent sending masked values back to the server
        if (payload.phone && payload.phone.includes('*')) delete payload.phone;
        if (payload.cccd && payload.cccd.includes('*')) delete payload.cccd;
        
        await patientApi.updateMyProfile(payload);
        message.success('Cập nhật hồ sơ bệnh nhân thành công!');
      } else {
        await patientApi.createMyProfile(payload);
        message.success('Tạo hồ sơ bệnh nhân thành công!');
        setHasProfile(true);
      }
    } catch (error: any) {
      message.error(error.response?.data?.detail || 'Lưu hồ sơ thất bại.');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return <div className="flex justify-center p-8"><Spin /></div>;
  }

  return (
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

      <div className="md:col-span-2 flex justify-end">
        <Button type="primary" htmlType="submit" loading={loading}>
          {hasProfile ? 'Cập nhật hồ sơ' : 'Tạo hồ sơ mới'}
        </Button>
      </div>
    </Form>
  );
}
