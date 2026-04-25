import React from 'react';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export const LoadingOverlay = () => {
  return (
    <div className="fixed inset-0 bg-slate-50 z-[9999] flex flex-col items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center"
      >
        <div className="w-16 h-16 bg-blue-900 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-900/20 mb-6 p-3">
          <img src="/logo.svg" alt="BetterGovPH Logo" className="w-full h-full object-contain brightness-0 invert" />
        </div>
        <Loader2 className="w-8 h-8 text-blue-900 animate-spin mb-4" />
        <p className="text-sm font-bold text-slate-900 tracking-tight uppercase">Initializing Portal</p>
        <p className="text-xs text-slate-400 mt-2">Connecting to BetterGovPH secure servers...</p>
      </motion.div>
    </div>
  );
};
