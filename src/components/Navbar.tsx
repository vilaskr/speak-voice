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
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between flex-shrink-0 h-16 shadow-xs">
      <div className="max-w-7xl w-full mx-auto flex items-center justify-between h-full">
        
        {/* Logo & Brand Identity */}
        <div 
          onClick={() => setActiveTab('submit')}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-xs group-hover:bg-indigo-700 transition-colors">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-xl tracking-tight text-slate-800">
              Speak<span className="text-indigo-600">Safe</span>
            </span>
            <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase bg-slate-100 text-slate-600 rounded-full border border-slate-200">
              Anonymous
            </span>
          </div>
        </div>

        {/* Public Navigation Tabs */}
        <nav className="flex gap-4 sm:gap-8 text-sm font-medium text-slate-500 h-full items-center">
          <button
            id="nav-submit-btn"
            onClick={() => setActiveTab('submit')}
            className={`flex items-center gap-2 h-full border-b-2 transition-colors cursor-pointer ${
              activeTab === 'submit'
                ? 'text-indigo-600 border-indigo-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FilePlus2 className="w-4 h-4" />
            <span>Submit Report</span>
          </button>

          <button
            id="nav-status-btn"
            onClick={() => setActiveTab('status')}
            className={`flex items-center gap-2 h-full border-b-2 transition-colors cursor-pointer ${
              activeTab === 'status'
                ? 'text-indigo-600 border-indigo-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>Track Status</span>
          </button>
        </nav>

        {/* Connection Status & Database Setup Indicator */}
        <div className="hidden md:flex items-center">
          <button
            onClick={onOpenSetupModal}
            title="Click for Supabase Database Setup & SQL instructions"
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
              isSupabaseConfigured
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                : 'bg-amber-50 text-amber-800 border-amber-200/80 hover:bg-amber-100'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>{isSupabaseConfigured ? 'Supabase Connected' : 'Demo DB Mode'}</span>
            <ChevronRight className="w-3 h-3 opacity-60" />
          </button>
        </div>

      </div>
    </header>
  );
};

