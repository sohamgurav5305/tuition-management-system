import React from 'react';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const AccessDenied: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
      <div className="p-4 bg-rose-100 rounded-3xl text-rose-600 mb-6 shadow-lg shadow-rose-500/10">
        <ShieldAlert className="w-16 h-16" />
      </div>

      <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight mb-2">
        Access Denied
      </h1>

      <p className="text-sm text-slate-500 max-w-md mb-6">
        Your account role (<span className="font-bold text-slate-700">{user?.role}</span>) does not have permission to access this module or administrative function according to role access policies.
      </p>

      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Go Back
        </button>
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-md shadow-blue-500/20 transition-all"
        >
          <Home className="w-4 h-4" /> Go to Dashboard
        </button>
      </div>
    </div>
  );
};
