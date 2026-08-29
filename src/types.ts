export type ComplaintCategory = 
  | 'Academic'
  | 'Faculty / Staff'
  | 'Infrastructure'
  | 'Hostel'
  | 'Transport'
  | 'Harassment'
  | 'Safety'
  | 'Administration'
  | 'Technical'
  | 'Other';

export type ComplaintStatus = 
  | 'New'
  | 'Under Review'
  | 'In Progress'
  | 'Resolved'
  | 'Closed';

export interface Complaint {
  id: string;
  report_id: string;
  category: ComplaintCategory;
  title: string;
  description: string;
  status: ComplaintStatus;
  created_at: string;
  updated_at: string;
}

export interface AdminNote {
  id: string;
  complaint_id: string;
  admin_user_id: string;
  admin_email?: string;
  note: string;
  created_at: string;
}

export interface PublicStatusResult {
  report_id: string;
  category: ComplaintCategory;
  status: ComplaintStatus;
  created_at: string;
  updated_at: string;
}

export interface SubmissionPayload {
  category: ComplaintCategory;
  title: string;
  description: string;
}

export interface AdminStats {
  total: number;
  new: number;
  underReview: number;
  inProgress: number;
  resolved: number;
  closed: number;
}
