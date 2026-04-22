import Link from 'next/link';
import { Shield, LogOut, Settings } from 'lucide-react';
import { logout } from '@/app/actions/auth';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export default async function VictimLayout({ children }: { children: React.ReactNode }) {
  const session = await getCurrentUser();

  // If this is the login/register page, don't show the dashboard navbar
  if (!session || session.role !== 'VICTIM') {
    return <>{children}</>;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId }
  });

  const firstName = user?.fullName?.split(' ')[0] || session.email;

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center cursor-pointer">
              <Link href="/victim/dashboard">
                <span className="text-2xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-slate-800 to-slate-500">ScamBreaker</span>
              </Link>
            </div>
            <div className="flex items-center space-x-6">
              <span className="text-sm border-r pr-6 border-slate-200 text-slate-500 hidden sm:block">Welcome, <span className="font-medium text-slate-700">{firstName}</span></span>
              
              <Link href="/victim/profile" className="text-slate-500 hover:text-blue-600 flex items-center text-sm font-medium transition-colors">
                <Settings className="h-4 w-4 mr-1.5" />
                Settings
              </Link>

              <form action={logout}>
                <button type="submit" className="text-slate-500 hover:text-red-600 flex items-center text-sm font-medium transition-colors">
                  <LogOut className="h-4 w-4 mr-1.5" />
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
