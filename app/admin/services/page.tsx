import ServiceManagement from '@/components/admin/ServiceManagement';

export const metadata = {
  title: 'Quản lý Dịch vụ - Admin Portal',
  description: 'Quản lý danh mục dịch vụ khám chữa bệnh.',
};

export default function AdminServicesPage() {
  return <ServiceManagement />;
}
