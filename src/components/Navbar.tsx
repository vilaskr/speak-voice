import React from 'react';
import { ShieldCheck, FilePlus2, Search, Database, ChevronRight } from 'lucide-react';
import { isSupabaseConfigured } from '../lib/supabase';

interface NavbarProps {
  activeTab: 'submit' | 'status' | 'admin';
  setActiveTab: (tab: 'submit' | 'status' | 'admin') => void;
  onOpenSetupModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  activeTab, 
  setActiveTab, 
  onOpenSetupModal 
}) => {
  // Do not render standard public header when inside admin panel for clean focused admin UI
  if (activeTab === 'admin') return null;

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200/50 px-4 sm:px-8 flex items-center justify-between flex-shrink-0 min-h-[4.5rem] transition-all">
      <div className="max-w-7xl w-full mx-auto flex items-center justify-between">
        
        {/* Logo & Brand Identity */}
        <div 
          onClick={() => setActiveTab('submit')}
          className="flex items-center gap-3 cursor-pointer group py-2 active:scale-[0.98] transition-transform"
        >
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-xl flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-all shrink-0">
            <ShieldCheck className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-xl tracking-tight text-slate-900 leading-none">
              SpeakSafe
            </span>
            <span className="text-[11px] font-medium text-slate-500 mt-1">
              Secure & Anonymous
            </span>
          </div>
        </div>

        {/* Public Navigation Tabs */}
        <nav className="hidden sm:flex items-center gap-1 text-sm font-medium text-slate-500 bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/50">
          <button
            id="nav-submit-btn"
            onClick={() => setActiveTab('submit')}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl transition-all cursor-pointer min-h-[40px] active:scale-[0.97] ${
              activeTab === 'submit'
                ? 'text-indigo-900 font-bold bg-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <FilePlus2 className={`w-4 h-4 shrink-0 ${activeTab === 'submit' ? 'text-indigo-600' : 'text-slate-400'}`} />
            <span className="whitespace-nowrap">Submit Report</span>
          </button>

          <button
            id="nav-status-btn"
            onClick={() => setActiveTab('status')}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl transition-all cursor-pointer min-h-[40px] active:scale-[0.97] ${
              activeTab === 'status'
                ? 'text-indigo-900 font-bold bg-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <Search className={`w-4 h-4 shrink-0 ${activeTab === 'status' ? 'text-indigo-600' : 'text-slate-400'}`} />
            <span className="whitespace-nowrap">Track Status</span>
          </button>
        </nav>

        {/* Mobile Navigation Tabs (visible on mobile only) */}
        <nav className="sm:hidden flex items-center gap-2 text-xs font-medium text-slate-500">
           <button
            onClick={() => setActiveTab('submit')}
            className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all cursor-pointer active:scale-[0.97] ${
              activeTab === 'submit'
                ? 'text-indigo-600 bg-indigo-50 font-bold shadow-xs'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
            }`}
            title="Submit Report"
          >
            <FilePlus2 className="w-5 h-5 shrink-0" />
          </button>

          <button
            onClick={() => setActiveTab('status')}
            className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all cursor-pointer active:scale-[0.97] ${
              activeTab === 'status'
                ? 'text-indigo-600 bg-indigo-50 font-bold shadow-xs'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
            }`}
            title="Track Status"
          >
            <Search className="w-5 h-5 shrink-0" />
          </button>
        </nav>

        {/* Connection Status & Database Setup Indicator */}
        <div className="hidden lg:flex items-center">
          <button
            onClick={onOpenSetupModal}
            title="Click for Supabase Database Setup & SQL instructions"
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer min-h-[40px] border shadow-xs ${
              isSupabaseConfigured
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                : 'bg-amber-50 text-amber-800 border-amber-200/80 hover:bg-amber-100'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>{isSupabaseConfigured ? 'Supabase Connected' : 'Demo DB Mode'}</span>
            <ChevronRight className="w-3.5 h-3.5 opacity-60" />
          </button>
        </div>

      </div>
    </header>
  );
};

