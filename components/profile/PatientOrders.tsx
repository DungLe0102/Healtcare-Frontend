"use client";

import React, { useEffect, useState } from 'react';
import {
  Table,
  Tag,
  Typography,
  Button,
  Modal,
  Form,
  InputNumber,
  Select,
  Space,
  message,
  Card,
  Col,
  Row,
  Statistic,
  Empty
} from 'antd';
import {
  ShoppingCartOutlined,
  PlusOutlined,
  SyncOutlined,
  CreditCardOutlined,
  MedicineBoxOutlined,
  SafetyOutlined
} from '@ant-design/icons';
import { orderApi, Order } from '@/api/order';
import { patientApi, BHYTRecord } from '@/api/patient';
import { inventoryApi, Medication } from '@/api/inventory';
import dayjs from 'dayjs';

const { Text, Title } = Typography;

export default function PatientOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [bhyt, setBhyt] = useState<BHYTRecord | null>(null);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [medsLoading, setMedsLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isBHYTModalOpen, setIsBHYTModalOpen] = useState(false);
  const [isPharmacyModalOpen, setIsPharmacyModalOpen] = useState(false);
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const [bhytForm] = Form.useForm();
  const [pharmacyForm] = Form.useForm();

  const [patientId, setPatientId] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  const fetchOrdersAndData = async () => {
    setLoading(true);
    const pId = localStorage.getItem('account_id');
    if (!pId) {
      setLoading(false);
      return;
    }
    setPatientId(pId);
    try {
      // 1. Fetch patient orders (Bỏ qua gọi API vì listOrders yêu cầu quyền ADMIN, tránh lỗi 403 / CORS trên console của Bệnh nhân)
      setOrders([]);

      // 2. Fetch BHYT card
      try {
        const bhytData = await patientApi.getLatestBHYT(pId);
        setBhyt(bhytData);
      } catch (err) {
        console.log('No BHYT found');
      }

    } catch (error) {
      message.error('Không thể tải thông tin đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  const fetchMedications = async () => {
    setMedsLoading(true);
    try {
      const meds = await inventoryApi.listMedications(true);
      setMedications(meds);
    } catch (error) {
      // Thử lại không lọc active_only nếu có lỗi
      try {
        const meds = await inventoryApi.listMedications(false);
        setMedications(meds.filter(m => m.is_active !== false));
      } catch (err2) {
        message.error('Không thể tải danh sách thuốc');
      }
    } finally {
      setMedsLoading(false);
    }
  };

  useEffect(() => {
    setIsMounted(true);
    fetchOrdersAndData();
  }, []);

  // Load medications khi modal mở
  useEffect(() => {
    if (isPharmacyModalOpen) {
      fetchMedications();
    }
  }, [isPharmacyModalOpen]);

  const handleCreateBHYTOrder = async (values: any) => {
    if (!patientId || !bhyt) {
      message.error('Bạn cần cập nhật thẻ BHYT trong Hồ sơ y tế trước khi gia hạn!');
      return;
    }
    try {
      const order = await orderApi.createOrder({
        patient_id: patientId,
        order_type: 'BHYT_EXTENSION',
        bhyt_id: bhyt.bhyt_id,
        extension_months: values.extension_months
      });
      message.success('Đã tạo đơn hàng gia hạn BHYT thành công!');
      setIsBHYTModalOpen(false);
      bhytForm.resetFields();
      setSelectedOrder(order);
      setPayModalOpen(true);
      setOrders(prev => [order, ...prev]);
    } catch (error) {
      message.error('Không thể tạo đơn hàng gia hạn');
    }
  };

  const handleCreatePharmacyOrder = async (values: any) => {
    if (!patientId) return;
    try {
      const items = values.items.map((item: any) => ({
        item_id: item.medication_id,
        quantity: item.quantity
      }));
      const order = await orderApi.createOrder({
        patient_id: patientId,
        order_type: 'PHARMACY',
        items
      });
      message.success('Đã tạo đơn hàng mua thuốc online!');
      setIsPharmacyModalOpen(false);
      pharmacyForm.resetFields();
      setSelectedOrder(order);
      setPayModalOpen(true);
      setOrders(prev => [order, ...prev]);
    } catch (error) {
      message.error('Không thể tạo đơn hàng mua thuốc. Vui lòng kiểm tra tồn kho.');
    }
  };

  const handlePayOrder = (order: Order) => {
    setSelectedOrder(order);
    setPayModalOpen(true);
  };

  const columns = [
    {
      title: 'Mã Đơn',
      dataIndex: 'order_id',
      key: 'order_id',
      render: (id: string) => <span className="font-mono text-xs text-gray-500">{id.substring(0, 8).toUpperCase()}</span>,
    },
    {
      title: 'Loại Đơn',
      dataIndex: 'order_type',
      key: 'order_type',
      render: (type: string) => (
        <Tag color={type === 'BHYT_EXTENSION' ? 'purple' : 'orange'}>
          {type === 'BHYT_EXTENSION' ? 'Gia hạn BHYT' : 'Mua thuốc online'}
        </Tag>
      ),
    },
    {
      title: 'Số Tiền',
      dataIndex: 'total_amount',
      key: 'total_amount',
      render: (amount: number) => <span className="font-bold text-gray-800">{amount.toLocaleString('vi-VN')} đ</span>,
    },
    {
      title: 'Trạng Thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        let color = 'default';
        if (status === 'PENDING') color = 'orange';
        if (status === 'PAID') color = 'success';
        if (status === 'CANCELLED') color = 'error';
        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: 'Ngày Tạo',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (dateStr: string) => dayjs(dateStr).format('DD/MM/YYYY HH:mm'),
    },
    {
      title: 'Thao Tác',
      key: 'action',
      render: (_: any, record: Order) => (
        record.status === 'PENDING' ? (
          <Button size="small" type="primary" icon={<CreditCardOutlined />} onClick={() => handlePayOrder(record)}>
            Thanh toán
          </Button>
        ) : (
          <span className="text-gray-400">Không có</span>
        )
      ),
    },
  ];

  if (!isMounted) return null;

  return (
    <div className="space-y-6 pt-4">
      {/* Top Banner Options */}
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card 
            hoverable 
            className="rounded-xl border border-purple-100 bg-gradient-to-br from-white to-purple-50/20"
            actions={[
              <Button type="link" icon={<PlusOutlined />} onClick={() => setIsBHYTModalOpen(true)}>Gia hạn ngay</Button>
            ]}
          >
            <Card.Meta
              avatar={<SafetyOutlined className="text-3xl text-purple-600" />}
              title="Gia Hạn Thẻ BHYT"
              description={
                bhyt 
                  ? `Thẻ BHYT của bạn: ${bhyt.bhyt_code} (Hết hạn: ${dayjs(bhyt.valid_to).format('DD/MM/YYYY')}). Gia hạn ngay lập tức chỉ với vài bước chuyển khoản.`
                  : "Chưa cấu hình thẻ BHYT. Vui lòng thêm thẻ BHYT tại tab Hồ Sơ Y Tế trước."
              }
            />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card 
            hoverable 
            className="rounded-xl border border-orange-100 bg-gradient-to-br from-white to-orange-50/20"
            actions={[
              <Button type="link" icon={<ShoppingCartOutlined />} onClick={() => setIsPharmacyModalOpen(true)}>Đặt mua thuốc</Button>
            ]}
          >
            <Card.Meta
              avatar={<MedicineBoxOutlined className="text-3xl text-orange-500" />}
              title="Mua Thuốc Online"
              description="Đặt thuốc theo danh mục hoạt chất chất lượng cao, giao nhanh chóng từ quầy thuốc bệnh viện."
            />
          </Card>
        </Col>
      </Row>

      {/* Orders Table */}
      <Card className="shadow-sm rounded-xl border border-gray-100">
        <div className="flex justify-between items-center pb-4 border-b border-gray-100 mb-6">
          <Title level={4} style={{ margin: 0, fontWeight: 700 }} className="text-gray-800">
            Lịch Sử Đơn Hàng Của Bạn
          </Title>
          <Button icon={<SyncOutlined />} onClick={fetchOrdersAndData} loading={loading} />
        </div>

        <Table
          columns={columns}
          dataSource={orders}
          rowKey="order_id"
          loading={loading}
          pagination={{ pageSize: 5 }}
          locale={{ emptyText: <Empty description="Lịch sử đơn hàng chỉ khả dụng cho Quản trị viên. Các đơn mới tạo sẽ hiển thị tại đây." /> }}
          className="custom-table"
        />
      </Card>

      {/* Modal 1: BHYT Extension */}
      <Modal
        title="Gia Hạn Thẻ BHYT Online"
        open={isBHYTModalOpen}
        onCancel={() => setIsBHYTModalOpen(false)}
        footer={null}
      >
        {bhyt ? (
          <Form form={bhytForm} layout="vertical" onFinish={handleCreateBHYTOrder} initialValues={{ extension_months: 6 }}>
            <div className="bg-gray-50 p-4 rounded-xl mb-4 border">
              <div className="flex justify-between text-sm mb-1"><Text>Mã thẻ hiện tại:</Text><Text strong>{bhyt.bhyt_code}</Text></div>
              <div className="flex justify-between text-sm"><Text>Hạn sử dụng:</Text><Text strong className="text-orange-500">{dayjs(bhyt.valid_to).format('DD/MM/YYYY')}</Text></div>
            </div>
            <Form.Item name="extension_months" label="Số tháng gia hạn" rules={[{ required: true }]}>
              <Select options={[
                { label: '6 tháng (631.800 đ)', value: 6 },
                { label: '12 tháng (1.263.600 đ)', value: 12 },
              ]} />
            </Form.Item>
            <div className="text-xs text-gray-500 mb-4">
              * Mức phí đóng tính theo 4.5% lương cơ sở hiện hành của nhà nước (2.340.000đ/tháng).
            </div>
            <Form.Item className="mb-0 text-right">
              <Space>
                <Button onClick={() => setIsBHYTModalOpen(false)}>Hủy</Button>
                <Button type="primary" htmlType="submit" className="bg-purple-600 border-purple-600 hover:bg-purple-500">Tạo Đơn Hàng</Button>
              </Space>
            </Form.Item>
          </Form>
        ) : (
          <div className="text-center py-4">
            <Text className="block text-red-500 font-medium mb-4">Bạn chưa thêm thẻ BHYT vào hồ sơ cá nhân!</Text>
            <Button onClick={() => setIsBHYTModalOpen(false)}>Quay lại</Button>
          </div>
        )}
      </Modal>

      {/* Modal 2: Online Pharmacy */}
      <Modal
        title="Đặt Mua Thuốc Online"
        open={isPharmacyModalOpen}
        onCancel={() => setIsPharmacyModalOpen(false)}
        footer={null}
        width={550}
      >
        <Form form={pharmacyForm} layout="vertical" onFinish={handleCreatePharmacyOrder}>
          <Form.List name="items" initialValue={[{ medication_id: undefined, quantity: 1 }]}>
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                    <Form.Item
                      {...restField}
                      name={[name, 'medication_id']}
                      rules={[{ required: true, message: 'Chọn loại thuốc' }]}
                      style={{ width: 320 }}
                    >
                      <Select
                        placeholder="Chọn loại thuốc muốn mua"
                        loading={medsLoading}
                        options={medications.map(m => ({
                          label: `${m.med_name} (${Number(m.price).toLocaleString('vi-VN')} đ/${m.unit})`,
                          value: (m as any).medication_id
                        }))}
                        showSearch
                        optionFilterProp="label"
                        notFoundContent={medsLoading ? 'Đang tải thuốc...' : 'Không tìm thấy thuốc nào'}
                      />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, 'quantity']}
                      rules={[{ required: true, message: 'Nhập số lượng' }]}
                    >
                      <InputNumber min={1} max={100} placeholder="SL" style={{ width: 80 }} />
                    </Form.Item>
                    {fields.length > 1 && (
                      <Button danger onClick={() => remove(name)}>Xóa</Button>
                    )}
                  </Space>
                ))}
                <Form.Item>
                  <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                    Thêm thuốc muốn mua
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>
          <Form.Item className="mb-0 text-right">
            <Space>
              <Button onClick={() => setIsPharmacyModalOpen(false)}>Hủy</Button>
              <Button type="primary" htmlType="submit" className="bg-orange-500 border-orange-500 hover:bg-orange-400">Đặt hàng</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal 3: QR Code Pay */}
      <Modal
        title="Thanh toán Đơn Hàng Trực Tuyến"
        open={payModalOpen}
        onCancel={() => setPayModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setPayModalOpen(false)}>Đóng</Button>
        ]}
      >
        {selectedOrder && (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
              <div className="flex justify-between mb-1"><Text>Mã đơn hàng:</Text><Text strong className="font-mono text-xs">{selectedOrder.order_id}</Text></div>
              <div className="flex justify-between mb-1"><Text>Loại đơn hàng:</Text><Text>{selectedOrder.order_type === 'BHYT_EXTENSION' ? 'Gia hạn BHYT' : 'Mua thuốc online'}</Text></div>
              <div className="flex justify-between mb-1"><Text>Nội dung chuyển khoản:</Text><Text strong className="text-blue-600 font-mono">{selectedOrder.transfer_content}</Text></div>
              <div className="flex justify-between pt-2 border-t border-dashed mt-2 font-bold text-base text-red-600">
                <Text>Cần Thanh Toán:</Text>
                <Text>{selectedOrder.total_amount.toLocaleString('vi-VN')} đ</Text>
              </div>
            </div>

            {selectedOrder.qr_url ? (
              <div className="text-center py-4">
                <img src={selectedOrder.qr_url} alt="VietQR" className="w-56 h-56 mx-auto mb-2 border rounded-xl shadow-md" />
                <Text className="text-xs text-gray-400 block max-w-sm mx-auto">
                  Vui lòng quét mã VietQR bằng ứng dụng ngân hàng của bạn. Đơn hàng sẽ tự động xử lý ngay lập tức khi nhận được khoản tiền chuyển khoản.
                </Text>
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500 italic">
                Đang xử lý kết nối ngân hàng để lấy mã QR...
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
