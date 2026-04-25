import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { AccessCard } from '../../components/AccessCard';
import { motion } from 'framer-motion';
import { ShieldAlert, CheckCircle2, Clock, LogOut, Download, Copy, Code, Check, CreditCard } from 'lucide-react';
import html2canvas from 'html2canvas';
import clsx from 'clsx';

export default function UserDashboard() {
  const { currentUser, logout } = useStore();
  const navigate = useNavigate();
  const [downloadLoading, setDownloadLoading] = React.useState(false);
  const [copyStatus, setCopyStatus] = React.useState<'idle' | 'copied' | 'embed-copied'>('idle');

  useEffect(() => {
    if (!currentUser) {
      navigate('/');
    } else if (currentUser.isAdmin) {
      navigate('/admin');
    }
  }, [currentUser, navigate]);

  if (!currentUser) return null;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getStatusIcon = () => {
    switch (currentUser.status) {
      case 'Approved': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'Declined': return <ShieldAlert className="w-5 h-5 text-red-500" />;
      default: return <Clock className="w-5 h-5 text-yellow-500" />;
    }
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/verify/${currentUser.memberId || currentUser.id}`;
    navigator.clipboard.writeText(url);
    setCopyStatus('copied');
    setTimeout(() => setCopyStatus('idle'), 2000);
  };

  const handleCopyEmbed = () => {
    const url = `${window.location.origin}/verify/${currentUser.memberId || currentUser.id}`;
    const embedCode = `<iframe src="${url}" width="380" height="600" frameborder="0"></iframe>`;
    navigator.clipboard.writeText(embedCode);
    setCopyStatus('embed-copied');
    setTimeout(() => setCopyStatus('idle'), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-3">
              <img src="/logo.svg" alt="BetterGovPH Logo" className="w-8 h-8 object-contain brightness-0" />
              <span className="text-xl font-display font-bold text-slate-900">BetterGovPH</span>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              {currentUser.status === 'Approved' && (
                <button
                  onClick={() => {
                    const el = document.getElementById('digital-card-section');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="inline-flex items-center gap-2 px-3 py-2 text-sm font-bold text-blue-900 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors"
                >
                  <CreditCard className="w-4 h-4" />
                  <span className="hidden sm:inline">My Card</span>
                </button>
              )}
              <div className="h-6 w-[1px] bg-slate-200 hidden sm:block" />
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-sm font-bold text-slate-900 leading-none">{currentUser.fullName}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">{currentUser.role}</span>
              </div>
              <button
                onClick={handleLogout}
                className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Left Column: Status and Info */}
          <div className="lg:col-span-7 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100"
            >
              <h2 className="text-lg font-bold text-slate-900 mb-6">Application Status</h2>
              <div className={clsx(
                "flex items-center space-x-4 p-4 rounded-2xl border",
                currentUser.status === 'Approved' ? 'bg-green-50 border-green-100' :
                  currentUser.status === 'Declined' ? 'bg-red-50 border-red-100' :
                    'bg-yellow-50 border-yellow-100'
              )}>
                {getStatusIcon()}
                <div>
                  <p className="text-sm font-bold text-slate-900">{currentUser.status}</p>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {currentUser.status === 'Approved' ? 'Your application has been approved. Your ID is ready.' :
                      currentUser.status === 'Declined' ? 'Your application was declined by the administrator.' :
                        'Your application is currently under review by our team.'}
                  </p>
                </div>
              </div>

              {currentUser.adminNotes && (
                <div className="mt-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Admin Notes</p>
                  <p className="text-sm text-slate-700">{currentUser.adminNotes}</p>
                </div>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100"
            >
              <h2 className="text-lg font-bold text-slate-900 mb-6">Profile Information</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Full Name</p>
                  <p className="text-sm font-medium text-slate-900">{currentUser.fullName}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Email</p>
                  <p className="text-sm font-medium text-slate-900">{currentUser.email}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Discord</p>
                  <p className="text-sm font-medium text-slate-900">{currentUser.discordUsername}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Specialization</p>
                  <p className="text-sm font-medium text-slate-900">{currentUser.specialization}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Role</p>
                  <p className="text-sm font-medium text-slate-900">{currentUser.role}</p>
                </div>
                {currentUser.memberId && (
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Member ID</p>
                    <p className="text-sm font-mono font-medium text-blue-600">{currentUser.memberId}</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Right Column: Digital ID */}
          <div id="digital-card-section" className="lg:col-span-5">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="sticky top-24 flex flex-col items-center"
            >
              <div className="w-full flex justify-between items-center mb-6 px-2">
                <h2 className="text-lg font-bold text-slate-900">Digital Access Card</h2>
                {currentUser.status === 'Approved' && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded-full uppercase tracking-wide">
                    Ready to use
                  </span>
                )}
              </div>

              <div className={clsx(
                "relative group transition-all duration-500",
                currentUser.status !== 'Approved' && "opacity-50 grayscale pointer-events-none blur-[2px]"
              )}>
                <AccessCard user={currentUser} />

                {currentUser.status !== 'Approved' && (
                  <div className="absolute inset-0 z-50 flex items-center justify-center">
                    <div className="bg-white/90 backdrop-blur-sm px-6 py-3 rounded-2xl shadow-xl border border-slate-200">
                      <p className="text-sm font-bold text-slate-800">Card Unavailable</p>
                      <p className="text-xs text-slate-500 text-center mt-1">Pending Approval</p>
                    </div>
                  </div>
                )}
              </div>

              {currentUser.status === 'Approved' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="w-full mt-8 grid grid-cols-1 gap-3"
                >

                  <div className="flex flex-col gap-3">
                    <button
                      onClick={handleCopyLink}
                      className="flex items-center justify-center gap-2 w-full py-4 bg-blue-900 text-white rounded-2xl font-bold text-sm hover:bg-blue-800 transition-all shadow-lg shadow-blue-900/20"
                    >
                      {copyStatus === 'copied' ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Link Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>Copy Public Link</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleCopyEmbed}
                      className="flex items-center justify-center gap-2 w-full py-4 bg-white border border-slate-200 text-slate-700 rounded-2xl font-bold text-sm hover:bg-slate-50 transition-all shadow-sm"
                    >
                      {copyStatus === 'embed-copied' ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Code Copied</span>
                        </>
                      ) : (
                        <>
                          <Code className="w-4 h-4" />
                          <span>Copy Embed Code</span>
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </div>

        </div>
      </main>
    </div>
  );
}
