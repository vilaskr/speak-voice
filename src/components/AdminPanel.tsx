import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  LogOut, 
  Search, 
  Filter, 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  FileText, 
  Send, 
  ArrowLeft,
  ChevronDown,
  Database,
  ExternalLink,
  Tag,
  Calendar,
  UserCheck
} from 'lucide-react';
import type { Complaint, ComplaintCategory, ComplaintStatus, AdminNote, AdminStats } from '../types';
import { 
  loginAdmin, 
  logoutAdmin, 
  checkAdminSession, 
  fetchAdminComplaints, 
  updateComplaintStatus, 
  fetchAdminNotes, 
  addAdminNote 
} from '../lib/db';
import { isSupabaseConfigured } from '../lib/supabase';

const STATUS_OPTIONS: ComplaintStatus[] = ['New', 'Under Review', 'In Progress', 'Resolved', 'Closed'];
const CATEGORY_OPTIONS: ComplaintCategory[] = [
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

interface AdminPanelProps {
  onExitAdmin?: () => void;
  onOpenSetupModal?: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onExitAdmin, onOpenSetupModal }) => {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminEmail, setAdminEmail] = useState<string | null>(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  // Data state
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');

  // Selected complaint detail drawer state
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [adminNotes, setAdminNotes] = useState<AdminNote[]>([]);
  const [newNoteText, setNewNoteText] = useState('');
  const [isSavingStatus, setIsSavingStatus] = useState(false);
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  // Initial session check
  useEffect(() => {
    async function verifyAuth() {
      setIsCheckingSession(true);
      const session = await checkAdminSession();
      if (session.isAuthenticated) {
        setIsAuthenticated(true);
        setAdminEmail(session.email || 'Admin');
      } else {
        setIsAuthenticated(false);
      }
      setIsCheckingSession(false);
    }
    verifyAuth();
  }, []);

  // Fetch complaints on authentication
  useEffect(() => {
    if (isAuthenticated) {
      loadComplaints();
    }
  }, [isAuthenticated]);

  const loadComplaints = async () => {
    setIsLoadingData(true);
    const res = await fetchAdminComplaints();
    if (res.success && res.complaints) {
      setComplaints(res.complaints);
    }
    setIsLoadingData(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsLoggingIn(true);

    try {
      const res = await loginAdmin(loginEmail, loginPassword);
      if (res.success) {
        setIsAuthenticated(true);
        setAdminEmail(loginEmail || 'Admin');
        setLoginPassword('');
      } else {
        setAuthError(res.error || 'Authentication failed.');
      }
    } catch {
      setAuthError('An error occurred during login.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleDemoAdminFill = () => {
    setLoginEmail('admin@speaksafe.org');
    setLoginPassword('admin123');
  };

  const handleLogout = async () => {
    await logoutAdmin();
    setIsAuthenticated(false);
    setAdminEmail(null);
    setSelectedComplaint(null);
  };

  // Open complaint modal
  const handleOpenDetails = async (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setDetailError(null);
    setNewNoteText('');
    
    // Fetch notes
    const notesRes = await fetchAdminNotes(complaint.id);
    if (notesRes.success && notesRes.notes) {
      setAdminNotes(notesRes.notes);
    } else {
      setAdminNotes([]);
    }
  };

  // Status Change Handler
  const handleStatusChange = async (newStatus: ComplaintStatus) => {
    if (!selectedComplaint) return;
    setIsSavingStatus(true);
    setDetailError(null);

    const res = await updateComplaintStatus(selectedComplaint.id, newStatus);
    if (res.success) {
      const updatedTime = new Date().toISOString();
      const updatedObj = { ...selectedComplaint, status: newStatus, updated_at: updatedTime };
      setSelectedComplaint(updatedObj);
      
      // Update local list state
      setComplaints(prev => prev.map(c => c.id === selectedComplaint.id ? updatedObj : c));
    } else {
      setDetailError(res.error || 'Failed to update status.');
    }
    setIsSavingStatus(false);
  };

  // Add Admin Note Handler
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint || !newNoteText.trim()) return;

    setIsSubmittingNote(true);
    setDetailError(null);

    const res = await addAdminNote(selectedComplaint.id, newNoteText);
    if (res.success && res.note) {
      setAdminNotes(prev => [...prev, res.note!]);
      setNewNoteText('');
    } else {
      setDetailError(res.error || 'Failed to add note.');
    }
    setIsSubmittingNote(false);
  };

  // Filtered complaints computation
  const filteredComplaints = useMemo(() => {
    return complaints.filter(item => {
      // Search by Report ID, Title, Category
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery = !q || 
        item.report_id.toLowerCase().includes(q) ||
        item.title.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q);

      // Status filter
      const matchesStatus = statusFilter === 'All' || item.status === statusFilter;

      // Category filter
      const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter;

      return matchesQuery && matchesStatus && matchesCategory;
    });
  }, [complaints, searchQuery, statusFilter, categoryFilter]);

  // Computed statistics
  const stats: AdminStats = useMemo(() => {
    return {
      total: complaints.length,
      new: complaints.filter(c => c.status === 'New').length,
      underReview: complaints.filter(c => c.status === 'Under Review').length,
      inProgress: complaints.filter(c => c.status === 'In Progress').length,
      resolved: complaints.filter(c => c.status === 'Resolved').length,
      closed: complaints.filter(c => c.status === 'Closed').length,
    };
  }, [complaints]);

  // Loading spinner during session check
  if (isCheckingSession) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-500 font-medium">Verifying administrator credentials...</p>
      </div>
    );
  }

  // Render Login View if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto py-12 px-4 sm:px-6">
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-md p-6 sm:p-8 space-y-6">
          
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white mx-auto flex items-center justify-center shadow-sm">
              <Lock className="w-6 h-6 text-indigo-400" />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Admin Authentication
            </h2>
            <p className="text-xs text-slate-500">
              Restricted portal. Supabase Row Level Security protected.
            </p>
          </div>

          {authError && (
            <div className="flex items-start space-x-2.5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="admin-email" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Administrator Email
              </label>
              <input
                id="admin-email"
                type="email"
                required
                placeholder="admin@speaksafe.org"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="admin-password" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Password
              </label>
              <input
                id="admin-password"
                type="password"
                required
                placeholder="••••••••••••"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <button
              id="admin-login-submit-btn"
              type="submit"
              disabled={isLoggingIn}
              className="w-full inline-flex items-center justify-center space-x-2 px-4 py-3 rounded-xl text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:bg-slate-500 transition-colors shadow-sm cursor-pointer"
            >
              {isLoggingIn ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <UserCheck className="w-4 h-4 text-indigo-400" />
                  <span>Sign In to Dashboard</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials Helper */}
          {!isSupabaseConfigured && (
            <div className="pt-4 border-t border-slate-100 text-center space-y-2">
              <p className="text-[11px] text-slate-500">
                Testing in preview mode without live Supabase?
              </p>
              <button
                type="button"
                onClick={handleDemoAdminFill}
                className="text-xs font-semibold text-indigo-600 hover:underline inline-flex items-center space-x-1"
              >
                <span>Fill Demo Credentials (admin@speaksafe.org)</span>
              </button>
            </div>
          )}

          {onExitAdmin && (
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={onExitAdmin}
                className="text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors inline-flex items-center space-x-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Public Complaint Portal</span>
              </button>
            </div>
          )}

        </div>
      </div>
    );
  }

  // Render Admin Dashboard
  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
      
      {/* Admin Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 text-white p-5 rounded-2xl shadow-md">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold tracking-tight">SpeakSafe Admin Console</h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                Authorized
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Signed in as: <span className="text-slate-200 font-mono">{adminEmail}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {onOpenSetupModal && (
            <button
              onClick={onOpenSetupModal}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            >
              <Database className="w-3.5 h-3.5 text-indigo-400" />
              <span>Supabase SQL Guide</span>
            </button>
          )}

          <button
            onClick={loadComplaints}
            title="Refresh Complaints"
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingData ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleLogout}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600/20 text-rose-300 border border-rose-500/30 hover:bg-rose-600/30 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Stats Overview Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs">
          <span className="text-xs font-medium text-slate-500 block">Total Complaints</span>
          <span className="text-2xl font-extrabold text-slate-900 mt-1 block">{stats.total}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-blue-200/90 shadow-xs bg-gradient-to-br from-blue-50/50 to-white">
          <span className="text-xs font-semibold text-blue-700 block">New</span>
          <span className="text-2xl font-extrabold text-blue-900 mt-1 block">{stats.new}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-amber-200/90 shadow-xs bg-gradient-to-br from-amber-50/50 to-white">
          <span className="text-xs font-semibold text-amber-800 block">Under Review</span>
          <span className="text-2xl font-extrabold text-amber-900 mt-1 block">{stats.underReview}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-purple-200/90 shadow-xs bg-gradient-to-br from-purple-50/50 to-white">
          <span className="text-xs font-semibold text-purple-700 block">In Progress</span>
          <span className="text-2xl font-extrabold text-purple-900 mt-1 block">{stats.inProgress}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-emerald-200/90 shadow-xs bg-gradient-to-br from-emerald-50/50 to-white">
          <span className="text-xs font-semibold text-emerald-700 block">Resolved</span>
          <span className="text-2xl font-extrabold text-emerald-900 mt-1 block">{stats.resolved}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs bg-slate-50/50">
          <span className="text-xs font-semibold text-slate-600 block">Closed</span>
          <span className="text-2xl font-extrabold text-slate-800 mt-1 block">{stats.closed}</span>
        </div>
      </div>

      {/* Toolbar: Search & Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Report ID, title, or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Status Filter */}
          <div className="flex items-center space-x-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs font-semibold text-slate-600">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-medium bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="All">All Statuses</option>
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Category Filter */}
          <div className="flex items-center space-x-1.5">
            <Tag className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs font-semibold text-slate-600">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-medium bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="All">All Categories</option>
              {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

        </div>

      </div>

      {/* Complaints Table & Responsive Cards */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        
        {isLoadingData ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-500">Loading complaints database...</p>
          </div>
        ) : filteredComplaints.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <FileText className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">No complaints found</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              No complaint records match your active search or filter criteria.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4">Report ID</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Title</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Created Date</th>
                  <th className="py-3.5 px-4">Updated Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-normal">
                {filteredComplaints.map((item) => (
                  <tr 
                    key={item.id} 
                    className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                    onClick={() => handleOpenDetails(item)}
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-700 whitespace-nowrap">
                      {item.report_id}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-semibold">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs font-medium text-slate-900 truncate">
                      {item.title}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                        item.status === 'New' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                        item.status === 'Under Review' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                        item.status === 'In Progress' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                        item.status === 'Resolved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 text-xs whitespace-nowrap">
                      {new Date(item.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 text-xs whitespace-nowrap">
                      {new Date(item.updated_at).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDetails(item);
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors"
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* Complaint Details & Admin Notes Drawer Modal */}
      {selectedComplaint && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="space-y-0.5">
                <span className="text-xs font-mono font-bold text-indigo-400">
                  REPORT ID: {selectedComplaint.report_id}
                </span>
                <h3 className="text-base font-bold truncate max-w-md">
                  {selectedComplaint.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedComplaint(null)}
                className="text-slate-400 hover:text-white text-sm px-2 py-1 rounded-lg bg-slate-800"
              >
                ✕ Close
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              
              {detailError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
                  {detailError}
                </div>
              )}

              {/* Status Selector & Meta Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="space-y-1">
                  <span className="text-xs font-bold uppercase text-slate-500 block">Category</span>
                  <span className="text-sm font-semibold text-slate-800">{selectedComplaint.category}</span>
                </div>

                <div className="space-y-1">
                  <label htmlFor="status-selector" className="text-xs font-bold uppercase text-slate-700 block">
                    Update Complaint Status
                  </label>
                  <select
                    id="status-selector"
                    value={selectedComplaint.status}
                    disabled={isSavingStatus}
                    onChange={(e) => handleStatusChange(e.target.value as ComplaintStatus)}
                    className="px-3 py-2 rounded-xl border border-slate-300 font-semibold text-xs sm:text-sm bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    {STATUS_OPTIONS.map(st => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Full Description */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Full Anonymous Complaint Description
                </h4>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                  {selectedComplaint.description}
                </div>
              </div>

              {/* Timestamps */}
              <div className="grid grid-cols-2 gap-4 text-xs text-slate-500 border-t border-slate-100 pt-3">
                <div>
                  <span className="font-semibold text-slate-700 block">Submitted At</span>
                  <span>{new Date(selectedComplaint.created_at).toLocaleString()}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-700 block">Last Updated At</span>
                  <span>{new Date(selectedComplaint.updated_at).toLocaleString()}</span>
                </div>
              </div>

              {/* Admin Internal Notes Section (Restricted, never shown to public) */}
              <div className="space-y-4 pt-4 border-t border-slate-200">
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center space-x-1.5">
                      <Lock className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Internal Admin Notes</span>
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Private investigation notes. Encrypted & never exposed to public users.
                    </p>
                  </div>
                </div>

                {/* Notes History */}
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {adminNotes.length === 0 ? (
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 text-center text-xs text-slate-500">
                      No internal notes recorded for this complaint yet.
                    </div>
                  ) : (
                    adminNotes.map(note => (
                      <div key={note.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span className="font-bold text-slate-700">
                            {note.admin_email || 'Authorized Administrator'}
                          </span>
                          <span>{new Date(note.created_at).toLocaleString()}</span>
                        </div>
                        <p className="text-xs text-slate-800 whitespace-pre-wrap leading-normal">
                          {note.note}
                        </p>
                      </div>
                    ))
                  )}
                </div>

                {/* Add New Note Form */}
                <form onSubmit={handleAddNote} className="space-y-2">
                  <textarea
                    rows={2}
                    placeholder="Add an internal note or action update..."
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500"
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isSubmittingNote || !newNoteText.trim()}
                      className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 transition-colors cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{isSubmittingNote ? 'Saving...' : 'Add Internal Note'}</span>
                    </button>
                  </div>
                </form>

              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
};
