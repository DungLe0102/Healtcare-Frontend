import DepartmentManagement from '@/components/admin/DepartmentManagement';

export const metadata = {
  title: 'Quản lý Khoa/Phòng - Admin Portal',
  description: 'Khởi tạo và quản lý danh mục khoa/phòng chuẩn hóa theo Thông tư Bộ Y Tế.',
};

export default function AdminDepartmentsPage() {
  return <DepartmentManagement />;
}
