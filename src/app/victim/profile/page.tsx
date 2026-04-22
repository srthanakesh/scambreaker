import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { UserCircle, Shield, KeyRound, Bell } from 'lucide-react';
import ProfileTabs from './ProfileTabs';
import { prisma } from '@/lib/prisma';

export default async function VictimProfile() {
  const session = await getCurrentUser();

  if (!session || session.role !== 'VICTIM') {
    redirect('/victim/login');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId }
  });

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 animate-page-enter">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Account Settings</h1>
        <p className="text-slate-500 mt-1">Manage your personal profile and security preferences.</p>
      </div>

      <ProfileTabs user={user} session={session} />
    </div>
  );
}
