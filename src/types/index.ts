export interface User {
  id: number;
  name: string;
  email: string; // NEVER shown to other users
  role: 'worker' | 'employer' | 'admin';
  phone: string; // Only revealed at Stage 4 (contact_revealed=true)
  barangay: string;
  municipality: string;
  document_url: string | null;
  avatar_url?: string | null;
  verification_status: 'pending' | 'approved' | 'rejected' | 'correction_needed';
  registration_status?: 'pending_email_verification' | 'pending_id_upload' | 'pending_review' | 'approved' | 'rejected';
  verification_badge: boolean;
  is_suspended: boolean;
  reputation_score: number;
  worker_profile?: WorkerProfile;
  employer_profile?: EmployerProfile;
}

export interface JobPost {
  id: number;
  reference_number: string; // e.g. "SIKAP-2025-00042"
  title: string;
  description: string;
  category: string;
  barangay: string;
  municipality: string;
  compensation: number;
  slots: number;
  accepted_count: number;
  duration_type: string;
  status: 'open' | 'closed_in_progress' | 'completed' | 'cancelled';
  rating_window_expires_at: string | null;
  employer: User;
}

export interface Application {
  id: number;
  job_post_id: number;
  status: 'pending' | 'pending_negotiation' | 'employer_confirmed' | 'accepted' | 'rejected' | 'withdrawn' | 'completed';
  cover_note: string | null;
  applied_at: string;
  final_agreed_price: number | null; // only at employer_confirmed or accepted
  references_revealed: boolean; // true at Stage 2
  contact_revealed: boolean; // true at Stage 4
  job: JobPost;
  worker: {
    id: number;
    name: string;
    barangay: string;
    reputation_score: number;
    verification_badge: boolean;
    skills: string[];
    experiences: WorkerExperience[];
    character_references: CharacterReference[] | null; // null if not yet revealed
    phone: string | null; // null if not yet revealed
    email: null; // ALWAYS null — never shown
  };
}

export interface Skill {
  id: number;
  name: string;
  category: string;
}

export interface WorkerProfile {
  id: number;
  name: string;
  phone: string;
  barangay: string;
  municipality: string;
  bio?: string;
  skills: Skill[];
  experiences: WorkerExperience[];
  character_references: CharacterReference[];
  verification_status: 'pending' | 'approved' | 'rejected' | 'correction_needed';
  verification_badge: boolean;
  reputation_score: number;
}

export interface EmployerProfile {
  id: number;
  name: string;
  phone: string;
  barangay: string;
  municipality: string;
  bio?: string;
  verification_status: 'pending' | 'approved' | 'rejected' | 'correction_needed';
  verification_badge: boolean;
  reputation_score: number;
}

export interface Review {
  id: number;
  application_id: number;
  reviewer_id: number;
  cat1: number; // rating category 1
  cat2: number; // rating category 2
  cat3: number; // rating category 3
  cat4: number; // rating category 4
  overall_rating: number;
  comment: string;
  created_at: string;
}

export interface CharacterReference {
  id: number;
  name: string;
  phone: string;
  relationship: string;
}

export interface WorkerExperience {
  id: number;
  job_title: string;
  employer_name: string;
  duration: string;
  description: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

// Laravel API response format for OTP verification
export interface LaravelOtpResponse {
  message: string;
  user_id: number;
}

// Laravel API response format for login
export interface LaravelLoginResponse {
  token: string;
  token_type: string;
  user: User;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  current_page: number;
  per_page: number;
}

export interface AuthResponse {
  token: string;
  token_type: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  role: 'worker' | 'employer';
  phone: string;
  barangay: string;
  municipality: string;
}

export interface JobRequest {
  title: string;
  description: string;
  category: string;
  barangay: string;
  municipality: string;
  slots: number;
  compensation: number;
  duration_type: string;
}

export interface ApplicationRequest {
  cover_note?: string;
}

export interface JobRequestPayload {
  final_agreed_price: number;
}

export interface ReviewRequest {
  cat1: number;
  cat2: number;
  cat3: number;
  cat4: number;
  overall_rating: number;
  comment: string;
}

export interface ReportRequest {
  reportable_type: string;
  reportable_id: number;
  type: string;
  description: string;
}
