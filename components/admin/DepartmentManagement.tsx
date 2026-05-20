"use client";

import React, { useEffect, useState } from 'react';
import {
  Card,
  Table,
  Button,
  Tag,
  Space,
  Input,
  Switch,
  Typography,
  Divider,
  Row,
  Col,
  Alert,
  Tooltip,
  Empty,
  Form,
  Descriptions,
  App,
  Modal,
  Badge
} from 'antd';
import {
  SearchOutlined,
  BuildOutlined,
  SafetyCertificateOutlined,
  ReloadOutlined,
  DatabaseOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  MedicineBoxOutlined,
  EditOutlined,
  StopOutlined,
  EyeOutlined,
  PlusOutlined
} from '@ant-design/icons';
import { departmentApi, Department } from '@/api/department';

const { Title, Text, Paragraph } = Typography;

const getErrorMessage = (error: any, defaultMsg = 'Thao tác thất bại') => {
  const detail = error?.response?.data?.detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) return detail.map((e: any) => e.msg).join(', ') || defaultMsg;
  return defaultMsg;
};

export default function DepartmentManagement() {
  const { message, modal } = App.useApp();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [activeOnly, setActiveOnly] = useState(false);
  const [initializingClass, setInitializingClass] = useState<string | null>(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingDepartment, setViewingDepartment] = useState<any>(null);
  
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<any>(null);
  
  const [form] = Form.useForm();
  const [roomForm] = Form.useForm();

  useEffect(() => {
    fetchDepartments();
  }, [activeOnly]); // Reload when toggle active-only changes

  const fetchDepartments = async (searchVal = search) => {
    setLoading(true);
    try {
      const data = await departmentApi.getDepartments(activeOnly, searchVal);
      setDepartments(data);
    } catch (error) {
      message.error('Lỗi khi tải danh sách khoa/phòng');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      fetchDepartments();
    }
  };

  const handleSearchClearOrChange = (val: string) => {
    setSearch(val);
    if (val === '') {
      fetchDepartments('');
    }
  };

  const handleInitStandard = async (hospitalClass: string) => {
    setInitializingClass(hospitalClass);
    try {
      const classNames: { [key: string]: string } = {
        'I': 'Hạng I (Đa khoa lớn, ~18 khoa)',
        'II': 'Hạng II (Đa khoa tỉnh, ~12 khoa)',
        'III': 'Hạng III (Cơ sở, Trung tâm y tế, ~8 khoa)'
      };
      
      const data = await departmentApi.initStandardDepartments(hospitalClass);
      
      if (data.length === 0) {
        message.info(`Tất cả các khoa chuẩn thuộc ${classNames[hospitalClass]} đã tồn tại trong hệ thống.`);
      } else {
        message.success(`Đã khởi tạo thành công ${data.length} khoa/phòng mới theo chuẩn Bộ Y Tế.`);
      }
      
      fetchDepartments();
    } catch (error: any) {
      message.error(getErrorMessage(error, 'Khởi tạo khoa/phòng chuẩn thất bại'));
    } finally {
      setInitializingClass(null);
    }
  };

  const handleEdit = (record: Department) => {
    setEditingDepartment(record);
    form.setFieldsValue({
      department_code: record.department_code,
      department_name: record.department_name
    });
    setIsEditModalOpen(true);
  };

  const handleUpdate = async (values: any) => {
    if (!editingDepartment) return;
    try {
      await departmentApi.updateDepartment(editingDepartment.department_id, {
        department_name: values.department_name
      });
      message.success('Cập nhật tên khoa thành công');
      setIsEditModalOpen(false);
      fetchDepartments();
    } catch (error: any) {
      message.error(getErrorMessage(error, 'Cập nhật thất bại'));
    }
  };

  const handleToggleStatus = async (record: Department) => {
    try {
      if (record.is_active) {
        await departmentApi.deactivateDepartment(record.department_id);
        message.success(`Đã vô hiệu hóa khoa ${record.department_name}`);
      } else {
        await departmentApi.reactivateDepartment(record.department_id);
        message.success(`Đã kích hoạt lại khoa ${record.department_name}`);
      }
      fetchDepartments();
    } catch (error: any) {
      message.error(getErrorMessage(error));
    }
  };

  const handleViewDetails = async (record: Department | null = null) => {
    try {
      const depId = record ? record.department_id : viewingDepartment?.department_id;
      if (!depId) return;
      const data = await departmentApi.getDepartmentDetails(depId);
      setViewingDepartment(data);
      if (record) {
        setIsViewModalOpen(true);
      }
    } catch (error) {
      message.error('Không thể lấy thông tin chi tiết khoa');
    }
  };

  const handleOpenRoomModal = (room?: any) => {
    setEditingRoom(room || null);
    if (room) {
      roomForm.setFieldsValue({
        room_number: room.room_number,
        room_type: room.room_type
      });
    } else {
      roomForm.resetFields();
    }
    setIsRoomModalOpen(true);
  };

  const handleSaveRoom = async (values: any) => {
    try {
      if (editingRoom) {
        await departmentApi.updateRoom(editingRoom.room_id, {
          room_number: values.room_number,
          room_type: values.room_type
        });
        message.success('Cập nhật phòng khám thành công');
      } else {
        await departmentApi.createRoom(viewingDepartment.department_id, values);
        message.success('Thêm phòng khám mới thành công');
      }
      setIsRoomModalOpen(false);
      handleViewDetails(); // Refresh room list
    } catch (error: any) {
      message.error(getErrorMessage(error));
    }
  };

  const handleToggleRoomStatus = async (room: any) => {
    try {
      if (room.is_active) {
        await departmentApi.deactivateRoom(room.room_id);
        message.success(`Đã vô hiệu hóa phòng ${room.room_number}`);
      } else {
        await departmentApi.reactivateRoom(room.room_id);
        message.success(`Đã kích hoạt lại phòng ${room.room_number}`);
      }
      handleViewDetails(); // Refresh room list
    } catch (error: any) {
      message.error(getErrorMessage(error));
    }
  };

  const showConfirmInit = (hospitalClass: string) => {
    const classDetails: { [key: string]: { name: string; desc: string } } = {
      'I': {
        name: 'Hạng I — Bệnh viện đa khoa lớn',
        desc: 'Tự động tạo danh mục chuẩn gồm ~18 khoa/phòng chuyên sâu (Nội, Ngoại, Sản, Nhi, Tim mạch, Hồi sức tích cực, Ung bướu, Tai mũi họng, Răng hàm mặt, Mắt, Truyền nhiễm, Chẩn đoán hình ảnh...)'
      },
      'II': {
        name: 'Hạng II — Bệnh viện đa khoa tỉnh',
        desc: 'Tự động tạo danh mục chuẩn gồm ~12 khoa/phòng cơ bản & chuyên khoa phổ biến (Nội tổng hợp, Ngoại tổng hợp, Sản phụ khoa, Nhi, Cấp cứu, Gây mê hồi sức, Khám bệnh, Xét nghiệm, Dược...)'
      },
      'III': {
        name: 'Hạng III — Bệnh viện cơ sở, trung tâm y tế',
        desc: 'Tự động tạo danh mục chuẩn rút gọn gồm ~8 khoa/phòng cơ bản (Khám bệnh, Nội - Nhi, Ngoại - Sản, Cấp cứu - Hồi sức, Xét nghiệm & Chẩn đoán hình ảnh, Dược, Kiểm soát nhiễm khuẩn...)'
      }
    };

    const details = classDetails[hospitalClass];

    modal.confirm({
      title: `Xác nhận khởi tạo Khoa/Phòng ${details.name}?`,
      icon: <MedicineBoxOutlined style={{ color: '#1890ff' }} />,
      content: (
        <div>
          <Paragraph className="mt-2 text-gray-600">
            {details.desc}
          </Paragraph>
          <Alert
            description={
              <div>
                <strong>Lưu ý quan trọng:</strong> Các khoa đã tồn tại dựa trên mã khoa sẽ tự động được hệ thống bỏ qua và không tạo trùng lặp.
              </div>
            }
            type="info"
            showIcon
            className="mt-4"
          />
        </div>
      ),
      okText: 'Khởi tạo ngay',
      cancelText: 'Hủy',
      okButtonProps: { type: 'primary', loading: initializingClass === hospitalClass },
      onOk: () => handleInitStandard(hospitalClass),
    });
  };

  const columns = [
    {
      title: 'STT',
      key: 'index',
      width: 80,
      align: 'center' as const,
      render: (_: any, __: any, index: number) => index + 1,
    },
    {
      title: 'Mã khoa',
      dataIndex: 'department_code',
      key: 'department_code',
      width: 150,
      render: (code: string) => (
        <Badge
          count={code}
          style={{
            backgroundColor: '#e6f7ff',
            color: '#1890ff',
            border: '1px solid #91d5ff',
            fontWeight: '600',
            fontSize: '12px'
          }}
        />
      ),
    },
    {
      title: 'Tên Khoa / Phòng chức năng',
      dataIndex: 'department_name',
      key: 'department_name',
      render: (name: string) => <span className="font-semibold text-gray-800">{name}</span>,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 180,
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'success' : 'default'} style={{ padding: '4px 12px', borderRadius: '4px', fontSize: '13px' }}>
          <Space>
            {isActive ? <CheckCircleOutlined /> : <ExclamationCircleOutlined />}
            {isActive ? 'Đang hoạt động' : 'Tạm ngưng'}
          </Space>
        </Tag>
      ),
    },
    {
      title: 'Hành động',
      key: 'actions',
      render: (_: any, record: Department) => (
        <Space size="middle">
          <Tooltip title="Xem chi tiết">
            <Button icon={<EyeOutlined />} onClick={() => handleViewDetails(record)} size="small" />
          </Tooltip>
          <Tooltip title="Sửa tên">
            <Button icon={<EditOutlined />} onClick={() => handleEdit(record)} size="small" />
          </Tooltip>
          <Tooltip title={record.is_active ? "Vô hiệu hóa" : "Kích hoạt"}>
            <Button 
              icon={record.is_active ? <StopOutlined /> : <CheckCircleOutlined />} 
              onClick={() => handleToggleStatus(record)}
              danger={record.is_active}
              size="small"
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Dynamic Glassmorphism Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 p-8 text-white shadow-xl">
        <div className="relative z-10">
          <Space align="center" className="mb-2">
            <SafetyCertificateOutlined className="text-3xl text-blue-100" />
            <span className="bg-white/20 text-white border border-white/30 text-xs px-3 py-1 rounded-full font-medium tracking-wide uppercase">
              Quy chuẩn BYT
            </span>
          </Space>
          <Title level={2} style={{ color: '#fff', margin: '4px 0 12px 0', fontWeight: 700 }}>
            Quản lý Khoa/Phòng Chuẩn Hóa
          </Title>
          <Paragraph className="text-blue-50/90 text-base max-w-3xl mb-0 leading-relaxed">
            Hệ thống áp dụng phương thức tạo khoa <strong>DUY NHẤT</strong> qua cơ chế khởi tạo chuẩn (<code>init-standard</code>) 
            theo phân hạng của Bộ Y Tế. Giúp tự động đồng bộ hóa danh mục, tránh trùng lặp dữ liệu, đảm bảo liên thông 
            dữ liệu bảo hiểm và quản trị lâm sàng đồng nhất.
          </Paragraph>
        </div>
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-y-1/4 translate-x-1/4 scale-150">
          <DatabaseOutlined style={{ fontSize: '240px' }} />
        </div>
      </div>

      {/* Hospital Class Quick Init Panels */}
      <Card
        title={
          <Space>
            <BuildOutlined className="text-blue-500" />
            <span className="font-bold text-gray-800">Cấu hình Khởi tạo danh mục theo Hạng Bệnh Viện</span>
          </Space>
        }
        className="shadow-sm rounded-xl border border-gray-100"
      >
        <div className="mb-4">
          <Text className="text-gray-500 block">
            Chọn một trong các hạng bệnh viện dưới đây để tự động tạo toàn bộ các khoa/phòng chuẩn tương ứng. 
            Mã khoa đã tồn tại sẽ tự động được giữ nguyên và bỏ qua.
          </Text>
        </div>

        <Row gutter={[20, 20]} className="mt-6">
          {/* Hang I */}
          <Col xs={24} md={8}>
            <Card
              hoverable
              onClick={() => showConfirmInit('I')}
              className="h-full border border-gray-100 hover:border-blue-400 transition-all rounded-lg"
              styles={{ body: { padding: '24px' } }}
            >
              <div className="flex flex-col h-full justify-between gap-4">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider bg-red-50 text-red-600 border border-red-100 px-3 py-1 rounded-md">
                      HẠNG I
                    </span>
                    <Badge count="~18 khoa" style={{ backgroundColor: '#ff4d4f' }} />
                  </div>
                  <Title level={4} style={{ margin: '0 0 8px 0', fontSize: '17px', fontWeight: 600 }}>
                    Bệnh viện Đa khoa Lớn
                  </Title>
                  <Text className="text-gray-400 text-xs block min-h-[40px]">
                    Tích hợp đầy đủ chuyên khoa sâu, nội, ngoại, sản nhi chuyên biệt, hồi sức cấp cứu và chẩn đoán nâng cao.
                  </Text>
                </div>
                <Button type="primary" block className="bg-red-500 hover:bg-red-600 border-none font-medium">
                  Khởi tạo Hạng I
                </Button>
              </div>
            </Card>
          </Col>

          {/* Hang II */}
          <Col xs={24} md={8}>
            <Card
              hoverable
              onClick={() => showConfirmInit('II')}
              className="h-full border border-gray-100 hover:border-blue-400 transition-all rounded-lg"
              styles={{ body: { padding: '24px' } }}
            >
              <div className="flex flex-col h-full justify-between gap-4">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider bg-blue-50 text-blue-600 border border-blue-100 px-3 py-1 rounded-md">
                      HẠNG II
                    </span>
                    <Badge count="~12 khoa" style={{ backgroundColor: '#1890ff' }} />
                  </div>
                  <Title level={4} style={{ margin: '0 0 8px 0', fontSize: '17px', fontWeight: 600 }}>
                    Bệnh viện Đa khoa Tỉnh
                  </Title>
                  <Text className="text-gray-400 text-xs block min-h-[40px]">
                    Danh mục thiết yếu gồm các khoa lâm sàng cốt lõi, cận lâm sàng cơ bản đáp ứng chăm sóc sức khỏe khu vực tỉnh/thành.
                  </Text>
                </div>
                <Button type="primary" block className="bg-blue-500 hover:bg-blue-600 border-none font-medium">
                  Khởi tạo Hạng II
                </Button>
              </div>
            </Card>
          </Col>

          {/* Hang III */}
          <Col xs={24} md={8}>
            <Card
              hoverable
              onClick={() => showConfirmInit('III')}
              className="h-full border border-gray-100 hover:border-blue-400 transition-all rounded-lg"
              styles={{ body: { padding: '24px' } }}
            >
              <div className="flex flex-col h-full justify-between gap-4">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider bg-green-50 text-green-600 border border-green-100 px-3 py-1 rounded-md">
                      HẠNG III
                    </span>
                    <Badge count="~8 khoa" style={{ backgroundColor: '#52c41a' }} />
                  </div>
                  <Title level={4} style={{ margin: '0 0 8px 0', fontSize: '17px', fontWeight: 600 }}>
                    Bệnh viện Cơ sở
                  </Title>
                  <Text className="text-gray-400 text-xs block min-h-[40px]">
                    Các khoa/phòng liên kết và đa năng (Nội - Nhi, Ngoại - Sản) tối ưu hóa cho Trung tâm Y tế cấp Huyện, cơ sở y tế ban đầu.
                  </Text>
                </div>
                <Button type="primary" block className="bg-green-500 hover:bg-green-600 border-none font-medium">
                  Khởi tạo Hạng III
                </Button>
              </div>
            </Card>
          </Col>
        </Row>
      </Card>

      {/* Department Directory Section */}
      <Card className="shadow-sm rounded-xl border border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-100 mb-6">
          <div>
            <Title level={4} style={{ margin: 0, fontWeight: 700 }} className="text-gray-800">
              Danh Mục Khoa/Phòng Hiện Tại
            </Title>
            <Text className="text-gray-400 text-xs">
              Hiển thị danh mục các khoa/phòng đã được khởi tạo chuẩn hóa trong cơ sở dữ liệu.
            </Text>
          </div>

          {/* Filters & Actions */}
          <div className="flex flex-wrap items-center gap-4">
            <Input
              placeholder="Tìm theo tên hoặc mã khoa..."
              prefix={<SearchOutlined className="text-gray-400" />}
              value={search}
              onChange={(e) => handleSearchClearOrChange(e.target.value)}
              onKeyDown={handleSearch}
              className="w-full md:w-64 rounded-lg"
              allowClear
            />
            
            <div className="hidden md:block w-px h-6 bg-gray-200" />

            <Space>
              <Text className="text-sm text-gray-500">Chỉ lấy khoa hoạt động:</Text>
              <Switch
                checked={activeOnly}
                onChange={(checked) => setActiveOnly(checked)}
              />
            </Space>

            <Tooltip title="Làm mới dữ liệu">
              <Button
                icon={<ReloadOutlined />}
                onClick={() => fetchDepartments()}
                className="flex items-center justify-center rounded-lg"
              />
            </Tooltip>
          </div>
        </div>

        {/* Data Table */}
        <Table
          columns={columns}
          dataSource={departments}
          rowKey="department_id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showTotal: (total, range) => `Hiển thị ${range[0]}-${range[1]} trong tổng số ${total} khoa/phòng`,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50']
          }}
          className="custom-table"
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <div className="space-y-2">
                    <p className="text-gray-500">Chưa có khoa/phòng nào được khởi tạo.</p>
                    <p className="text-xs text-gray-400">Vui lòng nhấp vào các nút Khởi tạo phía trên để nạp danh sách chuẩn của Bộ Y Tế.</p>
                  </div>
                }
              />
            )
          }}
        />
      </Card>

      {/* Edit Modal */}
      <Modal
        title="Cập nhật thông tin Khoa/Phòng"
        open={isEditModalOpen}
        onCancel={() => setIsEditModalOpen(false)}
        footer={null}
      >
        <Alert
          description={
            <div>
              <strong>Lưu ý:</strong> Chỉ cho phép đổi tên hiển thị. Mã khoa được hệ thống cố định để đảm bảo tính chuẩn hóa.
            </div>
          }
          type="info"
          showIcon
          className="mb-4"
        />
        <Form form={form} layout="vertical" onFinish={handleUpdate}>
          <Form.Item name="department_code" label="Mã khoa">
            <Input disabled />
          </Form.Item>
          <Form.Item 
            name="department_name" 
            label="Tên Khoa/Phòng" 
            rules={[{ required: true, message: 'Vui lòng nhập tên khoa' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item className="mt-4 mb-0 text-right">
            <Space>
              <Button onClick={() => setIsEditModalOpen(false)}>Hủy</Button>
              <Button type="primary" htmlType="submit">Lưu thay đổi</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* View Details Modal */}
      <Modal
        title={`Chi tiết Khoa: ${viewingDepartment?.department_name || ''}`}
        open={isViewModalOpen}
        onCancel={() => setIsViewModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setIsViewModalOpen(false)}>Đóng</Button>
        ]}
        width={600}
      >
        {viewingDepartment && (
          <div className="space-y-4 mt-4">
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="Mã khoa">{viewingDepartment.department_code}</Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                <Tag color={viewingDepartment.is_active ? 'success' : 'default'}>
                  {viewingDepartment.is_active ? 'Đang hoạt động' : 'Tạm ngưng'}
                </Tag>
              </Descriptions.Item>
            </Descriptions>

            <div>
              <div className="flex items-center justify-between mt-4 mb-2">
                <Title level={5} className="text-gray-700 m-0">Danh sách phòng khám ({viewingDepartment.rooms?.length || 0})</Title>
                {viewingDepartment.is_active && (
                  <Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => handleOpenRoomModal()}>
                    Thêm phòng
                  </Button>
                )}
              </div>
              {viewingDepartment.rooms?.length > 0 ? (
                <Table 
                  dataSource={viewingDepartment.rooms} 
                  rowKey="room_id"
                  pagination={false}
                  size="small"
                  columns={[
                    { title: 'Tên/Số phòng', dataIndex: 'room_number', key: 'room_number' },
                    { 
                      title: 'Loại phòng', 
                      dataIndex: 'room_type', 
                      key: 'room_type',
                      render: (type: string) => <Tag color="blue">{type}</Tag>
                    },
                    { 
                      title: 'Trạng thái', 
                      dataIndex: 'is_active', 
                      key: 'is_active',
                      render: (isActive: boolean) => (
                        <Tag color={isActive ? 'success' : 'default'}>{isActive ? 'Hoạt động' : 'Đóng'}</Tag>
                      )
                    },
                    {
                      title: 'Hành động',
                      key: 'actions',
                      render: (_: any, record: any) => (
                        <Space size="small">
                          <Button type="text" icon={<EditOutlined />} onClick={() => handleOpenRoomModal(record)} size="small" className="text-blue-500" />
                          <Button 
                            type="text" 
                            icon={record.is_active ? <StopOutlined /> : <CheckCircleOutlined />} 
                            onClick={() => handleToggleRoomStatus(record)}
                            danger={record.is_active}
                            size="small"
                            className={record.is_active ? '' : 'text-green-500'}
                          />
                        </Space>
                      ),
                    }
                  ]}
                />
              ) : (
                <Empty description="Khoa này chưa có phòng khám nào" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Room Form Modal */}
      <Modal
        title={editingRoom ? "Cập nhật thông tin Phòng Khám" : "Thêm Phòng Khám Mới"}
        open={isRoomModalOpen}
        onCancel={() => setIsRoomModalOpen(false)}
        footer={null}
      >
        <Form form={roomForm} layout="vertical" onFinish={handleSaveRoom}>
          <Form.Item 
            name="room_number" 
            label="Số phòng / Tên phòng" 
            rules={[{ required: true, message: 'Vui lòng nhập tên/số phòng' }]}
          >
            <Input placeholder="VD: 101 hoặc P.Siêu âm" />
          </Form.Item>
          <Form.Item 
            name="room_type" 
            label="Loại phòng" 
            rules={[{ required: true, message: 'Vui lòng nhập loại phòng' }]}
          >
            <Input placeholder="VD: KHAM_BENH, CAP_CUU, XET_NGHIEM..." />
          </Form.Item>
          <Form.Item className="mt-4 mb-0 text-right">
            <Space>
              <Button onClick={() => setIsRoomModalOpen(false)}>Hủy</Button>
              <Button type="primary" htmlType="submit">Lưu thông tin</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
