import React, { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { ShieldCheck, XCircle, ExternalLink, Copy, Download, Code, Check, Search, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas';
import { getUserByMemberIdOrId } from '../../services/firebase';
import { AccessCard } from '../../components/AccessCard';

export default function Verify() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const users = useStore((state) => state.users);
  const [userData, setUserData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'embed-copied'>('idle');
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [searchId, setSearchId] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<any>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchUser = async () => {
      if (!id) {
        setUserData(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      const localUser = users.find((u) => u.memberId === id || u.id === id);
      if (localUser) {
        setUserData(localUser);
        setLoading(false);
        return;
      }

      try {
        const remoteUser = await getUserByMemberIdOrId(id);
        setUserData(remoteUser);
      } catch (error) {
        console.error('Error loading verify user:', error);
        setUserData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [id, users]);

  useEffect(() => {
    const performSearch = async () => {
      if (!searchId || searchId.length < 5) {
        setSearchResult(null);
        return;
      }

      setIsSearching(true);
      try {
        const result = await getUserByMemberIdOrId(searchId);
        setSearchResult(result);
      } catch (err) {
        setSearchResult(null);
      } finally {
        setIsSearching(false);
      }
    };

    const timeout = setTimeout(performSearch, 500);
    return () => clearTimeout(timeout);
  }, [searchId]);

  const publicUrl = typeof window !== 'undefined' && userData?.memberId
    ? `${window.location.origin}/verify/${userData.memberId}`
    : '';

  const isValid = userData && (userData.status === 'Approved' || userData.isAdmin);
  const isPending = userData && userData.status === 'Pending' && !userData.isAdmin;
  const isDeclined = userData && userData.status === 'Declined' && !userData.isAdmin;

  const handleCopyLink = async () => {
    if (!publicUrl) return;
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopyStatus('copied');
      setTimeout(() => setCopyStatus('idle'), 2000);
    } catch (error) {
      console.error('Copy failed:', error);
    }
  };

  const handleCopyEmbed = async () => {
    if (!publicUrl) return;
    try {
      const embedCode = `<iframe src="${publicUrl}" width="380" height="600" frameborder="0"></iframe>`;
      await navigator.clipboard.writeText(embedCode);
      setCopyStatus('embed-copied');
      setTimeout(() => setCopyStatus('idle'), 2000);
    } catch (error) {
      console.error('Copy failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 font-sans selection:bg-blue-900/20">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white rounded-[2rem] p-8 shadow-xl border border-slate-100 flex flex-col items-center text-center relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 to-blue-900" />

        {loading ? (
          <div className="py-16">
            <Loader2 className="w-8 h-8 text-blue-900 animate-spin mx-auto mb-4" />
            <p className="text-sm text-slate-500">Verifying access credentials...</p>
          </div>
        ) : id && (isValid || isPending || isDeclined) ? (
          <>

            <h1 className="text-3xl font-display font-bold text-slate-900 mb-2">
              Official Verification
            </h1>
            <p className="text-slate-600 text-lg font-medium mb-8 px-4 leading-relaxed">
              {isValid
                ? (
                  <span>
                    <span className="text-blue-900 font-mono font-bold px-2 py-1 bg-blue-50 rounded-lg">{userData.fullName}</span> is a verified member of BetterGovPH.
                  </span>
                )
                : isPending
                  ? 'This card is currently undergoing official review and is not yet active.'
                  : 'This digital access card has been revoked or declined and is no longer valid.'}
            </p>

            <div className={clsx(
              "transition-all duration-700",
              !isValid && "opacity-50 grayscale blur-[1px] pointer-events-none"
            )}>
              <AccessCard user={userData} />
            </div>

            {isValid && (
              <div className="w-full max-w-[340px] mt-8 space-y-4">
              </div>
            )}

            {!isValid && (
              <div className="mt-8 w-full">
                <button
                  onClick={() => {
                    setUserData(null);
                    navigate('/verify');
                  }}
                  className="w-full py-3 bg-slate-100 text-slate-600 rounded-2xl text-sm font-bold hover:bg-slate-200 transition-all"
                >
                  Verify Another ID
                </button>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6">
              <Search className="w-10 h-10 text-blue-500" />
            </div>
            <h1 className="text-2xl font-display font-bold text-slate-900 mb-2">
              {id ? 'Invalid Card' : 'Verify Credentials'}
            </h1>
            <p className="text-slate-500 text-sm mb-8">
              {id
                ? 'This digital access card could not be verified. It may be pending, revoked, or fake.'
                : 'Enter a Member ID below to verify its status in our official database.'}
            </p>

            <div className="w-full space-y-4">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Enter Member ID (e.g. BGPH-2026-001)"
                  value={searchId}
                  onChange={(e) => setSearchId(e.target.value)}
                  className="w-full pl-12 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all uppercase placeholder:normal-case"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  {isSearching && <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />}
                </div>
              </div>

              {searchResult && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-5 bg-green-50 border border-green-100 rounded-2xl flex items-center justify-between group"
                >
                  <div className="text-left">
                    <p className="text-[10px] font-bold text-green-600 uppercase tracking-widest mb-1">Official Member Found</p>
                    <p className="text-sm font-bold text-slate-900">{searchResult.fullName}</p>
                    <p className="text-xs text-slate-500">{searchResult.memberId}</p>
                  </div>
                  <button
                    onClick={() => navigate(`/verify/${searchResult.memberId}`)}
                    className="p-3 bg-blue-900 text-white rounded-xl shadow-sm border border-blue-200 group-hover:bg-blue-800 transition-all"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </motion.div>
              )}

              {searchId.length >= 5 && !isSearching && !searchResult && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-xs font-medium">
                  No official record found for this Member ID.
                </div>
              )}
            </div>
          </>
        )}

        <div className="mt-8 pt-6 border-t border-slate-100 w-full">
          <Link to="/" className="inline-flex items-center space-x-2 text-sm font-bold text-blue-900 hover:text-blue-700 transition-colors">
            <span>Return to BetterGovPH Portal</span>
            <ExternalLink className="w-4 h-4" />
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
