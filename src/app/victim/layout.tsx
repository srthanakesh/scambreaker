import Link from 'next/link';
import { Shield, LogOut } from 'lucide-react';
import { logout } from '@/app/actions/auth';
import { getCurrentUser } from '@/lib/auth';

export default async function VictimLayout({ children }: { children: React.ReactNode }) {
  const session = await getCurrentUser();

  // If this is the login/register page, don't show the dashboard navbar
  if (!session || session.role !== 'VICTIM') {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-blue-600 mr-2" />
              <Link href="/victim/dashboard" className="font-bold text-xl text-slate-900">
                ScamBreaker
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-slate-600">Welcome, {session.email}</span>
              <form action={logout}>
                <button type="submit" className="text-slate-500 hover:text-red-600 flex items-center text-sm font-medium">
                  <LogOut className="h-4 w-4 mr-1" />
                  Logout
                </button>
              </form>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
