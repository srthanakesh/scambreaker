import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import InteractiveReportFlow from './InteractiveReportFlow';

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
    <>
      <InteractiveReportFlow user={user} />
    </>
  );
}
