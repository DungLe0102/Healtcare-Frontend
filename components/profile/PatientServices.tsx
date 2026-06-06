"use client";

import React, { useEffect, useState } from 'react';
import { 
  Table, 
  Tag, 
  Typography, 
  Button, 
  Modal, 
  Form, 
  Input, 
  Select, 
  Space, 
  Card, 
  Col, 
  Row, 
  Statistic, 
  Empty, 
  Checkbox, 
  Tooltip,
  Badge,
  InputNumber,
  App,
  DatePicker
} from 'antd';
import { 
  MedicineBoxOutlined, 
  CreditCardOutlined, 
  UndoOutlined, 
  CheckCircleOutlined, 
  InfoCircleOutlined, 
  SearchOutlined, 
  HistoryOutlined, 
  BankOutlined, 
  WalletOutlined,
  PlusOutlined,
  ShoppingCartOutlined,
  DeleteOutlined,
  EyeOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  MailOutlined
} from '@ant-design/icons';
import { clinicalServiceApi, ClinicalService } from '@/api/clinical_service';
import { patientApi, BHYTRecord } from '@/api/patient';
import { notificationApi } from '@/api/notification';
import dayjs from 'dayjs';

const { Text, Title, Paragraph } = Typography;

interface ServiceRegistration {
  registration_id: string;
  patient_id: string;
  patient_name: string;
  services: {
    service_id: string;
    service_code: string;
    service_name: string;
    price: number;
    is_bhyt_covered: boolean;
    quantity: number;
    actual_price: number;
  }[];
  total_amount: number;
  bhyt_covered_amount: number;
  patient_paid_amount: number;
  status: 'PENDING' | 'PAID' | 'REFUND_DUE' | 'REFUNDED' | 'COMPLETED';
  use_bhyt: boolean;
  refund_bank_code?: string;
  refund_account_no?: string;
  refund_account_name?: string;
  refund_reason?: string;
  scheduled_date?: string;
  scheduled_time?: string;
  created_at: string;
}

export default function PatientServices() {
  const { message, modal } = App.useApp();
  const [services, setServices] = useState<ClinicalService[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [bhyt, setBhyt] = useState<BHYTRecord | null>(null);
  
  // Cart & Registration states
  const [cart, setCart] = useState<{ service: ClinicalService; quantity: number }[]>([]);
  const [useBHYTInCart, setUseBHYTInCart] = useState(false);
  const [registrations, setRegistrations] = useState<ServiceRegistration[]>([]);
  
  // Modals
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [viewDetailsModalOpen, setViewDetailsModalOpen] = useState(false);
  const [selectedReg, setSelectedReg] = useState<ServiceRegistration | null>(null);
  
  const [refundForm] = Form.useForm();
  const [patientId, setPatientId] = useState<string | null>(null);
  const [patientName, setPatientName] = useState<string>('Bệnh nhân');
  const [isMounted, setIsMounted] = useState(false);

  // Scheduling states
  const [scheduledDate, setScheduledDate] = useState<string>(dayjs().add(1, 'day').format('YYYY-MM-DD'));
  const [scheduledTime, setScheduledTime] = useState<string>('08:00 - 09:00');
  
  // Rescheduling states
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [rescheduleReg, setRescheduleReg] = useState<ServiceRegistration | null>(null);
  const [newDate, setNewDate] = useState<string>('');
  const [newTime, setNewTime] = useState<string>('');

  useEffect(() => {
    setIsMounted(true);
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const pId = localStorage.getItem('account_id');
    if (!pId) {
      setLoading(false);
      return;
    }
    setPatientId(pId);
    
    try {
      // 1. Fetch available services
      const serviceData = await clinicalServiceApi.listServices(true);
      setServices(serviceData);

      // 2. Fetch BHYT card
      try {
        const bhytData = await patientApi.getLatestBHYT(pId);
        setBhyt(bhytData);
      } catch (err) {
        console.log('No BHYT found');
      }

      // 3. Fetch patient profile for name
      try {
        const profile = await patientApi.getMyProfile();
        setPatientName(`${profile.last_name} ${profile.first_name}`);
      } catch (err) {
        console.log('Could not load profile');
      }

      // 4. Load registrations from localStorage
      const savedRegs = localStorage.getItem(`service_regs_${pId}`);
      if (savedRegs) {
        setRegistrations(JSON.parse(savedRegs));
      }

    } catch (error) {
      message.error('Không thể tải danh sách dịch vụ y tế');
    } finally {
      setLoading(false);
    }
  };

  const saveRegistrations = (updatedRegs: ServiceRegistration[]) => {
    setRegistrations(updatedRegs);
    if (patientId) {
      localStorage.setItem(`service_regs_${patientId}`, JSON.stringify(updatedRegs));
    }
  };

  // Add to cart
  const handleAddToCart = (service: ClinicalService) => {
    const existing = cart.find(item => item.service.service_id === service.service_id);
    if (existing) {
      setCart(cart.map(item => 
        item.service.service_id === service.service_id 
          ? { ...item, quantity: item.quantity + 1 } 
          : item
      ));
    } else {
      setCart([...cart, { service, quantity: 1 }]);
    }
    message.success(`Đã thêm "${service.service_name}" vào danh sách đăng ký`);
  };

  // Remove from cart
  const handleRemoveFromCart = (serviceId: string) => {
    setCart(cart.filter(item => item.service.service_id !== serviceId));
  };

  // Calculate cart prices
  const calculateCartSummary = () => {
    let total = 0;
    let bhytCovered = 0;

    cart.forEach(item => {
      const price = Number(item.service.price);
      total += price * item.quantity;
      if (useBHYTInCart && item.service.is_bhyt_covered && bhyt) {
        // BHYT covers 80% for covered services
        bhytCovered += price * 0.8 * item.quantity;
      }
    });

    const patientPaid = total - bhytCovered;
    return { total, bhytCovered, patientPaid };
  };

  const { total: cartTotal, bhytCovered: cartBhytCovered, patientPaid: cartPatientPaid } = calculateCartSummary();

  // Create Registration
  const handleCheckout = () => {
    if (cart.length === 0) {
      message.warning('Danh sách đăng ký trống');
      return;
    }
    setCheckoutModalOpen(true);
  };

  // Helper to send email notification
  const sendEmailNotification = async (reg: ServiceRegistration) => {
    if (!patientId) return;
    try {
      const serviceListText = reg.services
        .map(s => `• ${s.service_name} (x${s.quantity}): ${s.actual_price.toLocaleString('vi-VN')} đ`)
        .join('\n');
      
      const emailContent = `Kính gửi bệnh nhân ${reg.patient_name},
      
Hệ thống phòng khám Healthcare System xin xác nhận bạn đã đăng ký và thanh toán thành công dịch vụ y tế tự nguyện.

Thông tin chi tiết:
- Mã phiếu đăng ký: ${reg.registration_id}
- Thời gian đặt hẹn khám: Ngày ${dayjs(reg.scheduled_date).format('DD/MM/YYYY')} vào khung giờ ${reg.scheduled_time}
- Trực tiếp thực hiện tại: Quầy tiếp đón dịch vụ lâm sàng tự chọn
- Tổng tiền thanh toán: ${reg.patient_paid_amount.toLocaleString('vi-VN')} đ
- Trạng thái: ĐÃ THANH TOÁN

Danh sách các dịch vụ y tế đã đăng ký:
${serviceListText}

* Các lưu ý quan trọng trước khi đến khám:
1. Đối với Xét nghiệm máu: Bệnh nhân vui lòng nhịn ăn sáng (không ăn thức ăn, nước ngọt, sữa; có thể uống nước lọc) từ 6-8 tiếng trước khi lấy máu để kết quả xét nghiệm được chính xác nhất.
2. Vui lòng có mặt tại quầy tiếp tiếp đón trước khung giờ hẹn từ 10 - 15 phút.
3. Mang theo giấy tờ cá nhân và thẻ BHYT (nếu đăng ký giảm trừ BHYT) để nhân viên y tế đối chiếu.

Cảm ơn bạn đã lựa chọn Healthcare System! Hân hạnh được phục vụ bạn.`;

      await notificationApi.createNotification({
        recipient_id: patientId,
        recipient_type: 'PATIENT',
        notification_type: 'SERVICE_BOOKING',
        channel: 'EMAIL',
        title: `Xác nhận lịch khám và thanh toán dịch vụ ${reg.registration_id}`,
        content: emailContent
      });
      message.info('Hệ thống đã tự động gửi email xác nhận lịch khám đến email đăng ký của bạn.');
    } catch (err) {
      console.error('Lỗi gửi email:', err);
    }
  };

  const handleConfirmRegistration = () => {
    if (!patientId) return;
    if (!scheduledDate || !scheduledTime) {
      message.warning('Vui lòng chọn ngày và giờ hẹn khám');
      return;
    }

    const newReg: ServiceRegistration = {
      registration_id: `SR${Math.floor(100000 + Math.random() * 900000)}`,
      patient_id: patientId,
      patient_name: patientName,
      services: cart.map(item => {
        const basePrice = Number(item.service.price);
        const actualPrice = (useBHYTInCart && item.service.is_bhyt_covered && bhyt)
          ? basePrice * 0.2
          : basePrice;
        return {
          service_id: item.service.service_id,
          service_code: item.service.service_code,
          service_name: item.service.service_name,
          price: basePrice,
          is_bhyt_covered: item.service.is_bhyt_covered,
          quantity: item.quantity,
          actual_price: actualPrice
        };
      }),
      total_amount: cartTotal,
      bhyt_covered_amount: cartBhytCovered,
      patient_paid_amount: cartPatientPaid,
      status: cartPatientPaid > 0 ? 'PENDING' : 'PAID', // If BHYT covered 100% or price is 0
      use_bhyt: useBHYTInCart,
      scheduled_date: scheduledDate,
      scheduled_time: scheduledTime,
      created_at: new Date().toISOString()
    };

    const updated = [newReg, ...registrations];
    saveRegistrations(updated);
    setCart([]);
    setCheckoutModalOpen(false);

    if (newReg.status === 'PAID') {
      message.success('Đăng ký dịch vụ thành công!');
      sendEmailNotification(newReg);
    } else {
      message.success('Đăng ký dịch vụ thành công! Vui lòng thanh toán.');
      setSelectedReg(newReg);
      setPayModalOpen(true);
    }
  };

  // Simulate payment
  const handleSimulatePayment = (reg: ServiceRegistration) => {
    const updated = registrations.map(r => 
      r.registration_id === reg.registration_id 
        ? { ...r, status: 'PAID' as const } 
        : r
    );
    saveRegistrations(updated);
    message.success('Thanh toán dịch vụ y tế thành công!');
    setPayModalOpen(false);
    
    // Trigger email notification
    sendEmailNotification({ ...reg, status: 'PAID' });
  };

  // Simulate execution of clinical service
  const handleUseService = (reg: ServiceRegistration) => {
    modal.confirm({
      title: 'Xác nhận sử dụng dịch vụ y tế',
      content: `Tiến hành thực hiện các dịch vụ trong phiếu đăng ký ${reg.registration_id}? Sau khi xác nhận, dịch vụ sẽ được chuyển trạng thái sang Đã thực hiện.`,
      okText: 'Xác nhận',
      cancelText: 'Hủy',
      onOk: () => {
        const updated = registrations.map(r => 
          r.registration_id === reg.registration_id 
            ? { ...r, status: 'COMPLETED' as const } 
            : r
        );
        saveRegistrations(updated);
        message.success('Đã ghi nhận sử dụng dịch vụ thành công!');
      }
    });
  };

  // Request refund
  const handleOpenRefundModal = (reg: ServiceRegistration) => {
    setSelectedReg(reg);
    refundForm.resetFields();
    setRefundModalOpen(true);
  };

  // Open reschedule modal
  const handleOpenReschedule = (reg: ServiceRegistration) => {
    setRescheduleReg(reg);
    setNewDate(reg.scheduled_date || dayjs().add(1, 'day').format('YYYY-MM-DD'));
    setNewTime(reg.scheduled_time || '08:00 - 09:00');
    setRescheduleModalOpen(true);
  };

  const handleSaveReschedule = async () => {
    if (!rescheduleReg) return;
    if (!newDate || !newTime) {
      message.warning('Vui lòng chọn ngày và giờ hẹn mới');
      return;
    }

    const updated = registrations.map(r => 
      r.registration_id === rescheduleReg.registration_id 
        ? { ...r, scheduled_date: newDate, scheduled_time: newTime } 
        : r
    );
    saveRegistrations(updated);
    setRescheduleModalOpen(false);
    
    // Trigger email notification for updated schedule
    const updatedReg = { ...rescheduleReg, scheduled_date: newDate, scheduled_time: newTime };
    try {
      const serviceListText = updatedReg.services
        .map(s => `• ${s.service_name} (x${s.quantity})`)
        .join('\n');
      
      const emailContent = `Kính gửi bệnh nhân ${updatedReg.patient_name},
      
Chúng tôi xin thông báo lịch hẹn khám dịch vụ y tế tự nguyện của bạn đã được thay đổi thành công trên hệ thống.

Thông tin lịch hẹn mới:
- Mã phiếu đăng ký: ${updatedReg.registration_id}
- Thời gian đặt hẹn mới: Ngày ${dayjs(newDate).format('DD/MM/YYYY')} vào khung giờ ${newTime}
- Tổng tiền thanh toán: ${updatedReg.patient_paid_amount.toLocaleString('vi-VN')} đ
- Trạng thái: ĐÃ THANH TOÁN (LỊCH HẸN MỚI)

Danh sách dịch vụ:
${serviceListText}

* Lưu ý trước khi đi khám:
- Vui lòng có mặt tại quầy tiếp đón dịch vụ lâm sàng tự nguyện trước khung giờ hẹn từ 10 - 15 phút.
- Nếu xét nghiệm máu, quý khách vui lòng nhịn ăn sáng trước khi lấy mẫu.

Cảm ơn bạn đã đồng hành cùng Healthcare System!`;

      await notificationApi.createNotification({
        recipient_id: patientId!,
        recipient_type: 'PATIENT',
        notification_type: 'SERVICE_RESCHEDULE',
        channel: 'EMAIL',
        title: `Thay đổi lịch hẹn khám dịch vụ ${updatedReg.registration_id}`,
        content: emailContent
      });
      message.success('Đã thay đổi lịch hẹn khám và gửi email xác nhận mới!');
    } catch (err) {
      console.error('Lỗi gửi email đổi lịch:', err);
      message.success('Đã thay đổi lịch hẹn khám thành công!');
    }
  };

  const handleRequestRefund = (values: any) => {
    if (!selectedReg) return;

    const updated = registrations.map(r => 
      r.registration_id === selectedReg.registration_id 
        ? { 
            ...r, 
            status: 'REFUND_DUE' as const,
            refund_bank_code: values.refund_bank_code,
            refund_account_no: values.refund_account_no,
            refund_account_name: values.refund_account_name,
            refund_reason: values.refund_reason
          } 
        : r
    );
    saveRegistrations(updated);
    setRefundModalOpen(false);
    message.success('Đã gửi yêu cầu hoàn tiền thành công! Vui lòng chờ xử lý.');
  };

  // Simulate Approve Refund (Admin action in patient portal for demo)
  const handleSimulateApproveRefund = (reg: ServiceRegistration) => {
    modal.confirm({
      title: 'Giả lập Duyệt hoàn tiền',
      content: 'Bạn đang sử dụng quyền giả lập hệ thống để hoàn tiền về tài khoản ngân hàng của bệnh nhân. Xác nhận chuyển tiền?',
      okText: 'Chuyển tiền ngay',
      cancelText: 'Hủy',
      okButtonProps: { className: 'bg-purple-600 border-purple-600 hover:bg-purple-500' },
      onOk: () => {
        const updated = registrations.map(r => 
          r.registration_id === reg.registration_id 
            ? { ...r, status: 'REFUNDED' as const } 
            : r
        );
        saveRegistrations(updated);
        message.success(`Đã hoàn thành giao dịch hoàn trả ${reg.patient_paid_amount.toLocaleString('vi-VN')} đ qua VietQR.`);
      }
    });
  };

  // Search filtered services
  const filteredServices = services.filter(s => 
    s.service_name.toLowerCase().includes(search.toLowerCase()) || 
    s.service_code.toLowerCase().includes(search.toLowerCase())
  );

  // Stats calculation
  const totalSpent = registrations
    .filter(r => r.status === 'PAID' || r.status === 'COMPLETED')
    .reduce((sum, r) => sum + r.patient_paid_amount, 0);

  const pendingRefund = registrations
    .filter(r => r.status === 'REFUND_DUE')
    .reduce((sum, r) => sum + r.patient_paid_amount, 0);

  const refundedAmount = registrations
    .filter(r => r.status === 'REFUNDED')
    .reduce((sum, r) => sum + r.patient_paid_amount, 0);

  if (!isMounted) return null;

  return (
    <div className="space-y-6 pt-4">
      {/* Premium Medical Banner & Stats */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-teal-700 via-teal-600 to-emerald-600 p-6 text-white shadow-lg">
        <div className="relative z-10 flex flex-col md:flex-row justify-between md:items-center gap-6">
          <div>
            <Space align="center" className="mb-2">
              <MedicineBoxOutlined className="text-2xl text-teal-100" />
              <span className="bg-white/20 text-white border border-white/30 text-[10px] px-2.5 py-0.5 rounded-full font-medium tracking-wide uppercase">
                Dịch Vụ Y Tế Tự Nguyện
              </span>
            </Space>
            <Title level={3} style={{ color: '#fff', margin: '2px 0 6px 0', fontWeight: 700 }}>
              Đăng Ký Dịch Vụ Lâm Sàng
            </Title>
            <Paragraph style={{ color: 'rgba(255, 255, 255, 0.85)', margin: 0 }} className="text-sm max-w-xl">
              Chủ động đăng ký thực hiện xét nghiệm, siêu âm, chụp X-quang hoặc dịch vụ chẩn đoán không cần xếp hàng chờ khám tổng quát.
            </Paragraph>
          </div>
          <div className="flex gap-4 bg-black/10 p-4 rounded-xl backdrop-blur-sm border border-white/10">
            <Statistic
              title={<span className="text-teal-100 text-xs font-semibold uppercase">Đã Thanh Toán</span>}
              value={totalSpent}
              styles={{ content: { color: '#fff', fontSize: '18px', fontWeight: 'bold' } }}
              formatter={(val) => `${Number(val).toLocaleString('vi-VN')} đ`}
              prefix={<WalletOutlined />}
            />
            <div className="w-px bg-white/20 my-1" />
            <Statistic
              title={<span className="text-teal-100 text-xs font-semibold uppercase">Đang hoàn trả</span>}
              value={pendingRefund}
              styles={{ content: { color: '#fcd34d', fontSize: '18px', fontWeight: 'bold' } }}
              formatter={(val) => `${Number(val).toLocaleString('vi-VN')} đ`}
              prefix={<UndoOutlined />}
            />
          </div>
        </div>
      </div>

      <Row gutter={[16, 16]}>
        {/* Left Side: Services List */}
        <Col xs={24} lg={16}>
          <Card 
            title={
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="font-semibold text-gray-800 text-base">Danh mục dịch vụ khám chữa bệnh</span>
                <Input
                  placeholder="Tìm kiếm dịch vụ..."
                  prefix={<SearchOutlined className="text-gray-400" />}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ width: 220 }}
                  className="rounded-lg"
                  allowClear
                />
              </div>
            }
            className="shadow-sm rounded-xl border border-gray-100"
          >
            <Table
              dataSource={filteredServices}
              rowKey="service_id"
              loading={loading}
              pagination={{ pageSize: 6 }}
              className="custom-table"
              columns={[
                {
                  title: 'Dịch vụ',
                  dataIndex: 'service_name',
                  key: 'service_name',
                  render: (name: string, record: ClinicalService) => (
                    <div>
                      <div className="font-semibold text-gray-800">{name}</div>
                      <div className="text-xs text-gray-400">Mã: {record.service_code}</div>
                    </div>
                  )
                },
                {
                  title: 'Đơn giá',
                  dataIndex: 'price',
                  key: 'price',
                  width: 140,
                  render: (price: number) => (
                    <span className="font-semibold text-teal-600">
                      {Number(price).toLocaleString('vi-VN')} đ
                    </span>
                  )
                },
                {
                  title: 'BHYT',
                  dataIndex: 'is_bhyt_covered',
                  key: 'is_bhyt_covered',
                  width: 110,
                  align: 'center',
                  render: (covered: boolean) => (
                    <Tag color={covered ? 'blue' : 'default'} className="border-0 px-2.5 py-0.5 rounded-full text-xs">
                      {covered ? 'Có hỗ trợ' : 'Không'}
                    </Tag>
                  )
                },
                {
                  title: 'Đăng ký',
                  key: 'action',
                  width: 100,
                  align: 'center',
                  render: (_, record: ClinicalService) => (
                    <Button 
                      type="primary" 
                      shape="circle" 
                      icon={<PlusOutlined />} 
                      onClick={() => handleAddToCart(record)}
                      className="bg-teal-600 hover:bg-teal-500 border-teal-600"
                    />
                  )
                }
              ]}
              locale={{ emptyText: <Empty description="Không tìm thấy dịch vụ nào" /> }}
            />
          </Card>
        </Col>

        {/* Right Side: Registration Cart */}
        <Col xs={24} lg={8}>
          <Card 
            title={
              <Space>
                <ShoppingCartOutlined className="text-teal-600 text-lg" />
                <span className="font-semibold text-gray-800 text-base">Phiếu đăng ký chọn</span>
              </Space>
            }
            className="shadow-sm rounded-xl border border-gray-100 bg-gradient-to-br from-white to-teal-50/10 sticky top-4"
          >
            {cart.length === 0 ? (
              <Empty 
                description="Chưa chọn dịch vụ nào. Hãy click dấu cộng ở bảng bên để thêm dịch vụ." 
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                className="py-8"
              />
            ) : (
              <div className="space-y-4">
                <div className="max-h-[260px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                  {cart.map(item => (
                    <div key={item.service.service_id} className="flex justify-between items-start p-3 bg-gray-50/80 rounded-xl border border-gray-100 hover:border-gray-200 transition-all">
                      <div className="space-y-1 max-w-[75%]">
                        <div className="font-medium text-xs text-gray-800 line-clamp-2">{item.service.service_name}</div>
                        <div className="text-[11px] text-gray-400">
                          {Number(item.service.price).toLocaleString('vi-VN')} đ × {item.quantity}
                        </div>
                      </div>
                      <Button 
                        type="text" 
                        danger 
                        size="small"
                        icon={<DeleteOutlined />} 
                        onClick={() => handleRemoveFromCart(item.service.service_id)}
                      />
                    </div>
                  ))}
                </div>

                <div className="border-t border-dashed border-gray-200 pt-3 space-y-3">
                  {/* BHYT Checkbox */}
                  {bhyt ? (
                    <div className="bg-blue-50/60 p-2.5 rounded-lg border border-blue-100">
                      <Checkbox 
                        checked={useBHYTInCart} 
                        onChange={(e) => setUseBHYTInCart(e.target.checked)}
                        className="text-xs text-blue-900"
                      >
                        Áp dụng BHYT ({bhyt.bhyt_code})
                      </Checkbox>
                      <div className="text-[10px] text-blue-500 mt-1 pl-6">
                        * Giảm 80% đối với các dịch vụ có hỗ trợ bảo hiểm.
                      </div>
                    </div>
                  ) : (
                    <div className="text-[11px] text-gray-400 bg-gray-50 p-2.5 rounded-lg">
                      Không tìm thấy thẻ BHYT hợp lệ để giảm trừ.
                    </div>
                  )}

                  {/* Summary Pricing */}
                  <div className="space-y-1.5 text-xs text-gray-500">
                    <div className="flex justify-between">
                      <span>Tổng phí dịch vụ:</span>
                      <span className="text-gray-800">{cartTotal.toLocaleString('vi-VN')} đ</span>
                    </div>
                    {useBHYTInCart && cartBhytCovered > 0 && (
                      <div className="flex justify-between text-blue-600">
                        <span>Bảo hiểm chi trả (80%):</span>
                        <span>- {cartBhytCovered.toLocaleString('vi-VN')} đ</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-sm text-gray-800 pt-1 border-t border-gray-100">
                      <span>Bạn cần thanh toán:</span>
                      <span className="text-red-600 text-base">{cartPatientPaid.toLocaleString('vi-VN')} đ</span>
                    </div>
                  </div>
                </div>

                <Button 
                  type="primary" 
                  block 
                  size="large"
                  onClick={handleCheckout}
                  className="bg-teal-600 hover:bg-teal-500 border-teal-600 rounded-xl"
                >
                  Đăng Ký & Thanh Toán
                </Button>
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* Service Registration History */}
      <Card 
        title={
          <Space>
            <HistoryOutlined className="text-teal-600" />
            <span className="font-semibold text-gray-800">Lịch sử đăng ký dịch vụ của bạn</span>
          </Space>
        }
        className="shadow-sm rounded-xl border border-gray-100"
      >
        <Table
          dataSource={registrations}
          rowKey="registration_id"
          pagination={{ pageSize: 5 }}
          className="custom-table"
          columns={[
            {
              title: 'Mã Phiếu',
              dataIndex: 'registration_id',
              key: 'registration_id',
              render: (id: string, record: ServiceRegistration) => (
                <Space orientation="vertical" size={1}>
                  <span className="font-mono font-bold text-gray-800">{id}</span>
                  <span className="text-[10px] text-gray-400">
                    {dayjs(record.created_at).format('DD/MM/YYYY HH:mm')}
                  </span>
                </Space>
              )
            },
            {
              title: 'Lịch hẹn khám',
              key: 'schedule',
              render: (_, record: ServiceRegistration) => (
                record.scheduled_date ? (
                  <Space orientation="vertical" size={1}>
                    <Tag color="cyan" className="m-0 border-0 flex items-center gap-1 font-semibold text-xs">
                      <CalendarOutlined /> {dayjs(record.scheduled_date).format('DD/MM/YYYY')}
                    </Tag>
                    <Tag color="blue" className="m-0 border-0 flex items-center gap-1 text-[11px]">
                      <ClockCircleOutlined /> {record.scheduled_time}
                    </Tag>
                  </Space>
                ) : (
                  <span className="text-gray-400 text-xs">Chưa đặt lịch</span>
                )
              )
            },
            {
              title: 'Dịch vụ đã chọn',
              dataIndex: 'services',
              key: 'services',
              render: (services: any[]) => (
                <div className="max-w-[280px]">
                  {services.map((s, idx) => (
                    <div key={idx} className="text-xs text-gray-700 font-medium truncate">
                      • {s.service_name} <span className="text-gray-400 text-[10px]">(x{s.quantity})</span>
                    </div>
                  ))}
                </div>
              )
            },
            {
              title: 'Thực thu',
              dataIndex: 'patient_paid_amount',
              key: 'patient_paid_amount',
              render: (amount: number, record: ServiceRegistration) => (
                <div>
                  <div className="font-bold text-gray-800">{amount.toLocaleString('vi-VN')} đ</div>
                  {record.use_bhyt && record.bhyt_covered_amount > 0 && (
                    <div className="text-[10px] text-blue-500">Đã giảm BHYT</div>
                  )}
                </div>
              )
            },
            {
              title: 'Trạng thái',
              dataIndex: 'status',
              key: 'status',
              render: (status: string) => {
                let color = 'default';
                let text = status;
                if (status === 'PENDING') { color = 'orange'; text = 'Chờ thanh toán'; }
                if (status === 'PAID') { color = 'green'; text = 'Đã thanh toán'; }
                if (status === 'COMPLETED') { color = 'blue'; text = 'Đã thực hiện'; }
                if (status === 'REFUND_DUE') { color = 'processing'; text = 'Chờ hoàn tiền'; }
                if (status === 'REFUNDED') { color = 'purple'; text = 'Đã hoàn tiền'; }
                return <Tag color={color} className="rounded-md border-0 px-2.5 py-0.5">{text}</Tag>;
              }
            },
            {
              title: 'Hành động',
              key: 'actions',
              align: 'center',
              render: (_, record: ServiceRegistration) => (
                <Space>
                  <Tooltip title="Xem chi tiết">
                    <Button 
                      size="small" 
                      shape="circle" 
                      icon={<EyeOutlined />} 
                      onClick={() => {
                        setSelectedReg(record);
                        setViewDetailsModalOpen(true);
                      }} 
                    />
                  </Tooltip>

                  {record.status === 'PENDING' && (
                    <Button 
                      size="small" 
                      type="primary" 
                      icon={<CreditCardOutlined />}
                      onClick={() => {
                        setSelectedReg(record);
                        setPayModalOpen(true);
                      }}
                      className="bg-teal-600 hover:bg-teal-500 border-teal-600 text-xs rounded-md"
                    >
                      Thanh toán
                    </Button>
                  )}

                  {record.status === 'PAID' && (
                    <>
                      <Button 
                        size="small" 
                        type="primary" 
                        onClick={() => handleUseService(record)}
                        className="bg-blue-600 hover:bg-blue-500 border-blue-600 text-xs rounded-md"
                      >
                        Sử dụng
                      </Button>
                      <Button 
                        size="small"
                        onClick={() => handleOpenReschedule(record)}
                        className="text-xs rounded-md"
                      >
                        Đổi lịch
                      </Button>
                      <Button 
                        size="small" 
                        danger 
                        icon={<UndoOutlined />}
                        onClick={() => handleOpenRefundModal(record)}
                        className="text-xs rounded-md"
                      >
                        Hoàn tiền
                      </Button>
                    </>
                  )}

                  {record.status === 'REFUND_DUE' && (
                    <Button 
                      size="small" 
                      type="primary" 
                      icon={<UndoOutlined />}
                      onClick={() => handleSimulateApproveRefund(record)}
                      className="bg-purple-600 hover:bg-purple-500 border-purple-600 text-xs rounded-md"
                    >
                      Giả lập duyệt hoàn
                    </Button>
                  )}
                </Space>
              )
            }
          ]}
          locale={{ emptyText: <Empty description="Bạn chưa đăng ký dịch vụ nào" /> }}
        />
      </Card>

      {/* Modal: Checkout Confirmation */}
      <Modal
        title="Xác nhận đăng ký dịch vụ y tế"
        open={checkoutModalOpen}
        onCancel={() => setCheckoutModalOpen(false)}
        onOk={handleConfirmRegistration}
        okText="Xác nhận đăng ký"
        cancelText="Hủy"
        okButtonProps={{ className: 'bg-teal-600 border-teal-600 hover:bg-teal-500' }}
      >
        <div className="space-y-4 mt-4">
          <Paragraph className="text-sm text-gray-500">
            Vui lòng kiểm tra lại thông tin phiếu đăng ký dịch vụ và chọn lịch hẹn khám lâm sàng:
          </Paragraph>
          
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-2">
            <div className="text-xs text-gray-500 flex justify-between">
              <span>Bệnh nhân đăng ký:</span>
              <strong className="text-gray-800">{patientName}</strong>
            </div>
            <div className="text-xs text-gray-500 flex justify-between">
              <span>Tổng số lượng dịch vụ:</span>
              <strong className="text-gray-800">
                {cart.reduce((sum, item) => sum + item.quantity, 0)} dịch vụ
              </strong>
            </div>
            <div className="border-t border-gray-200 my-2 pt-2 text-xs text-gray-500 flex justify-between">
              <span>Tổng chi phí:</span>
              <span className="text-gray-800 font-bold">{cartTotal.toLocaleString('vi-VN')} đ</span>
            </div>
            {useBHYTInCart && cartBhytCovered > 0 && (
              <div className="text-xs text-blue-600 flex justify-between">
                <span>Hỗ trợ giảm trừ BHYT:</span>
                <span>- {cartBhytCovered.toLocaleString('vi-VN')} đ</span>
              </div>
            )}
            <div className="border-t border-dashed border-gray-300 pt-2 flex justify-between font-bold text-sm text-gray-800">
              <span>Thực thu / Cần trả:</span>
              <span className="text-red-600 text-base">{cartPatientPaid.toLocaleString('vi-VN')} đ</span>
            </div>
          </div>

          <Card title={<span className="text-xs font-bold uppercase tracking-wider text-teal-800">Đặt lịch khám lâm sàng</span>} size="small" className="border-teal-100 bg-teal-50/20">
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Chọn Ngày Khám:</label>
                <DatePicker 
                  className="w-full"
                  value={scheduledDate ? dayjs(scheduledDate) : null}
                  onChange={(date) => setScheduledDate(date ? date.format('YYYY-MM-DD') : '')}
                  disabledDate={(current) => current && current < dayjs().startOf('day')}
                  placeholder="Chọn ngày đến khám"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Chọn Khung Giờ:</label>
                <Select
                  className="w-full"
                  value={scheduledTime}
                  onChange={(val) => setScheduledTime(val)}
                  placeholder="Chọn khung giờ khám"
                >
                  <Select.Option value="07:30 - 08:30">07:30 - 08:30 (Sáng)</Select.Option>
                  <Select.Option value="08:30 - 09:30">08:30 - 09:30 (Sáng)</Select.Option>
                  <Select.Option value="09:30 - 10:30">09:30 - 10:30 (Sáng)</Select.Option>
                  <Select.Option value="10:30 - 11:30">10:30 - 11:30 (Sáng)</Select.Option>
                  <Select.Option value="13:30 - 14:30">13:30 - 14:30 (Chiều)</Select.Option>
                  <Select.Option value="14:30 - 15:30">14:30 - 15:30 (Chiều)</Select.Option>
                  <Select.Option value="15:30 - 16:30">15:30 - 16:30 (Chiều)</Select.Option>
                </Select>
              </div>
              <div className="text-[10px] text-gray-400 italic">
                * Lưu ý: Lịch hẹn giúp bạn được ưu tiên xếp phòng khám nhanh hơn tại quầy dịch vụ lâm sàng tự chọn.
              </div>
            </div>
          </Card>
        </div>
      </Modal>

      {/* Modal: VietQR Payment Simulation */}
      <Modal
        title="Thanh toán Đơn Đăng Ký Dịch Vụ"
        open={payModalOpen}
        onCancel={() => setPayModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setPayModalOpen(false)}>Hủy</Button>
        ]}
      >
        {selectedReg && (
          <div className="space-y-4 mt-2">
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
              <div className="flex justify-between mb-1"><Text>Mã đăng ký:</Text><Text strong className="font-mono text-xs">{selectedReg.registration_id}</Text></div>
              <div className="flex justify-between mb-1"><Text>Chủ tài khoản:</Text><Text>{selectedReg.patient_name}</Text></div>
              <div className="flex justify-between mb-1"><Text>Nội dung chuyển khoản:</Text><Text strong className="text-blue-600 font-mono">PAY {selectedReg.registration_id}</Text></div>
              <div className="flex justify-between pt-2 border-t border-dashed mt-2 font-bold text-base text-red-600">
                <Text>Tổng Số Tiền:</Text>
                <Text>{selectedReg.patient_paid_amount.toLocaleString('vi-VN')} đ</Text>
              </div>
            </div>

            <div className="text-center py-4 bg-white rounded-xl border border-gray-100 shadow-inner">
              {/* Using public VietQR mock service for maximum visual impact */}
              <img 
                src={`https://api.vietqr.io/image/970415-113366668888-r1Jb0hD.jpg?accountName=HEALHCARE%20SYSTEM&amount=${selectedReg.patient_paid_amount}&addInfo=PAY%20${selectedReg.registration_id}`} 
                alt="VietQR" 
                className="w-52 h-52 mx-auto mb-2 border rounded-xl shadow-md"
              />
              <Text className="text-xs text-gray-400 block max-w-sm mx-auto">
                Quét mã QR bằng ứng dụng Mobile Banking của bạn để tiến hành thanh toán dịch vụ.
              </Text>
            </div>

            <div className="p-4 bg-emerald-50 rounded-lg text-emerald-800 text-sm">
              <strong>Mô phỏng Demo:</strong> Cổng Webhook ngân hàng tự động phát hiện chuyển khoản. Bạn có thể bấm nút dưới để giả lập hoàn thành giao dịch ngay lập tức.
            </div>
            
            <Button 
              type="primary" 
              size="large" 
              block 
              onClick={() => handleSimulatePayment(selectedReg)} 
              className="bg-emerald-600 hover:bg-emerald-500 border-emerald-600 rounded-xl"
            >
              Mô phỏng thanh toán (Webhook)
            </Button>
          </div>
        )}
      </Modal>

      {/* Modal: Request Refund Form */}
      <Modal
        title="Yêu cầu hoàn trả viện phí dịch vụ"
        open={refundModalOpen}
        onCancel={() => setRefundModalOpen(false)}
        footer={null}
      >
        {selectedReg && (
          <Form form={refundForm} layout="vertical" onFinish={handleRequestRefund} className="mt-4">
            <div className="bg-yellow-50 p-3.5 rounded-lg border border-yellow-200 text-yellow-800 text-xs mb-4">
              Số tiền hoàn trả tối đa: <strong>{selectedReg.patient_paid_amount.toLocaleString('vi-VN')} đ</strong>. 
              Giao dịch hoàn tiền sẽ được chuyển thẳng về tài khoản ngân hàng của bạn sau khi quản trị viên duyệt.
            </div>

            <Form.Item 
              name="refund_bank_code" 
              label="Ngân hàng nhận" 
              rules={[{ required: true, message: 'Vui lòng chọn ngân hàng' }]}
            >
              <Select options={[
                { label: 'Vietcombank (VCB)', value: 'Vietcombank' },
                { label: 'Techcombank (TCB)', value: 'Techcombank' },
                { label: 'VietinBank (CTG)', value: 'VietinBank' },
                { label: 'BIDV (BID)', value: 'BIDV' },
                { label: 'MB Bank (MBB)', value: 'MBBank' },
              ]} placeholder="Chọn ngân hàng của bạn" />
            </Form.Item>

            <Form.Item 
              name="refund_account_no" 
              label="Số tài khoản" 
              rules={[{ required: true, message: 'Vui lòng nhập số tài khoản' }]}
            >
              <Input placeholder="Nhập số tài khoản ngân hàng" />
            </Form.Item>

            <Form.Item 
              name="refund_account_name" 
              label="Tên chủ tài khoản" 
              rules={[{ required: true, message: 'Vui lòng nhập tên chủ tài khoản' }]}
            >
              <Input placeholder="VD: NGUYEN VAN A" className="uppercase" />
            </Form.Item>

            <Form.Item 
              name="refund_reason" 
              label="Lý do hoàn tiền" 
              rules={[{ required: true, message: 'Vui lòng nhập lý do hoàn tiền' }]}
            >
              <Input.TextArea rows={3} placeholder="VD: Bác sĩ chỉ định đổi dịch vụ khác, hoặc tôi không muốn thực hiện dịch vụ này nữa..." />
            </Form.Item>

            <Form.Item className="mb-0 text-right">
              <Space>
                <Button onClick={() => setRefundModalOpen(false)}>Hủy</Button>
                <Button type="primary" htmlType="submit" className="bg-red-600 hover:bg-red-500 border-red-600">
                  Gửi yêu cầu hoàn tiền
                </Button>
              </Space>
            </Form.Item>
          </Form>
        )}
      </Modal>

      {/* Modal: View Details */}
      <Modal
        title={`Chi tiết Phiếu Đăng Ký ${selectedReg?.registration_id}`}
        open={viewDetailsModalOpen}
        onCancel={() => setViewDetailsModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setViewDetailsModalOpen(false)}>Đóng</Button>
        ]}
      >
        {selectedReg && (
          <div className="space-y-4 mt-2">
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Mã đăng ký:</span>
                <strong className="text-gray-800">{selectedReg.registration_id}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Ngày đăng ký:</span>
                <span className="text-gray-700">{dayjs(selectedReg.created_at).format('DD/MM/YYYY HH:mm:ss')}</span>
              </div>
              {selectedReg.scheduled_date && (
                <div className="flex justify-between border-t border-gray-100 pt-2">
                  <span className="text-gray-500">Lịch hẹn khám:</span>
                  <span className="text-teal-700 font-semibold flex items-center gap-1">
                    <CalendarOutlined /> {dayjs(selectedReg.scheduled_date).format('DD/MM/YYYY')} vào {selectedReg.scheduled_time}
                  </span>
                </div>
              )}
              <div className="flex justify-between border-t border-gray-100 pt-2">
                <span className="text-gray-500">Trạng thái phiếu:</span>
                <Tag color={
                  selectedReg.status === 'PENDING' ? 'orange' :
                  selectedReg.status === 'PAID' ? 'green' :
                  selectedReg.status === 'COMPLETED' ? 'blue' :
                  selectedReg.status === 'REFUND_DUE' ? 'processing' : 'purple'
                } className="m-0 border-0 px-2 rounded-md">
                  {selectedReg.status}
                </Tag>
              </div>
            </div>

            <div>
              <Text strong className="text-xs text-gray-500 uppercase tracking-wider block mb-2">
                Danh sách dịch vụ lâm sàng:
              </Text>
              <div className="space-y-2">
                {selectedReg.services.map((s, idx) => (
                  <div key={idx} className="p-3 bg-gray-50 rounded-lg flex justify-between items-center text-xs">
                    <div>
                      <div className="font-semibold text-gray-800">{s.service_name}</div>
                      <div className="text-gray-400">Mã: {s.service_code}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-teal-600">{(s.actual_price * s.quantity).toLocaleString('vi-VN')} đ</div>
                      <div className="text-[10px] text-gray-400">Số lượng: {s.quantity}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-200 pt-3 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Tổng tiền dịch vụ:</span>
                <span className="text-gray-800 font-medium">{selectedReg.total_amount.toLocaleString('vi-VN')} đ</span>
              </div>
              {selectedReg.use_bhyt && selectedReg.bhyt_covered_amount > 0 && (
                <div className="flex justify-between text-blue-600">
                  <span>Bảo hiểm chi trả (80%):</span>
                  <span>- {selectedReg.bhyt_covered_amount.toLocaleString('vi-VN')} đ</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-sm text-gray-800 pt-1.5 border-t border-gray-100">
                <span>Số tiền bạn đã thanh toán:</span>
                <span className="text-red-600 text-base">{selectedReg.patient_paid_amount.toLocaleString('vi-VN')} đ</span>
              </div>
            </div>

            {selectedReg.refund_bank_code && (
              <div className="bg-red-50 p-4 rounded-xl border border-red-100 space-y-2 text-xs mt-2">
                <Text strong className="text-red-800 block text-xs uppercase tracking-wider mb-1">
                  Thông tin hoàn trả viện phí:
                </Text>
                <div className="flex justify-between">
                  <span className="text-red-700">Ngân hàng:</span>
                  <span className="text-red-900 font-semibold">{selectedReg.refund_bank_code}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-red-700">Số tài khoản:</span>
                  <span className="text-red-900 font-semibold">{selectedReg.refund_account_no}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-red-700">Chủ tài khoản:</span>
                  <span className="text-red-900 font-semibold uppercase">{selectedReg.refund_account_name}</span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-red-700">Lý do hoàn trả:</span>
                  <span className="text-red-900 font-medium text-right max-w-[65%]">{selectedReg.refund_reason}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Modal: Reschedule */}
      <Modal
        title="Thay đổi lịch hẹn khám dịch vụ"
        open={rescheduleModalOpen}
        onCancel={() => setRescheduleModalOpen(false)}
        onOk={handleSaveReschedule}
        okText="Lưu lịch hẹn mới"
        cancelText="Hủy"
        okButtonProps={{ className: 'bg-teal-600 border-teal-600 hover:bg-teal-500' }}
      >
        {rescheduleReg && (
          <div className="space-y-4 mt-4">
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-xs space-y-1 text-blue-900">
              <div>Mã phiếu: <strong>{rescheduleReg.registration_id}</strong></div>
              <div>Bệnh nhân: <strong>{rescheduleReg.patient_name}</strong></div>
              <div>Lịch hiện tại: <strong>{dayjs(rescheduleReg.scheduled_date).format('DD/MM/YYYY')} ({rescheduleReg.scheduled_time})</strong></div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Chọn Ngày Hẹn Mới:</label>
                <DatePicker 
                  className="w-full"
                  value={newDate ? dayjs(newDate) : null}
                  onChange={(date) => setNewDate(date ? date.format('YYYY-MM-DD') : '')}
                  disabledDate={(current) => current && current < dayjs().startOf('day')}
                  placeholder="Chọn ngày hẹn mới"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Chọn Khung Giờ Mới:</label>
                <Select
                  className="w-full"
                  value={newTime}
                  onChange={(val) => setNewTime(val)}
                  placeholder="Chọn khung giờ mới"
                >
                  <Select.Option value="07:30 - 08:30">07:30 - 08:30 (Sáng)</Select.Option>
                  <Select.Option value="08:30 - 09:30">08:30 - 09:30 (Sáng)</Select.Option>
                  <Select.Option value="09:30 - 10:30">09:30 - 10:30 (Sáng)</Select.Option>
                  <Select.Option value="10:30 - 11:30">10:30 - 11:30 (Sáng)</Select.Option>
                  <Select.Option value="13:30 - 14:30">13:30 - 14:30 (Chiều)</Select.Option>
                  <Select.Option value="14:30 - 15:30">14:30 - 15:30 (Chiều)</Select.Option>
                  <Select.Option value="15:30 - 16:30">15:30 - 16:30 (Chiều)</Select.Option>
                </Select>
              </div>
              <div className="text-[10px] text-gray-400 italic">
                * Lưu ý: Thay đổi lịch hẹn thành công sẽ tự động cập nhật hệ thống và gửi email thông báo mới cho bạn.
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
