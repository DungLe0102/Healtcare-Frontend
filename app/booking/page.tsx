import BookingFlow from '@/components/booking/BookingFlow';

export const metadata = {
  title: 'Đặt lịch khám - Healthcare System',
  description: 'Đặt lịch khám trực tuyến nhanh chóng và tiện lợi',
};

export default function BookingPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <BookingFlow />
    </div>
  );
}
