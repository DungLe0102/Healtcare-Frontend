"use client";

import React, { useEffect, useState } from 'react';
import { Card, Table, Button, Tag, Space, Modal, Form, Input, DatePicker, Select, App, Descriptions, Divider, Popconfirm, Tabs } from 'antd';
import { PlusOutlined, SearchOutlined, EyeOutlined, EditOutlined, DeleteOutlined, CreditCardOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { patientApi, PatientResponse, PatientWithBHYT, ConsentResponse, BHYTRecord } from '@/api/patient';
import { medicalRecordApi, MedicalRecord } from '@/api/medical_record';
import dayjs from 'dayjs';
import { getErrorMessage } from '@/utils/errorHandler';

const { Option } = Select;

export default function PatientManagement() {
  const [patients, setPatients] = useState<PatientResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isBhytModalOpen, setIsBhytModalOpen] = useState(false);

  const [editingPatient, setEditingPatient] = useState<PatientResponse | null>(null);
  const [editingBhyt, setEditingBhyt] = useState<any | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<PatientWithBHYT | null>(null);
  const [patientConsents, setPatientConsents] = useState<ConsentResponse[]>([]);
  const [patientMedicalRecords, setPatientMedicalRecords] = useState<MedicalRecord[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  const [form] = Form.useForm();
  const [bhytForm] = Form.useForm();
  const { message } = App.useApp();

  // Filters and Pagination
  const [search, setSearch] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  useEffect(() => {
    fetchPatients(1, search);
  }, []);

  const fetchPatients = async (page: number, query: string) => {
    setLoading(true);
    try {
      const skip = (page - 1) * pageSize;
      const data = await patientApi.getPatients(skip, pageSize, query);
      setPatients(data);
    } catch (error) {
      message.error('Lỗi khi tải danh sách bệnh nhân');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
    fetchPatients(1, value);
  };

  const handleTableChange = (pagination: any) => {
    setCurrentPage(pagination.current);
    fetchPatients(pagination.current, search);
  };

  const handleOpenModal = (record?: PatientResponse) => {
    setEditingPatient(record || null);
    if (record) {
      form.setFieldsValue({
        ...record,
        dob: record.dob ? dayjs(record.dob) : undefined,
      });
    } else {
      form.resetFields();
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (values: any) => {
    try {
      const payload = {
        ...values,
        dob: values.dob ? values.dob.format('YYYY-MM-DD') : undefined,
      };

      if (editingPatient) {
        await patientApi.updatePatient(editingPatient.patient_id, payload);
        message.success('Cập nhật hồ sơ bệnh nhân thành công');
      } else {
        await patientApi.createPatient(payload);
        message.success('Tạo hồ sơ bệnh nhân thành công');
      }
      setIsModalOpen(false);
      fetchPatients(currentPage, search);

      // Update selected patient detail if it's currently open
      if (isDetailModalOpen && selectedPatient && editingPatient && (selectedPatient.patient_id === editingPatient.patient_id)) {
        handleViewDetails(selectedPatient.patient_id);
      }
    } catch (error: any) {
      message.error(getErrorMessage(error, 'Thao tác thất bại'));
    }
  };

  const handleDelete = async (patientId: string) => {
    try {
      await patientApi.deletePatient(patientId);
      message.success('Đã xóa hồ sơ bệnh nhân thành công');
      fetchPatients(currentPage, search);
    } catch (error: any) {
      message.error(getErrorMessage(error, 'Xóa thất bại'));
    }
  };

  const handleViewDetails = async (patientId: string) => {
    setIsDetailModalOpen(true);
    setDetailLoading(true);
    try {
      const data = await patientApi.getPatientById(patientId);
      setSelectedPatient(data);

      try {
        const consents = await patientApi.getPatientConsents(patientId);
        setPatientConsents(consents);
      } catch (cErr) {
        console.error("Lỗi khi tải đồng thuận", cErr);
      }

      try {
        const records = await medicalRecordApi.getRecordsByPatient(patientId);
        setPatientMedicalRecords(records);
      } catch (mErr) {
        console.error("Lỗi khi tải bệnh án", mErr);
      }

    } catch (error) {
      message.error('Lỗi khi tải chi tiết bệnh nhân');
      setIsDetailModalOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleOpenBhytModal = (bhytRecord?: any) => {
    setEditingBhyt(bhytRecord || null);
    if (bhytRecord) {
      bhytForm.setFieldsValue({
        ...bhytRecord,
        valid_from: bhytRecord.valid_from ? dayjs(bhytRecord.valid_from) : undefined,
        valid_to: bhytRecord.valid_to ? dayjs(bhytRecord.valid_to) : undefined,
      });
    } else {
      bhytForm.resetFields();
    }
    setIsBhytModalOpen(true);
  };

  const handleBhytSubmit = async (values: any) => {
    if (!selectedPatient) return;
    try {
      if (editingBhyt) {
        const payload = {
          valid_from: values.valid_from ? values.valid_from.format('YYYY-MM-DD') : undefined,
          valid_to: values.valid_to ? values.valid_to.format('YYYY-MM-DD') : undefined,
          registered_hospital_code: values.registered_hospital_code,
        };
        await patientApi.updateBHYT(editingBhyt.bhyt_id, payload);
        message.success('Cập nhật BHYT thành công');
      } else {
        const payload = {
          patient_id: selectedPatient.patient_id,
          bhyt_code: values.bhyt_code,
          registered_hospital_code: values.registered_hospital_code,
          valid_from: values.valid_from ? values.valid_from.format('YYYY-MM-DD') : undefined,
          valid_to: values.valid_to ? values.valid_to.format('YYYY-MM-DD') : undefined,
        };
        await patientApi.createBHYT(payload);
        message.success('Đăng ký BHYT mới thành công');
      }
      setIsBhytModalOpen(false);
      handleViewDetails(selectedPatient.patient_id);
    } catch (error: any) {
      message.error(getErrorMessage(error, 'Thao tác BHYT thất bại'));
    }
  };

  const handleVerifyBHYT = async (bhytId: string, status: 'VERIFIED' | 'REJECTED') => {
    try {
      await patientApi.verifyBHYT(bhytId, { check_status: status });
      message.success(`Đã ${status === 'VERIFIED' ? 'xác minh hợp lệ' : 'từ chối'} thẻ BHYT`);
      if (selectedPatient) {
        handleViewDetails(selectedPatient.patient_id);
      }
    } catch (error: any) {
      message.error('Thao tác thất bại');
    }
  };

  const columns = [
    {
      title: 'Họ và Tên',
      key: 'full_name',
      render: (_: any, record: PatientResponse) => <span className="font-medium">{`${record.last_name} ${record.first_name}`}</span>
    },
    {
      title: 'Ngày sinh',
      dataIndex: 'dob',
      key: 'dob',
      render: (dob: string) => dob ? dayjs(dob).format('DD/MM/YYYY') : '---'
    },
    {
      title: 'Giới tính',
      dataIndex: 'gender',
      key: 'gender',
      render: (gender: string) => {
        if (gender === 'MALE') return 'Nam';
        if (gender === 'FEMALE') return 'Nữ';
        return 'Khác';
      }
    },
    { title: 'SĐT', dataIndex: 'phone', key: 'phone', render: (val: string) => val || '---' },
    { title: 'CMND/CCCD', dataIndex: 'cccd', key: 'cccd', render: (val: string) => val || '---' },
    {
      title: 'Hành động',
      key: 'actions',
      render: (_: any, record: PatientResponse) => (
        <Space size="middle">
          <Button
            type="default"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetails(record.patient_id)}
            size="small"
            title="Xem chi tiết"
          />
          <Button
            icon={<EditOutlined />}
            onClick={() => handleOpenModal(record)}
            size="small"
            title="Chỉnh sửa"
          />
          <Popconfirm
            title="Xóa hồ sơ bệnh nhân?"
            description="Bạn có chắc chắn muốn xóa vĩnh viễn hồ sơ này (Không thể khôi phục)?"
            onConfirm={() => handleDelete(record.patient_id)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Button icon={<DeleteOutlined />} danger size="small" title="Xóa hồ sơ" />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <Card
        title={<span className="text-xl font-semibold">Quản lý Bệnh Nhân (Admin)</span>}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenModal()}>
            Tạo Bệnh Nhân
          </Button>
        }
      >
        <div className="mb-4 flex flex-wrap gap-4">
          <Input.Search
            placeholder="Tìm kiếm theo họ tên hoặc SĐT..."
            enterButton={<SearchOutlined />}
            size="middle"
            onSearch={handleSearch}
            className="max-w-md"
            allowClear
          />
        </div>

        <Table
          columns={columns}
          dataSource={patients}
          rowKey="patient_id"
          loading={loading}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: patients.length < pageSize ? (currentPage - 1) * pageSize + patients.length : currentPage * pageSize + 1
          }}
          onChange={handleTableChange}
        />
      </Card>

      {/* Modal View Details */}
      <Modal
        title={<span className="text-lg">Chi tiết Bệnh Nhân</span>}
        open={isDetailModalOpen}
        onCancel={() => setIsDetailModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setIsDetailModalOpen(false)}>
            Đóng
          </Button>
        ]}
        width={900}
      >
        {detailLoading ? (
          <div className="py-10 text-center text-gray-500">Đang tải dữ liệu...</div>
        ) : selectedPatient ? (
          <div className="mt-4">
            <Tabs defaultActiveKey="1" items={[
              {
                key: '1',
                label: 'Thông tin Hồ sơ',
                children: (
                  <Descriptions bordered column={2} size="small" className="mt-2">
                    <Descriptions.Item label="Họ và Tên" span={2}>
                      <span className="font-semibold text-blue-600">{selectedPatient.last_name} {selectedPatient.first_name}</span>
                    </Descriptions.Item>
                    <Descriptions.Item label="Ngày sinh">
                      {selectedPatient.dob ? dayjs(selectedPatient.dob).format('DD/MM/YYYY') : '---'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Giới tính">
                      {selectedPatient.gender === 'MALE' ? 'Nam' : selectedPatient.gender === 'FEMALE' ? 'Nữ' : 'Khác'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Số điện thoại">{selectedPatient.phone || '---'}</Descriptions.Item>
                    <Descriptions.Item label="CMND/CCCD">{selectedPatient.cccd || '---'}</Descriptions.Item>
                    <Descriptions.Item label="Nhóm máu" span={2}>{selectedPatient.blood_type || '---'}</Descriptions.Item>
                    <Descriptions.Item label="Địa chỉ" span={2}>{selectedPatient.address || '---'}</Descriptions.Item>
                    <Descriptions.Item label="Dị ứng" span={2}>{selectedPatient.allergies || '---'}</Descriptions.Item>
                    <Descriptions.Item label="Tiền sử bệnh lý" span={2}>{selectedPatient.medical_history || '---'}</Descriptions.Item>
                  </Descriptions>
                ),
              },
              {
                key: '2',
                label: 'Lịch sử BHYT',
                children: (
                  <div>
                    <div className="flex items-center justify-between mt-2 mb-4">
                      <span className="font-semibold text-gray-700">Danh sách Thẻ BHYT</span>
                      <Button size="small" type="primary" icon={<CreditCardOutlined />} onClick={() => handleOpenBhytModal()}>
                        Thêm thẻ BHYT
                      </Button>
                    </div>

                    {selectedPatient.bhyt_records && selectedPatient.bhyt_records.length > 0 ? (
                      <Table
                        dataSource={selectedPatient.bhyt_records}
                        rowKey="bhyt_id"
                        pagination={false}
                        size="small"
                        columns={[
                          { title: 'Mã BHYT', dataIndex: 'bhyt_code', key: 'bhyt_code', render: val => <span className="font-medium text-blue-600">{val}</span> },
                          { title: 'Mã KCB BĐ', dataIndex: 'registered_hospital_code', key: 'registered_hospital_code' },
                          {
                            title: 'Hiệu lực',
                            key: 'validity',
                            render: (_: any, record: any) => (
                              <span className="text-xs">
                                {record.valid_from ? dayjs(record.valid_from).format('DD/MM/YY') : ''} -
                                {record.valid_to ? dayjs(record.valid_to).format('DD/MM/YY') : ''}
                              </span>
                            )
                          },
                          {
                            title: 'Trạng thái',
                            key: 'status',
                            render: (_: any, record: any) => {
                              if (record.is_active === false) return <Tag color="default">Vô hiệu hóa</Tag>;
                              if (record.check_status === 'VERIFIED') return <Tag color="green">Đã xác minh</Tag>;
                              if (record.check_status === 'REJECTED') return <Tag color="red">Từ chối</Tag>;
                              return <Tag color="orange">Chờ xác minh</Tag>;
                            }
                          },
                          {
                            title: 'Xác minh (Admin)',
                            key: 'verify_action',
                            render: (_: any, record: any) => {
                              if (record.is_active !== false && record.check_status === 'PENDING') {
                                return (
                                  <Space>
                                    <Button type="text" size="small" className="text-green-600" icon={<CheckCircleOutlined />} onClick={() => handleVerifyBHYT(record.bhyt_id, 'VERIFIED')} title="Xác minh hợp lệ" />
                                    <Button type="text" size="small" danger icon={<CloseCircleOutlined />} onClick={() => handleVerifyBHYT(record.bhyt_id, 'REJECTED')} title="Từ chối" />
                                  </Space>
                                );
                              }
                              return null;
                            }
                          },
                          {
                            title: 'Thao tác',
                            key: 'action',
                            render: (_: any, record: any) => (
                              <Button type="link" size="small" onClick={() => handleOpenBhytModal(record)}>Sửa</Button>
                            )
                          }
                        ]}
                      />
                    ) : (
                      <div className="text-gray-500 italic px-2 bg-gray-50 py-8 text-center rounded border border-gray-100">
                        Bệnh nhân chưa đăng ký thông tin BHYT.
                      </div>
                    )}
                  </div>
                ),
              },
              {
                key: '3',
                label: 'Đồng thuận NĐ 13/2023',
                children: (
                  <div>
                    <div className="mt-2 mb-4">
                      <span className="font-semibold text-gray-700">Lịch sử cấp quyền/Đồng thuận (Audit Trail)</span>
                    </div>
                    {patientConsents.length > 0 ? (
                      <Table
                        dataSource={patientConsents}
                        rowKey="consent_id"
                        pagination={false}
                        size="small"
                        columns={[
                          {
                            title: 'Thời gian',
                            dataIndex: 'timestamp',
                            key: 'timestamp',
                            render: (val: string) => dayjs(val).format('DD/MM/YYYY HH:mm:ss')
                          },
                          { title: 'Loại đồng thuận', dataIndex: 'consent_type', key: 'consent_type' },
                          {
                            title: 'Trạng thái',
                            dataIndex: 'is_granted',
                            key: 'is_granted',
                            render: (val: boolean) => val
                              ? <Tag color="blue">Đã cấp quyền (Granted)</Tag>
                              : <Tag color="red">Rút quyền (Revoked)</Tag>
                          },
                          { title: 'IP Address', dataIndex: 'ip_address', key: 'ip_address', render: val => val || '---' },
                        ]}
                      />
                    ) : (
                      <div className="text-gray-500 italic px-2 bg-gray-50 py-8 text-center rounded border border-gray-100">
                        Chưa có lịch sử ký đồng thuận.
                      </div>
                    )}
                  </div>
                ),
              },
              {
                key: '4',
                label: 'Lịch sử Bệnh án',
                children: (
                  <div>
                    <div className="mt-2 mb-4">
                      <span className="font-semibold text-gray-700">Lịch sử Khám bệnh & Điều trị</span>
                    </div>
                    {patientMedicalRecords.length > 0 ? (
                      <Table
                        dataSource={patientMedicalRecords}
                        rowKey="record_id"
                        pagination={false}
                        size="small"
                        columns={[
                          {
                            title: 'Ngày khám',
                            dataIndex: 'created_at',
                            key: 'created_at',
                            render: (val: string) => <span className="font-medium text-blue-600">{dayjs(val).format('DD/MM/YYYY')}</span>
                          },
                          { title: 'Chẩn đoán', dataIndex: 'diagnosis', key: 'diagnosis' },
                          { title: 'ICD-10', dataIndex: 'icd10_code', key: 'icd10_code', render: val => val ? <Tag>{val}</Tag> : '---' },
                          {
                            title: 'Trạng thái',
                            key: 'status',
                            render: (_: any, record: MedicalRecord) => record.is_signed 
                              ? <Tag color="success" icon={<CheckCircleOutlined />}>Đã ký số</Tag> 
                              : <Tag color="warning">Bản nháp</Tag>
                          }
                        ]}
                        expandable={{
                          expandedRowRender: (record: MedicalRecord) => (
                            <div className="bg-gray-50 p-4 rounded text-sm border border-gray-200">
                              <p className="mb-2"><strong>Triệu chứng:</strong> {record.symptoms || 'Không ghi nhận'}</p>
                              <p className="mb-2"><strong>Kế hoạch điều trị:</strong> {record.treatment_plan || 'Không ghi nhận'}</p>
                              {record.is_signed && (
                                <p className="text-gray-500 text-xs mt-2 border-t pt-2">Ký số lúc: {dayjs(record.signed_at).format('DD/MM/YYYY HH:mm:ss')}</p>
                              )}
                            </div>
                          ),
                        }}
                      />
                    ) : (
                      <div className="text-gray-500 italic px-2 bg-gray-50 py-8 text-center rounded border border-gray-100">
                        Bệnh nhân chưa có lịch sử khám bệnh.
                      </div>
                    )}
                  </div>
                ),
              }
            ]} />
          </div>
        ) : (
          <div className="py-10 text-center text-red-500">Không tìm thấy thông tin bệnh nhân.</div>
        )}
      </Modal>

      {/* Modal Create/Edit Patient */}
      <Modal
        title={editingPatient ? "Sửa Hồ Sơ Bệnh Nhân" : "Tạo Hồ Sơ Bệnh Nhân Mới"}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit} className="mt-4">
          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="last_name" label="Họ" rules={[{ required: true, message: 'Vui lòng nhập họ' }]}>
              <Input placeholder="VD: Nguyễn" />
            </Form.Item>
            <Form.Item name="first_name" label="Tên" rules={[{ required: true, message: 'Vui lòng nhập tên' }]}>
              <Input placeholder="VD: Văn A" />
            </Form.Item>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="dob" label="Ngày sinh" rules={[{ required: true, message: 'Vui lòng chọn ngày sinh' }]}>
              <DatePicker className="w-full" format="DD/MM/YYYY" placeholder="Chọn ngày sinh" />
            </Form.Item>
            <Form.Item name="gender" label="Giới tính" rules={[{ required: true, message: 'Vui lòng chọn giới tính' }]}>
              <Select placeholder="Chọn giới tính">
                <Option value="MALE">Nam</Option>
                <Option value="FEMALE">Nữ</Option>
                <Option value="OTHER">Khác</Option>
              </Select>
            </Form.Item>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="phone" label="Số điện thoại">
              <Input placeholder="Nhập số điện thoại" />
            </Form.Item>
            <Form.Item name="cccd" label="CMND/CCCD">
              <Input placeholder="Nhập CMND hoặc CCCD" />
            </Form.Item>
          </div>

          <Form.Item name="address" label="Địa chỉ">
            <Input placeholder="Nhập địa chỉ đầy đủ" />
          </Form.Item>

          <Form.Item className="mt-6 mb-0 text-right">
            <Space>
              <Button onClick={() => setIsModalOpen(false)}>Hủy</Button>
              <Button type="primary" htmlType="submit">Lưu</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal Add/Edit BHYT */}
      <Modal
        title={editingBhyt ? "Cập nhật Thẻ BHYT" : "Thêm Thẻ BHYT Mới"}
        open={isBhytModalOpen}
        onCancel={() => setIsBhytModalOpen(false)}
        footer={null}
        width={500}
      >
        <Form form={bhytForm} layout="vertical" onFinish={handleBhytSubmit} className="mt-4">
          <Form.Item
            name="bhyt_code"
            label="Mã thẻ BHYT (15 ký tự)"
            rules={[
              { required: !editingBhyt, message: 'Vui lòng nhập mã thẻ BHYT' },
              { len: 15, message: 'Mã BHYT phải có chính xác 15 ký tự' }
            ]}
          >
            <Input placeholder="VD: DN1234567890123" disabled={!!editingBhyt} />
          </Form.Item>

          <Form.Item
            name="registered_hospital_code"
            label="Mã cơ sở KCB ban đầu"
            rules={[{ required: true, message: 'Vui lòng nhập mã bệnh viện' }]}
          >
            <Input placeholder="VD: 01001" />
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="valid_from"
              label="Hiệu lực từ"
              rules={[{ required: true, message: 'Vui lòng chọn ngày bắt đầu' }]}
            >
              <DatePicker className="w-full" format="DD/MM/YYYY" placeholder="Từ ngày" />
            </Form.Item>

            <Form.Item
              name="valid_to"
              label="Đến ngày"
              rules={[{ required: true, message: 'Vui lòng chọn ngày hết hạn' }]}
            >
              <DatePicker className="w-full" format="DD/MM/YYYY" placeholder="Đến ngày" />
            </Form.Item>
          </div>

          <Form.Item className="mt-6 mb-0 text-right">
            <Space>
              <Button onClick={() => setIsBhytModalOpen(false)}>Hủy</Button>
              <Button type="primary" htmlType="submit">Lưu</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
