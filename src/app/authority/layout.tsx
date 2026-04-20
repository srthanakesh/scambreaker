import Link from 'next/link';
import { ShieldAlert, LogOut } from 'lucide-react';
import { logout } from '@/app/actions/auth';
import { getCurrentUser } from '@/lib/auth';

export default async function AuthorityLayout({ children }: { children: React.ReactNode }) {
  const session = await getCurrentUser();

  // If this is the login page, don't show the dashboard navbar
  // We can't easily check pathname in a Server Component layout without headers hack,
  // but we can just let the login page render normally if session is null.
  if (!session || session.role !== 'AUTHORITY') {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <ShieldAlert className="h-8 w-8 text-red-600 mr-2" />
              <Link href="/authority/dashboard" className="font-bold text-xl text-slate-900">
                Authority Portal
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-slate-600 font-medium">Badge: {session.email}</span>
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
      <main className="max-w-7xl mx-auto py-6">
        {children}
      </main>
    </div>
  );
}
