// Database types
export type UserRole = "user" | "moderator" | "admin";
export type PostCategory =
  | "entretien_sales_trading"
  | "conseils_ecole"
  | "stage_summer_graduate"
  | "quant_hedge_funds";
export type PostType =
  | "question"
  | "retour_experience"
  | "transcript_entretien"
  | "fichier_attache";
export type PostStatus = "pending" | "approved" | "rejected";
export type NotificationType =
  | "post_approved"
  | "post_rejected"
  | "comment_on_post"
  | "upvote_received"
  | "correction_submitted"
  | "correction_approved"
  | "correction_rejected";
export type FileType = "image" | "video" | "document";
export type CorrectionStatus = "pending" | "approved" | "rejected";

// Database table interfaces
export interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  username?: string;
  bio?: string;
  job_title?: string;
  location?: string;
  school?: string;
  profile_picture_url?: string;
  banner_url?: string;
  tokens: number;
  role: UserRole;
  is_banned: boolean;
  created_at: string;
  updated_at: string;
}

export interface Bank {
  id: string;
  name: string;
  logo_url: string;
  created_at: string;
  updated_at: string;
}

export interface Post {
  id: string;
  user_id: string;
  bank_id: string;
  title: string;
  content: string;
  category: PostCategory;
  type: PostType;
  tags: string[];
  is_public: boolean;
  status: PostStatus;
  upvotes: number;
  downvotes: number;
  comments_count: number;
  impressions: number;
  corrected: boolean;
  created_at: string;
  updated_at: string;
  city: string;

  // Relations
  user?: User;
  bank?: Bank;
  media?: PostMedia[];
  user_vote?: Vote;
  selected_correction?: Correction[];
}

export interface PostMedia {
  id: string;
  post_id: string;
  file_url: string;
  file_name: string;
  file_type: FileType;
  file_size?: number;
  display_order: number;
  created_at: string;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  parent_id?: string;
  content: string;
  upvotes: number;
  downvotes: number;
  created_at: string;
  updated_at: string;

  // Relations
  user?: User;
  replies?: Comment[];
  user_vote?: Vote;
}

export interface Vote {
  id: string;
  user_id: string;
  post_id?: string;
  comment_id?: string;
  vote_type: 1 | -1; // 1 for upvote, -1 for downvote
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  content?: string;
  post_id?: string;
  comment_id?: string;
  is_read: boolean;
  created_at: string;
}

export interface Correction {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  status: CorrectionStatus;
  moderator_id?: string;
  moderator_note?: string;
  tokens_awarded: number;
  is_selected: boolean;
  created_at: string;
  updated_at: string;

  // Relations
  user?: User;
  post?: Post;
  moderator?: User;
}

// UI Component Props
export interface PostCardProps {
  post: Post;
  isBlurred?: boolean;
  showActions?: boolean;
}

export interface CommentProps {
  comment: Comment;
  isBlurred?: boolean;
  showActions?: boolean;
  level?: number;
}

// Form types
export interface CreatePostForm {
  title: string;
  content: string;
  category: PostCategory;
  type: PostType;
  bank_id: string;
  tags: string[];
  is_public: boolean;
  media_files: File[];
  document_files: File[];
}

export interface UpdateProfileForm {
  first_name?: string;
  last_name?: string;
  username?: string;
  bio?: string;
  job_title?: string;
  location?: string;
  school?: string;
  profile_picture?: File;
  banner?: File;
}

export interface SearchFilters {
  category?: PostCategory;
  type?: PostType;
  city?: string;
  cities?: string[]; // Array of city names
  banks?: string[]; // Array of bank IDs
  tags?: string[];
  company?: string;
  position?: string;
  location?: string;
  school?: string;
  date_from?: string;
  date_to?: string;
  sortBy?: "recent" | "popular" | "comments";
}

// API Response types
export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  nextPage?: number;
}

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

// Category and type mappings for French labels
export const POST_CATEGORIES: any = {
  entretien_sales_trading: "Entretien Sales & Trading",
  conseils_ecole: "Conseils par école",
  stage_summer_graduate: "Stage / Summer / Graduate",
  quant_hedge_funds: "Quant & Hedge Funds",
};

export const POST_TYPES: any = {
  question: "Questions",
  retour_experience: "Retours d'expérience",
  transcript_entretien: "Transcripts d'entretien",
  fichier_attache: "Fichiers attachés",
};

export const USER_ROLES: Record<UserRole, string> = {
  user: "Utilisateur",
  moderator: "Modérateur",
  admin: "Administrateur",
};

// Finance Jobs Types
export type JobType = 
  | 'off-cycle-internships' 
  | 'summer-internships' 
  | 'graduate-programmes';

export type JobCategory = 
  | 'Bulge Bracket'
  | 'Elite Boutique' 
  | 'Off-Cycle Internships'
  | 'Mid-Market'
  | 'Asset Management'
  | 'Private Equity'
  | 'Hedge Funds'
  | 'Consulting'
  | 'Tech';

export interface JobLink {
  url: string;
  text: string;
}

export interface FinanceJob {
  id: string;
  company_name: string;
  programme_name: string | null;
  category: JobCategory | null;
  job_type: JobType;
  opening_date: string | null;
  closing_date: string | null;
  locations: string | null;
  info_test_prep: string | null;
  cv_required: string | null;
  cover_letter_required: string | null;
  written_answers_required: string | null;
  notes: string | null;
  company_links: JobLink[] | null;
  programme_links: JobLink[] | null;
  test_prep_links: JobLink[] | null;
  source_url: string;
  last_scraped: string | null;
  created_at: string;
  updated_at: string;
}

export interface FinanceJobFilters {
  job_type?: JobType | 'all';
  category?: JobCategory | 'all';
  company_name?: string;
  locations?: string;
  cv_required?: 'Yes' | 'No' | 'all';
  cover_letter_required?: 'Yes' | 'No' | 'all';
  written_answers_required?: 'Yes' | 'No' | 'all';
  has_test_prep?: boolean;
  opening_date_from?: string;
  opening_date_to?: string;
  closing_date_from?: string;
  closing_date_to?: string;
  search?: string;
}

export interface FinanceJobStats {
  total_jobs: number;
  active_jobs: number;
  jobs_by_type: Array<{
    job_type: JobType;
    count: number;
    percentage: number;
  }>;
  jobs_by_category: Array<{
    category: JobCategory;
    count: number;
    percentage: number;
  }>;
  top_companies: Array<{
    company_name: string;
    count: number;
  }>;
  jobs_closing_soon: Array<FinanceJob>;
  recent_additions: Array<FinanceJob>;
  requirement_stats: {
    cv_required: number;
    cover_letter_required: number;
    written_answers_required: number;
    has_test_prep: number;
  };
}

export const JOB_TYPES: Record<JobType, string> = {
  'off-cycle-internships': 'Stages Off-Cycle',
  'summer-internships': 'Stages d\'été',
  'graduate-programmes': 'Programmes Graduate',
};

export const JOB_CATEGORIES: Record<JobCategory, string> = {
  'Bulge Bracket': 'Bulge Bracket',
  'Elite Boutique': 'Elite Boutique',
  'Off-Cycle Internships': 'Stages Off-Cycle',
  'Mid-Market': 'Mid-Market',
  'Asset Management': 'Gestion d\'actifs',
  'Private Equity': 'Private Equity',
  'Hedge Funds': 'Hedge Funds',
  'Consulting': 'Conseil',
  'Tech': 'Technologie',
};
