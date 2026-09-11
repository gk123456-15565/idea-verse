import React, { useState } from 'react';
import {
  User as UserIcon,
  Lock,
  Database,
  Key,
  LogOut,
  CheckCircle,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  Server,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usersApi } from '../services/api';

interface SettingsPageProps {
  onNavigate: (page: string) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onNavigate }) => {
  const { currentUser, updateUser, logout, authStatus } = useAuth();

  const [activeSection, setActiveSection] = useState<'profile' | 'security' | 'system'>('profile');

  // Profile fields
  const [name, setName] = useState(currentUser?.name || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [website, setWebsite] = useState(currentUser?.website || '');
  const [location, setLocation] = useState(currentUser?.location || '');

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setStatusMsg(null);

    try {
      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('bio', bio.trim());
      formData.append('website', website.trim());
      formData.append('location', location.trim());

      const res = await usersApi.updateProfile(formData);
      if (res.success && res.user) {
        updateUser(res.user);
        setStatusMsg({ type: 'success', text: 'Profile details updated successfully.' });
      }
    } catch (err) {
      setStatusMsg({ type: 'error', text: (err as Error).message });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);

    if (newPassword.length < 6) {
      setStatusMsg({ type: 'error', text: 'New password must be at least 6 characters.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setStatusMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    try {
      setIsSaving(true);
      const formData = new FormData();
      formData.append('currentPassword', currentPassword);
      formData.append('newPassword', newPassword);

      const res = await usersApi.updateProfile(formData);
      if (res.success) {
        setStatusMsg({ type: 'success', text: 'Password successfully updated.' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      setStatusMsg({ type: 'error', text: (err as Error).message });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Settings</h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage your account preferences, security credentials, and integration status.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Navigation Sidebar */}
        <div className="md:col-span-4 space-y-1">
          <div className="bg-white rounded-2xl p-2 border border-slate-200/80 shadow-2xs space-y-1">
            <button
              onClick={() => {
                setActiveSection('profile');
                setStatusMsg(null);
              }}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                activeSection === 'profile'
                  ? 'bg-blue-50 text-blue-600 shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100/70'
              }`}
            >
              <UserIcon className="w-4 h-4" />
              <span>Creator Profile</span>
            </button>

            <button
              onClick={() => {
                setActiveSection('security');
                setStatusMsg(null);
              }}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                activeSection === 'security'
                  ? 'bg-blue-50 text-blue-600 shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100/70'
              }`}
            >
              <Lock className="w-4 h-4" />
              <span>Account & Security</span>
            </button>

            <button
              onClick={() => {
                setActiveSection('system');
                setStatusMsg(null);
              }}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                activeSection === 'system'
                  ? 'bg-blue-50 text-blue-600 shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100/70'
              }`}
            >
              <Server className="w-4 h-4" />
              <span>System & Status</span>
            </button>
          </div>

          <div className="p-2">
            <button
              onClick={logout}
              className="w-full flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-rose-500" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Content Pane */}
        <div className="md:col-span-8">
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-2xs">
            {statusMsg && (
              <div
                className={`mb-5 p-3.5 rounded-2xl text-xs flex items-center gap-2.5 ${
                  statusMsg.type === 'success'
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                    : 'bg-rose-50 border border-rose-200 text-rose-700'
                }`}
              >
                {statusMsg.type === 'success' ? (
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                )}
                <span>{statusMsg.text}</span>
              </div>
            )}

            {activeSection === 'profile' && (
              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <h3 className="text-base font-bold text-slate-900 mb-1">Creator Profile</h3>
                <p className="text-xs text-slate-500 mb-4">
                  Information visible to other members across IDEAVERSE.
                </p>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Bio</label>
                  <textarea
                    rows={3}
                    maxLength={300}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Location</label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Website</label>
                    <input
                      type="text"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 outline-hidden"
                    />
                  </div>
                </div>

                <div className="pt-3 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs shadow-blue-600/20 transition-all cursor-pointer"
                  >
                    {isSaving ? 'Saving...' : 'Save Profile'}
                  </button>
                </div>
              </form>
            )}

            {activeSection === 'security' && (
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <h3 className="text-base font-bold text-slate-900 mb-1">Change Password</h3>
                <p className="text-xs text-slate-500 mb-4">
                  Keep your account secure with a strong password.
                </p>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Current Password</label>
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">New Password</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 outline-hidden"
                  />
                </div>

                <div className="pt-3 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs shadow-blue-600/20 transition-all cursor-pointer"
                  >
                    {isSaving ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </form>
            )}

            {activeSection === 'system' && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-base font-bold text-slate-900 mb-1">System Diagnostics</h3>
                  <p className="text-xs text-slate-500">
                    Configuration and health metrics for the IDEAVERSE instance.
                  </p>
                </div>

                {/* MongoDB status card */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-2">
                      <Database className="w-4 h-4 text-blue-600" />
                      Database Cluster Status
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        authStatus.dbConnected
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {authStatus.dbConnected ? 'MongoDB Atlas Connected' : 'Local In-Memory Store Active'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {authStatus.dbConnected
                      ? 'The application is actively synchronizing documents with MongoDB Atlas using Mongoose.'
                      : 'Running safely with simulated schema validation and local memory persistence. Set MONGODB_URI in .env to connect to an Atlas cluster.'}
                  </p>
                </div>

                {/* Google Auth status card */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-2">
                      <Key className="w-4 h-4 text-blue-600" />
                      Google Identity Services
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        authStatus.googleAuthAvailable
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {authStatus.googleAuthAvailable ? 'Active' : 'Awaiting GOOGLE_CLIENT_ID'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Google Identity Services is natively integrated in the client code. To enable one-tap Google login, provide <code className="bg-slate-200/70 px-1 py-0.5 rounded text-slate-800">GOOGLE_CLIENT_ID</code> in <code className="bg-slate-200/70 px-1 py-0.5 rounded text-slate-800">.env</code>.
                  </p>
                </div>

                {/* File Upload details */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                    Multer Upload Constraints
                  </span>
                  <div className="text-xs text-slate-500 space-y-1">
                    <p>• Allowed mime-types: <code className="text-slate-800">image/jpeg</code>, <code className="text-slate-800">image/png</code>, <code className="text-slate-800">image/webp</code></p>
                    <p>• Max file size: 5 Megabytes (MB)</p>
                    <p>• Storage directory: <code className="text-slate-800">/uploads</code></p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
