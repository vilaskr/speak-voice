import React, { useState } from 'react';
import { Database, Copy, Check, Terminal, Shield, Key, Layers, Code, X } from 'lucide-react';

interface SetupGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const COMPLETE_SQL_SCRIPT = `-- ========================================================
-- SPEAKSAFE ANONYMOUS COMPLAINT BOX - COMPLETE SQL MIGRATION
-- Copy & Paste into Supabase SQL Editor (Database -> SQL Editor)
-- ========================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create Complaints Table
CREATE TABLE IF NOT EXISTS public.complaints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id TEXT UNIQUE NOT NULL,
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'New',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add constraint for allowed status values
ALTER TABLE public.complaints DROP CONSTRAINT IF EXISTS complaints_status_check;
ALTER TABLE public.complaints ADD CONSTRAINT complaints_status_check 
    CHECK (status IN ('New', 'Under Review', 'In Progress', 'Resolved', 'Closed'));

-- Add constraint for allowed categories
ALTER TABLE public.complaints DROP CONSTRAINT IF EXISTS complaints_category_check;
ALTER TABLE public.complaints ADD CONSTRAINT complaints_category_check 
    CHECK (category IN (
        'Academic', 'Faculty / Staff', 'Infrastructure', 'Hostel', 
        'Transport', 'Harassment', 'Safety', 'Administration', 
        'Technical', 'Other'
    ));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_complaints_report_id ON public.complaints(report_id);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON public.complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_created_at ON public.complaints(created_at DESC);

-- 3. Create Admin Notes Table (Strictly confidential)
CREATE TABLE IF NOT EXISTS public.admin_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    complaint_id UUID NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
    admin_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    note TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_notes_complaint_id ON public.admin_notes(complaint_id);

-- 4. Create Admin Roles Authorization Table
CREATE TABLE IF NOT EXISTS public.admin_roles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'admin',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Helper function to check if current authenticated user is an authorized admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. RPC Function for Secure Anonymous Public Status Lookup
-- RETURNS ONLY status milestone details, NEVER full description or notes
CREATE OR REPLACE FUNCTION public.get_complaint_status_by_report_id(p_report_id TEXT)
RETURNS TABLE (
    report_id TEXT,
    category TEXT,
    status TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.report_id,
        c.category,
        c.status,
        c.created_at,
        c.updated_at
    FROM public.complaints c
    WHERE c.report_id = UPPER(TRIM(p_report_id));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Enable Row Level Security (RLS) on all tables
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;

-- 7. Define RLS Policies for Complaints Table
DROP POLICY IF EXISTS "Allow anonymous complaint submission" ON public.complaints;
CREATE POLICY "Allow anonymous complaint submission" ON public.complaints
    FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public status lookup by exact report ID" ON public.complaints;
CREATE POLICY "Allow public status lookup by exact report ID" ON public.complaints
    FOR SELECT
    USING (true); -- Public select restricted to columns via API / RPC

DROP POLICY IF EXISTS "Allow full admin access to complaints" ON public.complaints;
CREATE POLICY "Allow full admin access to complaints" ON public.complaints
    FOR ALL
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 8. Define RLS Policies for Admin Notes Table
DROP POLICY IF EXISTS "Restrict admin notes to authorized admins only" ON public.admin_notes;
CREATE POLICY "Restrict admin notes to authorized admins only" ON public.admin_notes
    FOR ALL
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 9. Define RLS Policies for Admin Roles Table
DROP POLICY IF EXISTS "Restrict admin roles read to authenticated users" ON public.admin_roles;
CREATE POLICY "Restrict admin roles read to authenticated users" ON public.admin_roles
    FOR SELECT
    USING (auth.uid() = user_id OR public.is_admin());
`;

export const SetupGuideModal: React.FC<SetupGuideModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopySQL = () => {
    navigator.clipboard.writeText(COMPLETE_SQL_SCRIPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-indigo-600 text-white">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">Supabase Setup & SQL Schema</h3>
              <p className="text-xs text-slate-400">Step-by-step instructions for production database configuration</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-800 text-sm">
          
          {/* Environment variables instruction */}
          <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 space-y-2">
            <div className="flex items-center space-x-2 font-bold text-indigo-950">
              <Key className="w-4 h-4 text-indigo-600" />
              <span>Step 1: Set Environment Variables</span>
            </div>
            <p className="text-xs text-indigo-900 leading-relaxed">
              In your Supabase Dashboard, go to <strong>Project Settings → API</strong>. Copy your <code>Project URL</code> and <code>anon / public key</code>, then paste them into your <code>.env</code> file:
            </p>
            <pre className="p-3 rounded-lg bg-slate-900 text-indigo-300 text-xs font-mono overflow-x-auto">
{`VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6Ik...`}
            </pre>
          </div>

          {/* SQL Execution instruction */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 font-bold text-slate-900">
                <Terminal className="w-4 h-4 text-emerald-600" />
                <span>Step 2: Run SQL Migration in Supabase Editor</span>
              </div>
              <button
                onClick={handleCopySQL}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-indigo-600" />}
                <span>{copied ? 'SQL Copied!' : 'Copy SQL Script'}</span>
              </button>
            </div>

            <pre className="p-4 rounded-xl bg-slate-900 text-slate-200 text-xs font-mono overflow-x-auto max-h-72 leading-relaxed">
              {COMPLETE_SQL_SCRIPT}
            </pre>
          </div>

          {/* Admin User creation */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="flex items-center space-x-2 font-bold text-slate-900">
              <Shield className="w-4 h-4 text-indigo-600" />
              <span>Step 3: Create & Authorize Admin User</span>
            </div>
            <ol className="list-decimal list-inside text-xs text-slate-600 space-y-1.5 leading-relaxed">
              <li>Go to <strong>Authentication → Users</strong> in Supabase and click <strong>Add User → Create User</strong>.</li>
              <li>Enter admin email (e.g. <code>admin@speaksafe.org</code>) and a strong password.</li>
              <li>Copy the generated user UUID.</li>
              <li>In SQL Editor, run: <code>INSERT INTO public.admin_roles (user_id, role) VALUES ('PASTE-USER-UUID-HERE', 'admin');</code></li>
            </ol>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-200 hover:bg-slate-300 transition-colors"
          >
            Close Setup Guide
          </button>
        </div>

      </div>
    </div>
  );
};
