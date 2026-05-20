import ScheduleManagement from '@/components/admin/ScheduleManagement';

export const metadata = {
  title: 'Quản lý Lịch Khám - Admin Portal',
  description: 'Quản lý lịch khám tổng của bệnh viện.',
};

export default function AdminSchedulesPage() {
  return <ScheduleManagement />;
}
