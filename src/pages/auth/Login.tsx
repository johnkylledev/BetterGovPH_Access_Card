import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { motion } from 'framer-motion';
import { Shield, Chrome } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const login = useStore((state) => state.login);
  const loginWithGoogle = useStore((state) => state.loginWithGoogle);
  const { currentUser, authInitialized } = useStore();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (authInitialized && currentUser) {
      if (currentUser.isAdmin) {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    }
  }, [currentUser, authInitialized, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const res = await login(email, password);
    if (res.success) {
      const user = useStore.getState().currentUser;

      // Enforce Google login if registered with Google
      if (user?.authProvider === 'google') {
        useStore.getState().logout();
        setError('This account was registered with Google. Please use the Google sign-in button.');
        return;
      }

      if (user?.isAdmin) {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } else {
      setError(res.message);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await loginWithGoogle({});
      if (res.success) {
        const user = useStore.getState().currentUser;
        if (res.needsProfile) {
          navigate('/register');
        } else if (user?.isAdmin) {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
      } else {
        setError(res.message);
      }
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-6 sm:py-12 px-4 sm:px-6 lg:px-8 font-sans selection:bg-blue-900/20">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center"
      >
        <div className="w-14 h-14 sm:w-16 sm:h-16 bg-blue-900 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-900/20 mb-4 sm:mb-6 p-3">
          <img src="/logo.svg" alt="BetterGovPH Logo" className="w-full h-full object-contain brightness-0 invert" />
        </div>
        <h2 className="mt-2 text-center text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 font-display">
          BetterGovPH
        </h2>
        <p className="mt-2 text-center text-sm text-slate-500">
          Sign in to access your portal
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mt-8 sm:mx-auto sm:w-full sm:max-w-md"
      >
        <div className="bg-white py-8 px-4 shadow-sm rounded-2xl sm:px-10 border border-slate-100">
          <form className="space-y-5 sm:space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm font-medium border border-red-100">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Email address
              </label>
              <div className="mt-1">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full appearance-none rounded-xl border border-slate-200 px-4 py-3 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 text-base sm:text-sm transition-all"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Password
              </label>
              <div className="mt-1">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full appearance-none rounded-xl border border-slate-200 px-4 py-3 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 text-base sm:text-sm transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="flex w-full justify-center rounded-xl bg-blue-900 px-4 py-3.5 text-sm font-semibold text-white shadow-md hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-900/20 transition-all active:scale-[0.98]"
              >
                Sign in
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-slate-500">Or continue with</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="mt-4 flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 px-4 py-3.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-blue-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
            >
              <Chrome className="w-5 h-5" />
              {loading ? 'Signing in...' : 'Sign in with Google'}
            </button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-600">
              Not a member yet?{' '}
              <Link to="/register" className="font-semibold text-blue-900 hover:text-blue-700">
                Apply for access
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>

  );
}
