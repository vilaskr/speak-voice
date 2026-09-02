import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Send, 
  Copy, 
  Check, 
  AlertCircle, 
  Lock, 
  ArrowRight,
  RefreshCw,
  Search
} from 'lucide-react';
import type { ComplaintCategory, SubmissionPayload } from '../types';
import { submitComplaint } from '../lib/db';

const CATEGORIES: ComplaintCategory[] = [
  'Academic',
  'Faculty / Staff',
  'Infrastructure',
  'Hostel',
  'Transport',
  'Harassment',
  'Safety',
  'Administration',
  'Technical',
  'Other'
];

interface SubmitComplaintFormProps {
  onCheckStatusRequest?: (reportId: string) => void;
}

export const SubmitComplaintForm: React.FC<SubmitComplaintFormProps> = ({ onCheckStatusRequest }) => {
  const [category, setCategory] = useState<ComplaintCategory>('Academic');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const [quickTrackId, setQuickTrackId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [submittedReportId, setSubmittedReportId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // Validation
    const cleanTitle = title.trim();
    const cleanDesc = description.trim();

    if (!cleanTitle) {
      setValidationError('Please enter a complaint title.');
      return;
    }
    if (cleanTitle.length < 5) {
      setValidationError('Title must be at least 5 characters long.');
      return;
    }
    if (cleanTitle.length > 150) {
      setValidationError('Title cannot exceed 150 characters.');
      return;
    }

    if (!cleanDesc) {
      setValidationError('Please provide a detailed description.');
      return;
    }
    if (cleanDesc.length < 15) {
      setValidationError('Description must be at least 15 characters long.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: SubmissionPayload = {
        category,
        title: cleanTitle,
        description: cleanDesc,
      };

      const result = await submitComplaint(payload);

      if (result.success && result.report_id) {
        setSubmittedReportId(result.report_id);
        setTitle('');
        setDescription('');
      } else {
        setValidationError(result.error || 'Failed to submit complaint. Please try again.');
      }
    } catch {
      setValidationError('An unexpected error occurred while submitting. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickTrackId.trim() && onCheckStatusRequest) {
      onCheckStatusRequest(quickTrackId.trim());
    }
  };

  const handleCopyReportId = () => {
    if (!submittedReportId) return;
    navigator.clipboard.writeText(submittedReportId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const resetForm = () => {
    setSubmittedReportId(null);
    setValidationError(null);
    setTitle('');
    setDescription('');
    setCategory('Academic');
  };

  // Render Confirmation Screen after successful submission
  if (submittedReportId) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 sm:px-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6 text-center animate-in fade-in duration-300">
          
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-inner">
            <ShieldCheck className="w-9 h-9" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Report Submitted Successfully
            </h2>
            <p className="text-slate-600 text-sm max-w-md mx-auto leading-relaxed">
              Your report has been received anonymously. No identity, IP address, or account data was logged.
            </p>
          </div>

          {/* Report ID Card */}
          <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 max-w-lg mx-auto space-y-3">
            <span className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
              Your Unique Anonymous Report ID
            </span>
            <div className="flex items-center justify-center space-x-3">
              <span className="font-mono text-2xl sm:text-3xl font-extrabold tracking-widest text-indigo-700 select-all">
                {submittedReportId}
              </span>
            </div>

            <div className="pt-2">
              <button
                id="copy-report-id-btn"
                onClick={handleCopyReportId}
                className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 transition-colors cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Report ID Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-indigo-600" />
                    <span>Copy Report ID</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Critical Security Warning */}
          <div className="p-4 rounded-xl bg-amber-50/90 border border-amber-200 text-amber-900 text-left text-xs sm:text-sm leading-relaxed flex items-start space-x-3 max-w-lg mx-auto">
            <Lock className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-950">Save this Report ID now.</p>
              <p className="mt-0.5 text-amber-900">
                You will need it to check resolution progress. Because this system is 100% anonymous, lost Report IDs cannot be recovered.
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            {onCheckStatusRequest && (
              <button
                onClick={() => onCheckStatusRequest(submittedReportId)}
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-sm cursor-pointer"
              >
                <span>Track Status Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={resetForm}
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Submit Another Report</span>
            </button>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-3 sm:p-6 lg:p-8 flex-grow flex flex-col lg:flex-row gap-6 lg:gap-8">
      
      {/* Left Column: Branding & Professional Polish Info */}
      <div className="w-full lg:w-1/3 flex flex-col justify-center pr-0 lg:pr-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold mb-3 sm:mb-6 w-fit">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          100% Anonymous & Secure
        </div>

        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 leading-tight mb-2 sm:mb-4">
          Speak Your Truth <br />
          <span className="text-indigo-600">Without Compromise.</span>
        </h1>

        <p className="text-slate-600 text-sm sm:text-lg leading-relaxed mb-4 sm:mb-8">
          Our platform ensures your identity remains completely hidden. We do not collect names, emails, or IP addresses. Your safety is our priority.
        </p>

        <div className="hidden sm:space-y-4 sm:block mb-4 lg:mb-0">
          <div className="flex items-start gap-3">
            <div className="mt-1 bg-slate-200 p-1.5 rounded flex items-center justify-center shrink-0">
              <Check className="w-4 h-4 text-slate-700 stroke-[2.5]" />
            </div>
            <div>
              <p className="font-semibold text-slate-800 text-sm">Zero-Knowledge Tracking</p>
              <p className="text-xs text-slate-500">Use your unique Report ID to follow progress.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="mt-1 bg-slate-200 p-1.5 rounded flex items-center justify-center shrink-0">
              <Check className="w-4 h-4 text-slate-700 stroke-[2.5]" />
            </div>
            <div>
              <p className="font-semibold text-slate-800 text-sm">Encrypted Submissions</p>
              <p className="text-xs text-slate-500">All data is stored using industry-standard RLS protocols.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Submission Form & Quick Status Card */}
      <div className="w-full lg:w-2/3 flex flex-col gap-5 sm:gap-6">
        
        {/* Submission Card */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 sm:p-8">
          <div className="flex justify-between items-center mb-5 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-slate-800">New Anonymous Report</h2>
            <span className="text-[11px] sm:text-xs text-slate-400 font-mono bg-slate-50 px-2 py-1 rounded border border-slate-100">REF: NEW_ENTRY</span>
          </div>

          {/* Validation Error Banner */}
          {validationError && (
            <div className="flex items-start gap-3 p-3.5 sm:p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm mb-5 sm:mb-6 animate-in fade-in">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-semibold block">Submission Error</span>
                <p>{validationError}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              
              {/* Category */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="complaint-category" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Category
                </label>
                <select
                  id="complaint-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ComplaintCategory)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3 text-base sm:text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 cursor-pointer min-h-[44px]"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Complaint Title */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="complaint-title" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Complaint Title
                </label>
                <input
                  id="complaint-title"
                  type="text"
                  required
                  maxLength={150}
                  placeholder="Summarize your concern"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3 text-base sm:text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 min-h-[44px]"
                />
              </div>

            </div>

            {/* Detailed Description */}
            <div className="flex flex-col gap-1.5 mb-5 sm:mb-6">
              <div className="flex justify-between items-center">
                <label htmlFor="complaint-description" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Detailed Description
                </label>
                <span className="text-xs text-slate-400 font-mono">
                  {description.length}/5000
                </span>
              </div>
              <textarea
                id="complaint-description"
                required
                rows={4}
                maxLength={5000}
                placeholder="Provide as much detail as possible. Your anonymity is guaranteed..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3 text-base sm:text-sm min-h-[120px] focus:ring-2 focus:ring-indigo-500 outline-none resize-none text-slate-900 leading-relaxed"
              />
            </div>

            {/* Submit Button */}
            <button
              id="submit-complaint-btn"
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 disabled:from-indigo-400 disabled:to-indigo-400 text-white font-extrabold py-3.5 min-h-[50px] rounded-xl shadow-md shadow-indigo-200/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer text-base sm:text-sm tracking-wide"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Submitting Anonymously...</span>
                </>
              ) : (
                <>
                  <span>Submit Anonymously</span>
                  <Send className="w-4 h-4 ml-1" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Status Track Card (Quick Track Banner) */}
        <div className="bg-indigo-50/80 border border-indigo-100 rounded-2xl p-4 sm:p-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-4 sm:gap-6 justify-between shadow-xs">
          <div className="flex-grow">
            <h3 className="text-indigo-950 font-bold text-sm sm:text-base mb-0.5 sm:mb-1 flex items-center gap-2">
              <Search className="w-4 h-4 text-indigo-600 sm:hidden" />
              Already submitted a report?
            </h3>
            <p className="text-indigo-700 text-xs">
              Enter your Report ID to check the real-time status.
            </p>
          </div>
          <form onSubmit={handleQuickTrackSubmit} className="flex gap-2 w-full sm:w-auto">
            <input
              type="text"
              placeholder="SPK-9F82-X7L4"
              value={quickTrackId}
              onChange={(e) => setQuickTrackId(e.target.value.toUpperCase())}
              className="w-full sm:w-48 bg-white border border-indigo-200 rounded-xl px-3.5 py-2.5 text-base sm:text-sm font-mono font-bold focus:ring-2 focus:ring-indigo-500 outline-none uppercase text-slate-900 min-h-[44px]"
            />
            <button
              type="submit"
              className="bg-slate-900 hover:bg-black active:scale-[0.97] text-white text-sm font-extrabold px-5 py-2.5 rounded-xl transition-all shrink-0 cursor-pointer flex items-center justify-center gap-1.5 min-h-[44px] min-w-[84px] shadow-xs"
            >
              <Search className="w-4 h-4" />
              <span>Track</span>
            </button>
          </form>
        </div>

      </div>

    </div>
  );
};

