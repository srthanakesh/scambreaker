'use client';

import { useState } from 'react';
import { UserCircle, Shield, KeyRound, Bell } from 'lucide-react';
import ChangePasswordForm from './ChangePasswordForm';

export default function ProfileTabs({ user, session }: { user: any; session: any }) {
  const [activeTab, setActiveTab] = useState('profile');

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Left Nav (Stateful UI) */}
      <div className="md:col-span-1 space-y-1">
        <button 
          onClick={() => setActiveTab('profile')}
          className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === 'profile' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          <UserCircle className={`w-5 h-5 ${activeTab === 'profile' ? 'text-blue-600' : 'text-slate-400'}`} />
          <span>Profile details</span>
        </button>
        <button 
          onClick={() => setActiveTab('extra')}
          className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === 'extra' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          <Shield className={`w-5 h-5 ${activeTab === 'extra' ? 'text-blue-600' : 'text-slate-400'}`} />
          <span>Extra details</span>
        </button>
        <button 
          onClick={() => setActiveTab('password')}
          className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === 'password' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          <KeyRound className={`w-5 h-5 ${activeTab === 'password' ? 'text-blue-600' : 'text-slate-400'}`} />
          <span>Password</span>
        </button>
      </div>

      {/* Main Content Pane */}
      <div className="md:col-span-2">
        {activeTab === 'profile' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mb-6">
              <div className="p-6 border-b border-slate-100">
                <h2 className="text-lg font-semibold text-slate-900">Personal Information</h2>
                <p className="text-sm text-slate-500 mt-1">Update your primary contact details used for case tracking.</p>
              </div>
              
              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                  <input 
                    type="email" 
                    disabled 
                    value={session.email || ''} 
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-slate-600 cursor-not-allowed" 
                  />
                  <p className="text-xs text-slate-500 mt-2">Email changes must be authorized through ScamBreaker support.</p>
                </div>

                <hr className="border-slate-100" />

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Full Identity Name</label>
                  <input 
                    type="text" 
                    defaultValue={user?.fullName || 'Registered User'} 
                    className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" 
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Identification Number (IC)</label>
                  <input 
                    type="text" 
                    disabled
                    value={user?.icNumber || ''} 
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-slate-600 cursor-not-allowed" 
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Primary Phone Number</label>
                  <input 
                    type="tel" 
                    defaultValue={user?.phoneNumber || ''}
                    placeholder="+60 1x-xxxxxxx" 
                    className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" 
                  />
                </div>

                <div className="pt-4 flex justify-end">
                  <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg shadow-sm transition-colors">
                    Save Changes
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-red-50 border border-red-100 rounded-2xl p-6">
              <h3 className="text-red-800 font-semibold">Danger Zone</h3>
              <p className="text-red-600 text-sm mt-1 mb-4">Permanently delete your account and withdraw active case access.</p>
              <button className="bg-white border border-red-200 text-red-600 hover:bg-red-600 hover:text-white hover:border-red-600 font-medium py-2 px-4 rounded-lg shadow-sm transition-colors text-sm">
                Delete Account
              </button>
            </div>
          </div>
        )}

        {activeTab === 'extra' && (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Extra Details</h2>
                <p className="text-sm text-slate-500 mt-1">Optional information to speed up processing and jurisdiction matching.</p>
              </div>
              <span className="text-xs font-medium bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full">Optional</span>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Home Address</label>
                <textarea 
                  rows={3}
                  placeholder="Street address, City, Postcode, State" 
                  className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none" 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nearest Police Station Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Balai Polis Brickfields" 
                  className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" 
                />
                <p className="text-xs text-slate-500 mt-2">This helps us auto-route physical follow-up visits if necessary.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Alternative Contact Info</label>
                <input 
                  type="text" 
                  placeholder="Secondary phone, Telegram handle, etc." 
                  className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" 
                />
              </div>

              <div className="pt-4 flex justify-end">
                <button className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium py-2 px-6 rounded-lg shadow-sm transition-colors border border-slate-300">
                  Save Preferences
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'password' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
             <ChangePasswordForm />
          </div>
        )}
      </div>
    </div>
  );
}
