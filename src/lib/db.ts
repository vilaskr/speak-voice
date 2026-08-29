import { supabase, isSupabaseConfigured } from './supabase';
import { generateSecureReportId, sanitizeReportId } from './security';
import type { 
  Complaint, 
  ComplaintCategory, 
  ComplaintStatus, 
  AdminNote, 
  PublicStatusResult, 
  SubmissionPayload 
} from '../types';

// Key for localStorage mock persistence when Supabase keys are not set yet
const STORAGE_KEY_COMPLAINTS = 'speaksafe_complaints_v1';
const STORAGE_KEY_NOTES = 'speaksafe_admin_notes_v1';
const STORAGE_KEY_ADMIN_SESSION = 'speaksafe_admin_session_v1';

// Pre-seeded initial data for instant preview demo testing
const INITIAL_DEMO_COMPLAINTS: Complaint[] = [
  {
    id: 'c101-uuid-8f92',
    report_id: 'SPK-9F82-X7L4',
    category: 'Infrastructure',
    title: 'Broken air conditioning in Library Reading Room 3',
    description: 'The AC unit on the 2nd floor library reading room has been leaking water and producing a loud humming noise for 3 days, making it difficult to study.',
    status: 'Under Review',
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    id: 'c102-uuid-3a1b',
    report_id: 'SPK-3A1B-4C5D',
    category: 'Harassment',
    title: 'Unsafe behavior near West Gate campus exit',
    description: 'Noticeable lack of security guards and street lighting near the West Gate after 9 PM. Several students felt uncomfortable walking to the bus stop.',
    status: 'In Progress',
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'c103-uuid-7e9f',
    report_id: 'SPK-7E9F-1A2B',
    category: 'Hostel',
    title: 'Quality of drinking water in Block B',
    description: 'Water dispenser on the 3rd floor Block B hostel tastes unusual. Requesting water filter inspection and maintenance check.',
    status: 'New',
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    id: 'c104-uuid-5k8p',
    report_id: 'SPK-5K8P-9M0N',
    category: 'Technical',
    title: 'Campus Wi-Fi authentication portal timeout errors',
    description: 'Students in the engineering building experience frequent disconnections every 15 minutes when trying to upload lab assignments.',
    status: 'Resolved',
    created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 4).toISOString(),
  }
];

const INITIAL_DEMO_NOTES: AdminNote[] = [
  {
    id: 'n1-uuid',
    complaint_id: 'c101-uuid-8f92',
    admin_user_id: 'admin-1',
    admin_email: 'admin@speaksafe.org',
    note: 'Facilities team dispatched an HVAC technician to inspect the Library 2nd floor unit.',
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    id: 'n2-uuid',
    complaint_id: 'c102-uuid-3a1b',
    admin_user_id: 'admin-1',
    admin_email: 'admin@speaksafe.org',
    note: 'Escalated to Campus Security Chief. Temporary floodlight installation requested for West Gate.',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  }
];

// Helper to get local mock storage
function getLocalComplaints(): Complaint[] {
  const data = localStorage.getItem(STORAGE_KEY_COMPLAINTS);
  if (!data) {
    localStorage.setItem(STORAGE_KEY_COMPLAINTS, JSON.stringify(INITIAL_DEMO_COMPLAINTS));
    return INITIAL_DEMO_COMPLAINTS;
  }
  try {
    return JSON.parse(data);
  } catch {
    return INITIAL_DEMO_COMPLAINTS;
  }
}

function saveLocalComplaints(complaints: Complaint[]) {
  localStorage.setItem(STORAGE_KEY_COMPLAINTS, JSON.stringify(complaints));
}

function getLocalNotes(): AdminNote[] {
  const data = localStorage.getItem(STORAGE_KEY_NOTES);
  if (!data) {
    localStorage.setItem(STORAGE_KEY_NOTES, JSON.stringify(INITIAL_DEMO_NOTES));
    return INITIAL_DEMO_NOTES;
  }
  try {
    return JSON.parse(data);
  } catch {
    return INITIAL_DEMO_NOTES;
  }
}

function saveLocalNotes(notes: AdminNote[]) {
  localStorage.setItem(STORAGE_KEY_NOTES, JSON.stringify(notes));
}

/**
 * 1. Submit an anonymous complaint.
 * Does not accept any PII (name, email, phone, IDs).
 * Generates cryptographically secure Report ID.
 */
export async function submitComplaint(payload: SubmissionPayload): Promise<{ success: boolean; report_id?: string; error?: string }> {
  // Validate input
  if (!payload.title || payload.title.trim().length < 5) {
    return { success: false, error: 'Title must be at least 5 characters long.' };
  }
  if (!payload.description || payload.description.trim().length < 15) {
    return { success: false, error: 'Description must be at least 15 characters long.' };
  }
  if (!payload.category) {
    return { success: false, error: 'Please select a valid complaint category.' };
  }

  const report_id = generateSecureReportId();
  const now = new Date().toISOString();

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('complaints')
        .insert({
          report_id,
          category: payload.category,
          title: payload.title.trim(),
          description: payload.description.trim(),
          status: 'New',
          created_at: now,
          updated_at: now,
        })
        .select('report_id')
        .single();

      if (error) {
        console.error('Supabase submission error:', error);
        return { success: false, error: 'Failed to record complaint in database. Please try again.' };
      }

      return { success: true, report_id: data.report_id };
    } catch (err: any) {
      console.error('Database connection error:', err);
      return { success: false, error: err.message || 'Network error while submitting complaint.' };
    }
  } else {
    // Local memory fallback
    await new Promise(res => setTimeout(res, 600)); // Simulate realistic network latency
    const newComplaint: Complaint = {
      id: crypto.randomUUID ? crypto.randomUUID() : `local-${Date.now()}`,
      report_id,
      category: payload.category,
      title: payload.title.trim(),
      description: payload.description.trim(),
      status: 'New',
      created_at: now,
      updated_at: now,
    };
    const current = getLocalComplaints();
    saveLocalComplaints([newComplaint, ...current]);
    return { success: true, report_id };
  }
}

/**
 * 2. Check public status by Report ID.
 * RETURNS ONLY MINIMAL STATUS DATA (report_id, category, status, created_at, updated_at).
 * NEVER exposes description, user data, or internal admin notes.
 */
export async function getPublicReportStatus(rawReportId: string): Promise<{ success: boolean; data?: PublicStatusResult; error?: string }> {
  const formattedId = sanitizeReportId(rawReportId);
  if (!formattedId) {
    return { success: false, error: 'Please enter a valid Report ID.' };
  }

  if (isSupabaseConfigured) {
    try {
      // First try RPC for public status lookup if configured
      const { data: rpcData, error: rpcError } = await supabase
        .rpc('get_complaint_status_by_report_id', { p_report_id: formattedId });

      if (!rpcError && rpcData && rpcData.length > 0) {
        return { success: true, data: rpcData[0] as PublicStatusResult };
      }

      // Fallback select only public status fields
      const { data, error } = await supabase
        .from('complaints')
        .select('report_id, category, status, created_at, updated_at')
        .eq('report_id', formattedId)
        .maybeSingle();

      if (error) {
        console.error('Status lookup query error:', error);
        return { success: false, error: 'Unable to check status at this time.' };
      }

      if (!data) {
        return { success: false, error: 'No complaint was found with this Report ID.' };
      }

      return { success: true, data: data as PublicStatusResult };
    } catch (err: any) {
      console.error('Supabase query error:', err);
      return { success: false, error: 'Error connecting to database service.' };
    }
  } else {
    // Local memory fallback
    await new Promise(res => setTimeout(res, 400));
    const complaints = getLocalComplaints();
    const found = complaints.find(c => c.report_id.toUpperCase() === formattedId);

    if (!found) {
      return { success: false, error: 'No complaint was found with this Report ID.' };
    }

    return {
      success: true,
      data: {
        report_id: found.report_id,
        category: found.category,
        status: found.status,
        created_at: found.created_at,
        updated_at: found.updated_at,
      }
    };
  }
}

/**
 * 3. Admin Authentication & Session Check
 */
export async function loginAdmin(email: string, pass: string): Promise<{ success: boolean; error?: string }> {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: pass,
    });

    if (error) {
      return { success: false, error: error.message || 'Invalid administrator credentials.' };
    }

    // Verify admin role authorization if custom role table exists
    const { data: roleData } = await supabase
      .from('admin_roles')
      .select('role')
      .eq('user_id', data.user.id)
      .maybeSingle();

    if (roleData && roleData.role !== 'admin') {
      await supabase.auth.signOut();
      return { success: false, error: 'Access denied: User account is not authorized as an administrator.' };
    }

    return { success: true };
  } else {
    await new Promise(res => setTimeout(res, 500));
    // Demo admin check for local test mode
    if ((email === 'admin@speaksafe.org' && pass === 'admin123') || (email && pass.length >= 6)) {
      localStorage.setItem(STORAGE_KEY_ADMIN_SESSION, JSON.stringify({ email, time: Date.now() }));
      return { success: true };
    }
    return { success: false, error: 'Invalid admin credentials. Use admin@speaksafe.org / admin123 for demo.' };
  }
}

export async function logoutAdmin(): Promise<void> {
  if (isSupabaseConfigured) {
    await supabase.auth.signOut();
  }
  localStorage.removeItem(STORAGE_KEY_ADMIN_SESSION);
}

export async function checkAdminSession(): Promise<{ isAuthenticated: boolean; email?: string }> {
  if (isSupabaseConfigured) {
    const { data } = await supabase.auth.getSession();
    if (data.session?.user) {
      return { isAuthenticated: true, email: data.session.user.email };
    }
    return { isAuthenticated: false };
  } else {
    const sessionRaw = localStorage.getItem(STORAGE_KEY_ADMIN_SESSION);
    if (!sessionRaw) return { isAuthenticated: false };
    try {
      const parsed = JSON.parse(sessionRaw);
      return { isAuthenticated: true, email: parsed.email || 'admin@speaksafe.org' };
    } catch {
      return { isAuthenticated: false };
    }
  }
}

/**
 * 4. Admin Operations (Protected by Supabase RLS and Admin Session)
 */

export async function fetchAdminComplaints(): Promise<{ success: boolean; complaints?: Complaint[]; error?: string }> {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('complaints')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Fetch complaints error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, complaints: data as Complaint[] };
  } else {
    await new Promise(res => setTimeout(res, 300));
    const complaints = getLocalComplaints();
    return { success: true, complaints };
  }
}

export async function updateComplaintStatus(
  complaintId: string, 
  newStatus: ComplaintStatus
): Promise<{ success: boolean; error?: string }> {
  const updated_at = new Date().toISOString();

  if (isSupabaseConfigured) {
    const { error } = await supabase
      .from('complaints')
      .update({ status: newStatus, updated_at })
      .eq('id', complaintId);

    if (error) {
      console.error('Update status error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } else {
    await new Promise(res => setTimeout(res, 200));
    const complaints = getLocalComplaints();
    const updated = complaints.map(c => 
      c.id === complaintId ? { ...c, status: newStatus, updated_at } : c
    );
    saveLocalComplaints(updated);
    return { success: true };
  }
}

export async function fetchAdminNotes(complaintId: string): Promise<{ success: boolean; notes?: AdminNote[]; error?: string }> {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('admin_notes')
      .select('*')
      .eq('complaint_id', complaintId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Fetch notes error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, notes: data as AdminNote[] };
  } else {
    await new Promise(res => setTimeout(res, 200));
    const notes = getLocalNotes();
    const filtered = notes.filter(n => n.complaint_id === complaintId);
    return { success: true, notes: filtered };
  }
}

export async function addAdminNote(
  complaintId: string, 
  noteText: string
): Promise<{ success: boolean; note?: AdminNote; error?: string }> {
  if (!noteText.trim()) {
    return { success: false, error: 'Note text cannot be empty.' };
  }

  const now = new Date().toISOString();

  if (isSupabaseConfigured) {
    const { data: sessionData } = await supabase.auth.getSession();
    const admin_user_id = sessionData.session?.user.id || 'admin-user';
    const admin_email = sessionData.session?.user.email || 'admin@speaksafe.org';

    const { data, error } = await supabase
      .from('admin_notes')
      .insert({
        complaint_id: complaintId,
        admin_user_id,
        note: noteText.trim(),
        created_at: now
      })
      .select('*')
      .single();

    if (error) {
      console.error('Add note error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, note: { ...data, admin_email } as AdminNote };
  } else {
    await new Promise(res => setTimeout(res, 200));
    const session = await checkAdminSession();
    const newNote: AdminNote = {
      id: crypto.randomUUID ? crypto.randomUUID() : `note-${Date.now()}`,
      complaint_id: complaintId,
      admin_user_id: 'admin-1',
      admin_email: session.email || 'admin@speaksafe.org',
      note: noteText.trim(),
      created_at: now
    };
    const notes = getLocalNotes();
    saveLocalNotes([...notes, newNote]);
    return { success: true, note: newNote };
  }
}
