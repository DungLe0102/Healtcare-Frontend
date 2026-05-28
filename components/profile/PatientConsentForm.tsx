"use client";

import React, { useEffect, useState } from 'react';
import { Form, Button, Switch, message, Spin, Alert, Typography } from 'antd';
import { patientApi, ConsentCreate } from '@/api/patient';
import { getErrorMessage } from '@/utils/errorHandler';

const { Text, Paragraph } = Typography;

export default function PatientConsentForm() {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [patientId, setPatientId] = useState<string | null>(null);
  
  // Current consent statuses
  const [consents, setConsents] = useState({
    DATA_PROCESSING: false,
    RESEARCH: false,
  });

  useEffect(() => {
    fetchConsentHistory();
  }, []);

  const fetchConsentHistory = async () => {
    try {
      setFetching(true);
      const profile = await patientApi.getMyProfile();
      if (profile && profile.patient_id) {
        setPatientId(profile.patient_id);
        
        // Fetch all consents to determine current status
        const history = await patientApi.getPatientConsents(profile.patient_id);
        
        // Find latest status for each type
        const latestConsents = { DATA_PROCESSING: false, RESEARCH: false };
        
        // Sort ascending by created_at to apply them in order, or just find the first (latest) if backend returns descending
        // Assume backend returns descending (newest first)
        if (history && history.length > 0) {
          const processedType = history.find(c => c.consent_type === 'DATA_PROCESSING');
          const researchType = history.find(c => c.consent_type === 'RESEARCH');
          
          if (processedType) latestConsents.DATA_PROCESSING = processedType.is_granted;
          if (researchType) latestConsents.RESEARCH = researchType.is_granted;
        }
        
        setConsents(latestConsents);
      }
    } catch (error: any) {
      // Don't show error if profile not found (they need to create profile first)
      if (error.response?.status !== 404) {
        console.error("Lỗi khi tải đồng thuận", error);
      }
    } finally {
      setFetching(false);
    }
  };

  const handleToggleConsent = async (type: string, isGranted: boolean) => {
    if (!patientId) {
      message.warning('Vui lòng tạo hồ sơ y tế trước khi cập nhật đồng thuận.');
      return;
    }
    
    setLoading(true);
    try {
      const payload: ConsentCreate = {
        patient_id: patientId,
        consent_type: type,
        is_granted: isGranted
      };
      
      await patientApi.recordConsent(payload);
      message.success(`Đã cập nhật tùy chọn đồng thuận: ${isGranted ? 'Đồng ý' : 'Từ chối'}`);
      
      // Update local state
      setConsents(prev => ({ ...prev, [type]: isGranted }));
    } catch (error: any) {
      message.error(getErrorMessage(error, 'Thao tác thất bại'));
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return <div className="flex justify-center p-8"><Spin /></div>;
  }

  if (!patientId) {
    return (
      <Alert 
        title="Yêu cầu Hồ sơ y tế" 
        description="Bạn cần cập nhật Hồ sơ y tế (tab bên cạnh) trước khi có thể cấu hình Quyền riêng tư."
        type="warning" 
        showIcon 
        className="mt-4"
      />
    );
  }

  return (
    <div className="mt-4">
      <Alert 
        title="Bảo vệ Dữ liệu Cá nhân (NĐ 13/2023/NĐ-CP)" 
        description="Hệ thống tôn trọng quyền riêng tư của bạn. Bạn có thể cấp hoặc rút lại quyền sử dụng dữ liệu bất kỳ lúc nào. Mọi thao tác đều được hệ thống lưu vết bảo mật."
        type="info" 
        showIcon 
        className="mb-6"
      />

      <div className="flex items-start justify-between p-4 border border-gray-100 rounded-lg bg-white mb-4 shadow-sm">
        <div className="flex-1 pr-4">
          <Text strong className="text-base block mb-1">Xử lý dữ liệu Y tế & Đặt khám</Text>
          <Paragraph className="text-gray-500 text-sm mb-0">
            Đồng ý cho phép hệ thống thu thập, lưu trữ và xử lý các thông tin cá nhân, hồ sơ bệnh án để phục vụ cho việc khám chữa bệnh, thanh toán BHYT và liên lạc hỗ trợ. (Khuyến nghị bật để sử dụng dịch vụ).
          </Paragraph>
        </div>
        <Switch 
          checked={consents.DATA_PROCESSING} 
          loading={loading}
          onChange={(checked) => handleToggleConsent('DATA_PROCESSING', checked)}
        />
      </div>

      <div className="flex items-start justify-between p-4 border border-gray-100 rounded-lg bg-white shadow-sm">
        <div className="flex-1 pr-4">
          <Text strong className="text-base block mb-1">Nghiên cứu khoa học & Cải thiện dịch vụ</Text>
          <Paragraph className="text-gray-500 text-sm mb-0">
            Đồng ý ẩn danh hóa dữ liệu bệnh án của bạn để phục vụ cho mục đích nghiên cứu y khoa, thống kê dịch tễ và cải thiện chất lượng dịch vụ của bệnh viện.
          </Paragraph>
        </div>
        <Switch 
          checked={consents.RESEARCH} 
          loading={loading}
          onChange={(checked) => handleToggleConsent('RESEARCH', checked)}
        />
      </div>
    </div>
  );
}
