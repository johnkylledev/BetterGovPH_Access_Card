import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { motion } from 'framer-motion';
import { Shield, Chrome } from 'lucide-react';
import { updateUserData } from '../../services/firebase';

const SPECIALIZATIONS = ['Developer', 'Designer', 'Researcher', 'Contributor', 'Volunteer', 'Other'];
const ROLES = ['Member', 'Fellow', 'Contributor', 'Other'];

type GoogleProfile = {
  uid: string;
  fullName: string;
  email: string;
  photoURL?: string;
};

export default function Register() {
  const [useGoogle, setUseGoogle] = useState(false);
  const [googleUser, setGoogleUser] = useState<GoogleProfile | null>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    discordUsername: '',
    specialization: 'Developer',
    customSpecialization: '',
    role: 'Member',
    customRole: '',
  });
  const [googleProfileData, setGoogleProfileData] = useState({
    fullName: '',
    discordUsername: '',
    specialization: 'Developer',
    customSpecialization: '',
    role: 'Member',
    customRole: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isGoogleFlow, setIsGoogleFlow] = useState(false);
  const register = useStore((state) => state.register);
  const loginWithGoogle = useStore((state) => state.loginWithGoogle);
  const currentUser = useStore((state) => state.currentUser);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleGoogleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setGoogleProfileData({ ...googleProfileData, [e.target.name]: e.target.value });
  };

  useEffect(() => {
    if (
      !googleUser &&
      currentUser &&
      currentUser.uid &&
      (!currentUser.discordUsername || !currentUser.specialization)
    ) {
      setUseGoogle(true);
      setIsGoogleFlow(true);
      setGoogleUser({
        uid: currentUser.uid,
        fullName: currentUser.fullName,
        email: currentUser.email,
        photoURL: currentUser.photoURL,
      });
      setGoogleProfileData((prev) => ({
        ...prev,
        fullName: currentUser.fullName || '',
        discordUsername: currentUser.discordUsername || '',
        specialization: currentUser.specialization || 'Developer',
        role: currentUser.role || 'Member',
      }));
    }
  }, [currentUser, googleUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const spec = formData.specialization === 'Other' ? formData.customSpecialization : formData.specialization;
    const rl = formData.role === 'Other' ? formData.customRole : formData.role;

    if (!spec || !rl) {
      setError('Please provide specialization and role details.');
      setLoading(false);
      return;
    }

    try {
      const res = await register({
        fullName: isGoogleFlow ? googleProfileData.fullName : formData.fullName,
        email: isGoogleFlow ? googleUser?.email || '' : formData.email,
        password: isGoogleFlow ? '' : formData.password,
        discordUsername: isGoogleFlow ? googleProfileData.discordUsername : formData.discordUsername,
        specialization: spec,
        role: rl,
        authProvider: isGoogleFlow ? 'google' : 'traditional',
      });

      if (res.success) {
        navigate('/dashboard');
      } else {
        setError(res.message);
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await loginWithGoogle({});
      if (res.success) {
        const user = res.user || useStore.getState().currentUser;
        if (user && res.needsProfile) {
          setGoogleUser({
            uid: user.uid || user.id,
            fullName: user.fullName,
            email: user.email,
            photoURL: user.photoURL,
          });
          setGoogleProfileData((prev) => ({
            ...prev,
            fullName: user.fullName || '',
            discordUsername: user.discordUsername || '',
            specialization: user.specialization || 'Developer',
            role: user.role || 'Member',
          }));
        } else {
          navigate('/dashboard');
        }
      } else {
        setError(res.message);
      }
    } catch (err: any) {
      setError(err.message || 'Google sign-up failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteGoogleProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!googleUser) {
      setError('Unable to complete profile. Please try again.');
      return;
    }

    const specialization = googleProfileData.specialization === 'Other'
      ? googleProfileData.customSpecialization
      : googleProfileData.specialization;
    const role = googleProfileData.role === 'Other'
      ? googleProfileData.customRole
      : googleProfileData.role;

    if (!googleProfileData.fullName || !googleProfileData.discordUsername || !specialization || !role) {
      setError('Please fill in all required fields.');
      return;
    }

    try {
      setLoading(true);
      await updateUserData(googleUser.uid, {
        fullName: googleProfileData.fullName,
        discordUsername: googleProfileData.discordUsername,
        specialization,
        role,
        status: 'Pending',
      });

      const updatedCurrentUser = {
        ...useStore.getState().currentUser,
        fullName: googleProfileData.fullName,
        discordUsername: googleProfileData.discordUsername,
        specialization,
        role,
      };
      useStore.getState().setCurrentUser(updatedCurrentUser as any);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Unable to save profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans selection:bg-blue-900/20">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sm:mx-auto sm:w-full sm:max-w-xl flex flex-col items-center"
      >
        <div className="w-12 h-12 bg-blue-900 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-900/20 mb-4 p-2">
          <img src="/logo.svg" alt="BetterGovPH Logo" className="w-full h-full object-contain brightness-0 invert" />
        </div>
        <h2 className="mt-2 text-center text-3xl font-bold tracking-tight text-slate-900 font-display">
          Apply for Access
        </h2>
        <p className="mt-2 text-center text-sm text-slate-500">
          Join BetterGovPH community portal
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl"
      >
        <div className="bg-white py-8 px-4 shadow-sm sm:rounded-3xl sm:px-10 border border-slate-100">
          {!useGoogle ? (
            <>
              <form className="space-y-6" onSubmit={handleSubmit}>
                {error && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm font-medium border border-red-100">
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Full Name</label>
                    <input
                      name="fullName"
                      type="text"
                      required
                      value={formData.fullName}
                      onChange={handleChange}
                      className="block w-full appearance-none rounded-xl border border-slate-200 px-4 py-3 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 sm:text-sm transition-all"
                      placeholder="Juan Dela Cruz"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
                    <input
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="block w-full appearance-none rounded-xl border border-slate-200 px-4 py-3 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 sm:text-sm transition-all"
                      placeholder="juan@example.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
                    <input
                      name="password"
                      type="password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      className="block w-full appearance-none rounded-xl border border-slate-200 px-4 py-3 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 sm:text-sm transition-all"
                      placeholder="••••••••"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Discord Username</label>
                    <input
                      name="discordUsername"
                      type="text"
                      required
                      value={formData.discordUsername}
                      onChange={handleChange}
                      className="block w-full appearance-none rounded-xl border border-slate-200 px-4 py-3 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 sm:text-sm transition-all"
                      placeholder="juan_dev#1234"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Specialization</label>
                    <select
                      name="specialization"
                      value={formData.specialization}
                      onChange={handleChange}
                      className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 sm:text-sm transition-all bg-white"
                    >
                      {SPECIALIZATIONS.map((spec) => (
                        <option key={spec} value={spec}>{spec}</option>
                      ))}
                    </select>
                    {formData.specialization === 'Other' && (
                      <input
                        name="customSpecialization"
                        type="text"
                        required
                        value={formData.customSpecialization}
                        onChange={handleChange}
                        className="mt-3 block w-full appearance-none rounded-xl border border-slate-200 px-4 py-3 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 sm:text-sm transition-all"
                        placeholder="Specify specialization..."
                      />
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Role Request</label>
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 sm:text-sm transition-all bg-white"
                    >
                      {ROLES.map((role) => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                    </select>
                    {formData.role === 'Other' && (
                      <input
                        name="customRole"
                        type="text"
                        required
                        value={formData.customRole}
                        onChange={handleChange}
                        className="mt-3 block w-full appearance-none rounded-xl border border-slate-200 px-4 py-3 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 sm:text-sm transition-all"
                        placeholder="Specify role..."
                      />
                    )}
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="flex w-full justify-center rounded-xl bg-blue-900 px-4 py-3.5 text-sm font-semibold text-white shadow-md hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-900/20 transition-all"
                  >
                    Submit Application
                  </button>
                </div>
              </form>

              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-slate-500">Or register with</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setUseGoogle(true);
                    setIsGoogleFlow(false);
                  }}
                  className="mt-4 flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 px-4 py-3.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-blue-900/20 transition-all"
                >
                  <Chrome className="w-5 h-5" />
                  Sign up with Google
                </button>
              </div>

              <div className="mt-6 text-center">
                <p className="text-sm text-slate-600">
                  Already registered?{' '}
                  <Link to="/" className="font-semibold text-blue-900 hover:text-blue-700">
                    Log in here
                  </Link>
                </p>
              </div>
            </>
          ) : useGoogle && googleUser ? (
            <form className="space-y-6" onSubmit={handleCompleteGoogleProfile}>
              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm font-medium border border-red-100">
                  {error}
                </div>
              )}

              <div>
                <h3 className="text-lg font-bold text-slate-900">Complete your profile</h3>
                <p className="text-sm text-slate-500 mt-2">
                  We need a few more details to finish your BetterGovPH signup.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Full Name</label>
                  <input
                    name="fullName"
                    type="text"
                    required
                    value={googleProfileData.fullName}
                    onChange={handleGoogleProfileChange}
                    className="block w-full appearance-none rounded-xl border border-slate-200 px-4 py-3 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 sm:text-sm transition-all bg-white"
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
                  <input
                    value={googleUser.email}
                    disabled
                    className="block w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-slate-600 sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Discord Username</label>
                <input
                  name="discordUsername"
                  type="text"
                  required
                  value={googleProfileData.discordUsername}
                  onChange={handleGoogleProfileChange}
                  className="block w-full appearance-none rounded-xl border border-slate-200 px-4 py-3 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 sm:text-sm transition-all"
                  placeholder="juan_dev#1234"
                />
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Specialization</label>
                  <select
                    name="specialization"
                    value={googleProfileData.specialization}
                    onChange={handleGoogleProfileChange}
                    className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 sm:text-sm transition-all bg-white"
                  >
                    {SPECIALIZATIONS.map((spec) => (
                      <option key={spec} value={spec}>{spec}</option>
                    ))}
                  </select>
                  {googleProfileData.specialization === 'Other' && (
                    <input
                      name="customSpecialization"
                      type="text"
                      required
                      value={googleProfileData.customSpecialization}
                      onChange={handleGoogleProfileChange}
                      className="mt-3 block w-full appearance-none rounded-xl border border-slate-200 px-4 py-3 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 sm:text-sm transition-all"
                      placeholder="Specify specialization..."
                    />
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Role Request</label>
                  <select
                    name="role"
                    value={googleProfileData.role}
                    onChange={handleGoogleProfileChange}
                    className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 sm:text-sm transition-all bg-white"
                  >
                    {ROLES.map((role) => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                  {googleProfileData.role === 'Other' && (
                    <input
                      name="customRole"
                      type="text"
                      required
                      value={googleProfileData.customRole}
                      onChange={handleGoogleProfileChange}
                      className="mt-3 block w-full appearance-none rounded-xl border border-slate-200 px-4 py-3 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 sm:text-sm transition-all"
                      placeholder="Specify role..."
                    />
                  )}
                </div>
              </div>

              <div className="pt-2 space-y-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full justify-center rounded-xl bg-blue-900 px-4 py-3.5 text-sm font-semibold text-white shadow-md hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Saving...' : 'Complete Registration'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setUseGoogle(false);
                    setGoogleUser(null);
                    setError('');
                  }}
                  className="flex w-full justify-center rounded-xl border border-slate-200 px-4 py-3.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-blue-900/20 transition-all"
                >
                  Back to Traditional Registration
                </button>
              </div>

              <div className="mt-6 text-center">
                <p className="text-sm text-slate-600">
                  Already registered?{' '}
                  <Link to="/" className="font-semibold text-blue-900 hover:text-blue-700">
                    Log in here
                  </Link>
                </p>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm font-medium border border-red-100">
                  {error}
                </div>
              )}

              <div className="text-center">
                <p className="text-slate-600 mb-6">
                  Click the button below to sign up with your Google account.
                </p>
              </div>

              <button
                type="button"
                onClick={handleGoogleSignUp}
                disabled={loading}
                className="flex w-full items-center justify-center gap-3 rounded-xl bg-blue-900 px-4 py-3.5 text-sm font-semibold text-white shadow-md hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Chrome className="w-5 h-5" />
                {loading ? 'Signing up...' : 'Sign up with Google'}
              </button>

              <button
                type="button"
                onClick={() => setUseGoogle(false)}
                className="flex w-full justify-center rounded-xl border border-slate-200 px-4 py-3.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-blue-900/20 transition-all"
              >
                Use Traditional Registration
              </button>

              <div className="text-center">
                <p className="text-sm text-slate-600">
                  Already registered?{' '}
                  <Link to="/" className="font-semibold text-blue-900 hover:text-blue-700">
                    Log in here
                  </Link>
                </p>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
