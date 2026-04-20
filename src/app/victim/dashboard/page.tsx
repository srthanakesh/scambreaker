import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { LogOut, FileText, PlusCircle } from 'lucide-react';
import { logout } from '@/app/actions/auth';

export default async function VictimDashboard() {
  const session = await getCurrentUser();
  if (!session || session.role !== 'VICTIM') {
    redirect('/victim/login');
  }

  const cases = await prisma.case.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <>
      <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-slate-900">My Cases</h1>
          <Link href="/victim/report" className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
            <PlusCircle className="h-4 w-4 mr-2" />
            Report New Scam
          </Link>
        </div>

        {cases.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-slate-400" />
            <h3 className="mt-2 text-sm font-medium text-slate-900">No cases reported</h3>
            <p className="mt-1 text-sm text-slate-500">You haven't reported any scams yet.</p>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-md border border-slate-200">
            <ul className="divide-y divide-slate-200">
              {cases.map((c) => (
                <li key={c.id}>
                  <Link href={`/victim/cases/${c.id}`} className="block hover:bg-slate-50">
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-blue-600 truncate">{c.scamType || 'Unknown Scam'}</p>
                        <div className="ml-2 flex-shrink-0 flex">
                          <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                            {c.workflowStatus}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 sm:flex sm:justify-between">
                        <div className="sm:flex">
                          <p className="flex items-center text-sm text-slate-500">
                            Reported on {new Date(c.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="mt-2 flex items-center text-sm text-slate-500 sm:mt-0">
                          Loss: RM {c.amountLost}
                        </div>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
    </>
  );
}

function Shield(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
    </svg>
  );
}
