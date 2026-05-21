"use client";

import React, { useEffect, useState } from 'react';
import { Card, Table, Button, Tag, Space, DatePicker, Select, App, Modal, Form, InputNumber, Popconfirm } from 'antd';
import { CalendarOutlined, SearchOutlined, PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { doctorApi, Schedule, Doctor } from '@/api/doctor';
import { departmentApi, Department } from '@/api/department';
import dayjs from 'dayjs';

const { Option } = Select;
const { RangePicker } = DatePicker;

export default function ScheduleManagement() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(false);
  const { message } = App.useApp();
  
  // Filters
  const [filterDoctorId, setFilterDoctorId] = useState<string | undefined>(undefined);
  const [filterDate, setFilterDate] = useState<string | undefined>(undefined);
  const [filterAvailableOnly, setFilterAvailableOnly] = useState<boolean>(false);

  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [form] = Form.useForm();
  
  // Watch doctor selection in form to fetch rooms
  const formDoctorId = Form.useWatch('doctor_id', form);

  useEffect(() => {
    fetchDoctors();
    fetchDepartments();
  }, []);

  useEffect(() => {
    fetchSchedules();
  }, [filterDoctorId, filterDate, filterAvailableOnly]);

  useEffect(() => {
    if (formDoctorId) {
      const doctor = doctors.find(d => d.doctor_id === formDoctorId);
      if (doctor && doctor.department_id) {
        fetchRooms(doctor.department_id);
      } else {
        setRooms([]);
      }
    }
  }, [formDoctorId]);

  const fetchDoctors = async () => {
    try {
      const data = await doctorApi.getDoctors(0, 100); // Fetch up to max allowed limit (100) for filter map
      setDoctors(data);
    } catch (error) {
      message.error('Lỗi khi tải danh sách bác sĩ');
    }
  };

  const fetchDepartments = async () => {
    try {
      const data = await departmentApi.getDepartments(false);
      setDepartments(data);
    } catch (error) {}
  };

  const fetchRooms = async (departmentId: string) => {
    try {
      const data = await departmentApi.getRoomsByDepartment(departmentId);
      setRooms(data);
    } catch (error) {
      message.error('Lỗi khi tải danh sách phòng khám');
    }
  };

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const data = await doctorApi.getSchedules(filterDoctorId, filterDate, filterAvailableOnly);
      setSchedules(data);
    } catch (error) {
      message.error('Lỗi khi tải danh sách lịch khám');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (record?: Schedule) => {
    setEditingSchedule(record || null);
    if (record) {
      form.setFieldsValue({
        doctor_id: record.doctor_id,
        room_id: record.room_id,
        time_range: [dayjs(record.start_time), dayjs(record.end_time)],
        max_patients: record.max_patients,
        status: record.status,
      });
    } else {
      form.resetFields();
      form.setFieldsValue({ max_patients: 10, status: 'AVAILABLE' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (values: any) => {
    const payload = {
      doctor_id: values.doctor_id,
      room_id: values.room_id,
      start_time: values.time_range[0].format('YYYY-MM-DDTHH:mm:ss'),
      end_time: values.time_range[1].format('YYYY-MM-DDTHH:mm:ss'),
      max_patients: values.max_patients,
      status: values.status,
    };

    try {
      if (editingSchedule) {
        // Exclude doctor_id from payload as it might not be allowed in ScheduleUpdate
        const { doctor_id, ...updatePayload } = payload;
        await doctorApi.updateSchedule(editingSchedule.schedule_id, updatePayload);
        message.success('Cập nhật lịch khám thành công');
      } else {
        await doctorApi.createSchedule(payload);
        message.success('Tạo lịch khám thành công');
      }
      setIsModalOpen(false);
      fetchSchedules();
    } catch (error: any) {
      message.error(error.response?.data?.detail || 'Thao tác thất bại');
    }
  };

  const handleCancelSchedule = async (scheduleId: string) => {
    try {
      await doctorApi.cancelSchedule(scheduleId);
      message.success('Đã hủy lịch khám thành công');
      fetchSchedules();
    } catch (error: any) {
      message.error(error.response?.data?.detail || 'Hủy thất bại');
    }
  };

  const columns = [
    { 
      title: 'Bác Sĩ', 
      dataIndex: 'doctor_id', 
      key: 'doctor_id',
      render: (docId: string) => {
        const doc = doctors.find(d => d.doctor_id === docId);
        return doc ? `${doc.last_name} ${doc.first_name}` : docId;
      }
    },
    { 
      title: 'Phòng', 
      key: 'room',
      render: (_: any, record: Schedule) => {
        if (record.room) {
          return <span className="font-medium text-blue-600">{record.room.room_number}</span>;
        }
        return <span className="text-gray-500 text-xs">{record.room_id.substring(0, 8)}...</span>;
      }
    },
    { 
      title: 'Thời gian', 
      key: 'time',
      render: (_: any, record: Schedule) => (
        <div>
          <div className="text-sm font-medium">{dayjs(record.start_time).format('DD/MM/YYYY')}</div>
          <div className="text-xs text-gray-500">{dayjs(record.start_time).format('HH:mm')} - {dayjs(record.end_time).format('HH:mm')}</div>
        </div>
      )
    },
    { 
      title: 'SL Bệnh nhân', 
      key: 'patients',
      render: (_: any, record: Schedule) => `${record.current_booked} / ${record.max_patients}`
    },
    { 
      title: 'Trạng thái', 
      dataIndex: 'status', 
      key: 'status',
      render: (status: string) => {
        let color = 'blue';
        if (status === 'AVAILABLE') color = 'success';
        if (status === 'FULL') color = 'warning';
        if (status === 'CANCELLED') color = 'error';
        return <Tag color={color}>{status}</Tag>;
      }
    },
    {
      title: 'Hành động',
      key: 'actions',
      render: (_: any, record: Schedule) => (
        <Space size="middle">
          <Button icon={<EditOutlined />} onClick={() => handleOpenModal(record)} size="small" title="Chỉnh sửa" disabled={record.status === 'CANCELLED'} />
          <Popconfirm
            title="Hủy lịch khám?"
            description="Bạn có chắc chắn muốn hủy lịch khám này?"
            onConfirm={() => handleCancelSchedule(record.schedule_id)}
            okText="Có"
            cancelText="Không"
          >
            <Button icon={<DeleteOutlined />} danger size="small" title="Hủy lịch" disabled={record.status === 'CANCELLED' || record.current_booked > 0} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <Card 
        title={<span className="text-xl font-semibold">Quản lý Lịch Khám Tổng (Admin)</span>} 
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenModal()}>
            Thêm Lịch Khám
          </Button>
        }
      >
        <div className="mb-6 flex flex-wrap gap-4 items-center">
          <Select
            placeholder="Lọc theo Bác sĩ"
            value={filterDoctorId}
            onChange={(value) => setFilterDoctorId(value)}
            className="w-64"
            allowClear
            showSearch
            filterOption={(input, option) =>
              (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())
            }
            options={doctors.map(d => ({
              value: d.doctor_id,
              label: `${d.last_name} ${d.first_name} - ${d.specialization}`
            }))}
          />
          
          <DatePicker 
            placeholder="Chọn ngày khám" 
            format="DD/MM/YYYY"
            onChange={(date) => {
              setFilterDate(date ? date.format('YYYY-MM-DD') : undefined);
            }} 
            className="w-48"
          />

          <Select
            placeholder="Trạng thái trống"
            value={filterAvailableOnly}
            onChange={(value) => setFilterAvailableOnly(value)}
            className="w-48"
          >
            <Option value={false}>Tất cả lịch khám</Option>
            <Option value={true}>Chỉ lịch còn trống</Option>
          </Select>

          <Button 
            icon={<SearchOutlined />} 
            onClick={fetchSchedules}
          >
            Làm mới
          </Button>
        </div>

        <Table 
          columns={columns} 
          dataSource={schedules} 
          rowKey="schedule_id" 
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title={editingSchedule ? "Sửa Lịch Khám" : "Thêm Lịch Khám Mới"}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="doctor_id" label="Bác sĩ" rules={[{ required: true, message: 'Vui lòng chọn bác sĩ' }]}>
            <Select 
              placeholder="Chọn bác sĩ" 
              showSearch 
              disabled={!!editingSchedule}
              filterOption={(input, option) =>
                (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())
              }
              options={doctors.map(d => ({
                value: d.doctor_id,
                label: `${d.last_name} ${d.first_name} - ${d.specialization}`
              }))}
            />
          </Form.Item>
          
          <Form.Item name="room_id" label="Phòng Khám" rules={[{ required: true, message: 'Vui lòng chọn phòng' }]}>
            <Select 
              placeholder={
                !formDoctorId 
                  ? "Vui lòng chọn bác sĩ trước" 
                  : rooms.length === 0 
                    ? "Khoa của bác sĩ này chưa có phòng khám (hoặc chưa xếp khoa)" 
                    : "Chọn phòng khám"
              }
              disabled={!formDoctorId || rooms.length === 0}
            >
              {rooms.map(room => (
                <Option key={room.room_id} value={room.room_id}>
                  {room.room_number} - {room.room_type}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="time_range" label="Thời gian bắt đầu - kết thúc" rules={[{ required: true, message: 'Vui lòng chọn thời gian' }]}>
            <RangePicker 
              showTime={{ format: 'HH:mm' }} 
              format="YYYY-MM-DD HH:mm" 
              className="w-full"
            />
          </Form.Item>
          
          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="max_patients" label="Số lượng bệnh nhân tối đa" rules={[{ required: true, message: 'Nhập số lượng' }]}>
              <InputNumber className="w-full" min={1} />
            </Form.Item>

            {editingSchedule && (
              <Form.Item name="status" label="Trạng thái">
                <Select>
                  <Option value="AVAILABLE">AVAILABLE</Option>
                  <Option value="FULL">FULL</Option>
                  <Option value="CANCELLED">CANCELLED</Option>
                </Select>
              </Form.Item>
            )}
          </div>

          <Form.Item className="mt-6 mb-0 text-right">
            <Space>
              <Button onClick={() => setIsModalOpen(false)}>Hủy</Button>
              <Button type="primary" htmlType="submit">Lưu</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

