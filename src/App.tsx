import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { SubmitComplaintForm } from './components/SubmitComplaintForm';
import { CheckStatusForm } from './components/CheckStatusForm';
import { AdminPanel } from './components/AdminPanel';
import { Footer } from './components/Footer';
import { SetupGuideModal } from './components/SetupGuideModal';
import { ShieldAlert, Database, ArrowRight } from 'lucide-react';
import { isSupabaseConfigured } from './lib/supabase';

export default function App() {
  const [activeTab, setActiveTab] = useState<'submit' | 'status' | 'admin'>('submit');
  const [targetReportId, setTargetReportId] = useState<string>('');
  const [isSetupModalOpen, setIsSetupModalOpen] = useState<boolean>(false);

  // Synchronize route matching for /adminpanel or #adminpanel
  useEffect(() => {
    const handleLocationCheck = () => {
      const path = window.location.pathname;
      const hash = window.location.hash;
      if (path.includes('/adminpanel') || hash.includes('adminpanel')) {
        setActiveTab('admin');
      }
    };

    handleLocationCheck();
    window.addEventListener('hashchange', handleLocationCheck);
    window.addEventListener('popstate', handleLocationCheck);
    return () => {
      window.removeEventListener('hashchange', handleLocationCheck);
      window.removeEventListener('popstate', handleLocationCheck);
    };
  }, []);

  const handleNavigateToStatus = (reportId: string) => {
    setTargetReportId(reportId);
    setActiveTab('status');
  };

  const handleAdminRouteSelect = () => {
    window.location.hash = 'adminpanel';
    setActiveTab('admin');
  };

  const handleExitAdmin = () => {
    window.location.hash = '';
    setActiveTab('submit');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-900">
      
      {/* Top Navigation */}
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        onOpenSetupModal={() => setIsSetupModalOpen(true)} 
      />

      {/* Demo DB Mode Banner (Shown on public pages if Supabase env is unconfigured) */}
      {!isSupabaseConfigured && activeTab !== 'admin' && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 text-amber-900 py-2.5 px-4 text-xs font-medium text-center">
          <div className="max-w-6xl mx-auto flex items-center justify-center space-x-2">
            <Database className="w-3.5 h-3.5 text-amber-700 shrink-0" />
            <span>
              <strong>Demo Database Active:</strong> Fully interactive preview mode. To connect live Supabase PostgreSQL & RLS, click setup guide.
            </span>
            <button
              onClick={() => setIsSetupModalOpen(true)}
              className="underline font-bold text-amber-950 hover:text-indigo-700 ml-1 inline-flex items-center"
            >
              <span>View Supabase SQL Guide</span>
              <ArrowRight className="w-3 h-3 ml-0.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Container Views */}
      <main className="flex-1">
        {activeTab === 'submit' && (
          <SubmitComplaintForm onCheckStatusRequest={handleNavigateToStatus} />
        )}

        {activeTab === 'status' && (
          <CheckStatusForm 
            initialReportId={targetReportId} 
            onGoBackToSubmit={() => setActiveTab('submit')} 
          />
        )}

        {activeTab === 'admin' && (
          <AdminPanel 
            onExitAdmin={handleExitAdmin} 
            onOpenSetupModal={() => setIsSetupModalOpen(true)} 
          />
        )}
      </main>

      {/* Footer with Vilas K R credits & links */}
      <Footer 
        onAdminRouteClick={handleAdminRouteSelect} 
        onOpenSetupModal={() => setIsSetupModalOpen(true)} 
      />

      {/* Supabase SQL Setup Modal */}
      <SetupGuideModal 
        isOpen={isSetupModalOpen} 
        onClose={() => setIsSetupModalOpen(false)} 
      />

    </div>
  );
}
