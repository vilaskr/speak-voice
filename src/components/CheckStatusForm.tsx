import React, { useState, useEffect } from 'react';
import { Search, ShieldAlert, Clock, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import type { PublicStatusResult, ComplaintStatus } from '../types';
import { getPublicReportStatus } from '../lib/db';
import { sanitizeReportId } from '../lib/security';

const STATUS_STEPS: { status: ComplaintStatus; label: string; description: string }[] = [
  { status: 'New', label: 'Submitted', description: 'Complaint received by system' },
  { status: 'Under Review', label: 'Under Review', description: 'Assigned to administration for review' },
  { status: 'In Progress', label: 'In Progress', description: 'Active investigation or resolution underway' },
  { status: 'Resolved', label: 'Resolved', description: 'Action completed and resolved' },
  { status: 'Closed', label: 'Closed', description: 'Case archived and finalized' },
];

function getStatusBadgeStyle(status: ComplaintStatus) {
  switch (status) {
    case 'New':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'Under Review':
      return 'bg-amber-50 text-amber-800 border-amber-200';
    case 'In Progress':
      return 'bg-purple-50 text-purple-700 border-purple-200';
    case 'Resolved':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'Closed':
      return 'bg-slate-100 text-slate-700 border-slate-200';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
}

interface CheckStatusFormProps {
  initialReportId?: string;
  onGoBackToSubmit?: () => void;
}

export const CheckStatusForm: React.FC<CheckStatusFormProps> = ({ initialReportId = '', onGoBackToSubmit }) => {
  const [reportIdInput, setReportIdInput] = useState(initialReportId);
  const [isLoading, setIsLoading] = useState(false);
  const [statusResult, setStatusResult] = useState<PublicStatusResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (initialReportId) {
      setReportIdInput(initialReportId);
      handleSearch(initialReportId);
    }
  }, [initialReportId]);

  const handleSearch = async (targetId?: string) => {
    const idToQuery = targetId !== undefined ? targetId : reportIdInput;
    const cleanId = sanitizeReportId(idToQuery);

    setErrorMessage(null);
    setStatusResult(null);

    if (!cleanId) {
      setErrorMessage('Please enter a valid Report ID.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await getPublicReportStatus(cleanId);
      if (res.success && res.data) {
        setStatusResult(res.data);
      } else {
        setErrorMessage(res.error || 'No complaint was found with this Report ID.');
      }
    } catch {
      setErrorMessage('An error occurred while checking complaint status.');
    } finally {
      setIsLoading(false);
    }
  };

  const currentStepIndex = statusResult 
    ? STATUS_STEPS.findIndex(s => s.status === statusResult.status)
    : -1;

  return (
    <div className="max-w-3xl mx-auto py-6 sm:py-10 px-3 sm:px-6 flex-grow">
      
      {/* Header */}
      <div className="text-center space-y-3 mb-8 sm:mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-[11px] font-bold uppercase tracking-wide shadow-xs">
          <Clock className="w-3.5 h-3.5 text-indigo-600" />
          <span>Zero-Knowledge Status Tracker</span>
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">
          Track Complaint Status
        </h1>
        <p className="text-slate-600 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
          Enter your unique Report ID below to track real-time resolution progress without logging in or exposing your identity.
        </p>
      </div>

      {/* Search Input Box Card */}
      <div className="bg-white rounded-[2rem] border border-slate-200/80 shadow-sm p-6 sm:p-10 space-y-6">

        <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }} className="space-y-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="report-id-input" className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">
              Your Report ID
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                id="report-id-input"
                type="text"
                placeholder="SPK-9F82-X7L4"
                value={reportIdInput}
                onChange={(e) => setReportIdInput(e.target.value.toUpperCase())}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 font-mono text-base font-bold tracking-wider uppercase focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 outline-none text-slate-900 min-h-[56px] shadow-xs"
              />
              <button
                id="check-status-btn"
                type="submit"
                disabled={isLoading}
                className="bg-slate-900 hover:bg-black active:scale-[0.98] disabled:bg-slate-400 text-white font-extrabold px-8 py-4 rounded-2xl transition-all shadow-md shadow-slate-200/80 shrink-0 cursor-pointer flex items-center justify-center gap-2 min-h-[56px] text-base"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Checking...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>Track Status</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Error State */}
        {errorMessage && (
          <div className="flex items-start space-x-3 p-3.5 sm:p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs sm:text-sm animate-in fade-in">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Lookup Result</span>
              <p>{errorMessage}</p>
              <p className="mt-1 text-xs text-rose-700">
                Please verify that you entered the exact Report ID given during submission.
              </p>
            </div>
          </div>
        )}

        {/* Success Status Result View */}
        {statusResult && (
          <div className="pt-4 border-t border-slate-200 space-y-6 animate-in fade-in duration-300">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-5 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">
                  Report ID
                </span>
                <span className="font-mono text-lg sm:text-xl font-extrabold text-slate-900 tracking-wider">
                  {statusResult.report_id}
                </span>
                <div className="mt-1 text-xs text-slate-500">
                  Category: <span className="font-semibold text-slate-800">{statusResult.category}</span>
                </div>
              </div>

              <div className="flex flex-col items-start sm:items-end">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  Current Status
                </span>
                <span className={`inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border ${getStatusBadgeStyle(statusResult.status)}`}>
                  {statusResult.status}
                </span>
              </div>
            </div>

            {/* Visual Status Timeline / Workflow Progress */}
            <div className="space-y-4 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Resolution Workflow Progress
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                {STATUS_STEPS.map((step, idx) => {
                  const isCurrent = step.status === statusResult.status;
                  const isPassed = currentStepIndex >= 0 && idx < currentStepIndex;

                  return (
                    <div 
                      key={step.status}
                      className={`p-3.5 sm:p-3 rounded-xl border transition-all ${
                        isCurrent 
                          ? 'bg-indigo-50 border-indigo-300 ring-2 ring-indigo-500/20'
                          : isPassed 
                            ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                            : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5 sm:space-x-2">
                        <div className={`w-6 h-6 sm:w-5 sm:h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                          isCurrent
                            ? 'bg-indigo-600 text-white'
                            : isPassed
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-200 text-slate-600'
                        }`}>
                          {isPassed ? <CheckCircle2 className="w-3.5 h-3.5" /> : idx + 1}
                        </div>
                        <span className={`text-xs font-bold ${isCurrent ? 'text-indigo-950' : 'text-slate-800'}`}>
                          {step.label}
                        </span>
                      </div>
                      <p className="mt-1.5 text-[11px] leading-relaxed sm:leading-tight text-slate-500 pl-8 sm:pl-0">
                        {step.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Timestamps */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-3 text-xs text-slate-500 border-t border-slate-100">
              <div>
                <span className="block font-medium text-slate-700">Date Submitted</span>
                <span>{new Date(statusResult.created_at).toLocaleString()}</span>
              </div>
              <div>
                <span className="block font-medium text-slate-700">Last Status Update</span>
                <span>{new Date(statusResult.updated_at).toLocaleString()}</span>
              </div>
            </div>

            {/* Privacy note */}
            <div className="p-3.5 rounded-xl bg-slate-100 text-slate-600 text-xs flex items-start sm:items-center space-x-2.5">
              <ShieldAlert className="w-4 h-4 text-slate-500 shrink-0 mt-0.5 sm:mt-0" />
              <span>
                Public tracking displays high-level status milestones only. Complaint body and administration investigation notes are restricted.
              </span>
            </div>

          </div>
        )}

      </div>

      {onGoBackToSubmit && (
        <div className="mt-6 text-center">
          <button
            onClick={onGoBackToSubmit}
            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-600 hover:text-indigo-600 transition-colors cursor-pointer min-h-[44px] px-3 py-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Need to file a new report? Submit a report anonymously</span>
          </button>
        </div>
      )}

    </div>
  );
};

