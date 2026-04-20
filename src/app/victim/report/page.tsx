import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import IntakeForm from './IntakeForm';

export default async function IntakePage() {
  const session = await getCurrentUser();
  if (!session || session.role !== 'VICTIM') {
    redirect('/victim/login');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { fullName: true, icNumber: true, phoneNumber: true }
  });

  if (!user) {
    redirect('/victim/login');
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-slate-900 mb-6">Report a Scam</h1>
      
      <IntakeForm user={user} />
      
      <div className="mt-8 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-r-md shadow-sm">
        <div className="flex">
          <div className="ml-3">
            <p className="text-sm text-yellow-800">
              <strong>Emergency Note:</strong> If you just lost money, immediately call the National Scam Response Centre (NSRC) at <strong>997</strong>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
