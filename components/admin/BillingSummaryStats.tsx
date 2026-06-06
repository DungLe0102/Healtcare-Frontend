"use client";

import React from 'react';
import { Card, Row, Col, Statistic, Progress, Typography, Tag } from 'antd';
import { 
  DollarOutlined, 
  CheckCircleOutlined, 
  HourglassOutlined, 
  UndoOutlined 
} from '@ant-design/icons';
import { BillingResponse } from '@/api/billing';

const { Text } = Typography;

interface BillingSummaryStatsProps {
  billings: BillingResponse[];
}

export default function BillingSummaryStats({ billings }: BillingSummaryStatsProps) {
  // Calculate stats from the list of billings
  const totalInvoiced = billings.reduce((sum, b) => sum + Number(b.patient_paid_amount || 0), 0);
  
  let totalCollected = 0;
  let totalRefunded = 0;
  
  let unpaidCount = 0;
  let paidCount = 0;
  let partialCount = 0;
  let refundDueCount = 0;
  let refundedCount = 0;

  billings.forEach(b => {
    if (b.billing_status === 'UNPAID') unpaidCount++;
    else if (b.billing_status === 'PAID') paidCount++;
    else if (b.billing_status === 'PARTIAL') partialCount++;
    else if (b.billing_status === 'REFUND_DUE') refundDueCount++;
    else if (b.billing_status === 'REFUNDED') refundedCount++;

    b.transactions?.forEach(tx => {
      const amt = Number(tx.amount || 0);
      if (tx.transaction_status === 'SUCCESS') {
        totalCollected += amt;
      } else if (tx.transaction_status === 'REFUNDED') {
        totalRefunded += amt;
      }
    });
  });

  const totalOutstanding = Math.max(0, totalInvoiced - totalCollected - totalRefunded);
  
  // Calculate payment collection rate
  const collectionRate = totalInvoiced > 0 
    ? Math.round((totalCollected / totalInvoiced) * 100) 
    : 0;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  return (
    <div className="space-y-6 mb-6">
      {/* 4 Stats Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card className="rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow bg-gradient-to-br from-white to-blue-50/20">
            <Statistic
              title={<span className="text-gray-500 font-medium">Tổng hóa đơn phát sinh</span>}
              value={totalInvoiced}
              formatter={(val) => <span className="text-blue-700 font-bold text-xl">{formatCurrency(val as number)}</span>}
              prefix={<DollarOutlined className="text-blue-500" />}
            />
            <div className="mt-2 text-xs text-gray-400">
              Tổng số lượng: <strong className="text-gray-600">{billings.length} hóa đơn</strong>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card className="rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow bg-gradient-to-br from-white to-emerald-50/20">
            <Statistic
              title={<span className="text-gray-500 font-medium">Đã thu thực tế</span>}
              value={totalCollected}
              formatter={(val) => <span className="text-emerald-700 font-bold text-xl">{formatCurrency(val as number)}</span>}
              prefix={<CheckCircleOutlined className="text-emerald-500" />}
            />
            <div className="mt-2 text-xs text-gray-400">
              Đã thu từ các giao dịch thành công
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card className="rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow bg-gradient-to-br from-white to-orange-50/20">
            <Statistic
              title={<span className="text-gray-500 font-medium">Chưa thanh toán (Còn thiếu)</span>}
              value={totalOutstanding}
              formatter={(val) => <span className="text-orange-600 font-bold text-xl">{formatCurrency(val as number)}</span>}
              prefix={<HourglassOutlined className="text-orange-400" />}
            />
            <div className="mt-2 text-xs text-gray-400">
              Chưa trả hoặc thanh toán một phần
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card className="rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow bg-gradient-to-br from-white to-purple-50/20">
            <Statistic
              title={<span className="text-gray-500 font-medium">Đã hoàn trả</span>}
              value={totalRefunded}
              formatter={(val) => <span className="text-purple-600 font-bold text-xl">{formatCurrency(val as number)}</span>}
              prefix={<UndoOutlined className="text-purple-500" />}
            />
            <div className="mt-2 text-xs text-gray-400">
              Tổng số tiền đã hoàn trả VietQR
            </div>
          </Card>
        </Col>
      </Row>

      {/* Progress & Distribution Card */}
      <Card className="rounded-xl shadow-sm border border-gray-100">
        <Row gutter={[24, 16]} align="middle">
          <Col xs={24} md={10}>
            <div className="space-y-1">
              <Text strong className="text-gray-700 block text-sm">Tỷ lệ thu hồi viện phí</Text>
              <Text className="text-gray-400 text-xs block mb-2">Tỷ lệ tiền đã thu trên tổng hóa đơn phát sinh</Text>
              <Progress 
                percent={collectionRate} 
                strokeColor={{
                  '0%': '#10B981',
                  '100%': '#059669',
                }}
                status={collectionRate === 100 ? 'normal' : 'active'}
              />
            </div>
          </Col>
          <Col xs={24} md={14}>
            <div className="space-y-2">
              <Text strong className="text-gray-700 block text-sm mb-1">Phân bố trạng thái hóa đơn</Text>
              <div className="flex flex-wrap gap-2">
                <Tag color="green" className="rounded-md px-3 py-1 flex items-center gap-1 border-0 bg-green-50 text-green-700">
                  <span className="font-semibold">{paidCount}</span> Đã thanh toán
                </Tag>
                <Tag color="blue" className="rounded-md px-3 py-1 flex items-center gap-1 border-0 bg-blue-50 text-blue-700">
                  <span className="font-semibold">{partialCount}</span> Thanh toán một phần
                </Tag>
                <Tag color="orange" className="rounded-md px-3 py-1 flex items-center gap-1 border-0 bg-orange-50 text-orange-700">
                  <span className="font-semibold">{refundDueCount}</span> Chờ hoàn tiền
                </Tag>
                <Tag color="purple" className="rounded-md px-3 py-1 flex items-center gap-1 border-0 bg-purple-50 text-purple-700">
                  <span className="font-semibold">{refundedCount}</span> Đã hoàn tiền
                </Tag>
                <Tag color="default" className="rounded-md px-3 py-1 flex items-center gap-1 border-0 bg-gray-100 text-gray-700">
                  <span className="font-semibold">{unpaidCount}</span> Chưa thanh toán
                </Tag>
              </div>
            </div>
          </Col>
        </Row>
      </Card>
    </div>
  );
}
