import type { Metadata } from 'next';
import AdminLogin from '@/app/components/auth/AdminLogin';

export const metadata: Metadata = {
  title: 'Admin Login',
};

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen flex flex-col justify-between items-center">
      <AdminLogin />
    </div>
  );
}
