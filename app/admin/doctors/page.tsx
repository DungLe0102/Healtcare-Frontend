import DoctorManagement from '@/components/admin/DoctorManagement';

export const metadata = {
  title: 'Quản lý Bác Sĩ - Admin Portal',
  description: 'Quản lý thông tin và trạng thái các bác sĩ trong hệ thống.',
};

export default function AdminDoctorsPage() {
  return <DoctorManagement />;
}
