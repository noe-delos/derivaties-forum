export type JobType = 
  | 'off-cycle-internships' 
  | 'summer-internships' 
  | 'graduate-programmes';

export type Category = 
  | 'Bulge Bracket'
  | 'Elite Boutique' 
  | 'Off-Cycle Internships'
  | 'Mid-Market'
  | 'Asset Management'
  | 'Private Equity'
  | 'Hedge Funds'
  | 'Consulting'
  | 'Tech';

export interface Link {
  url: string;
  text: string;
}

export interface FinanceJob {
  id: string;
  company_name: string;
  programme_name: string | null;
  category: Category | null;
  job_type: JobType;
  opening_date: string | null;
  closing_date: string | null;
  locations: string | null;
  info_test_prep: string | null;
  cv_required: string | null;
  cover_letter_required: string | null;
  written_answers_required: string | null;
  notes: string | null;
  company_links: Link[] | null;
  programme_links: Link[] | null;
  test_prep_links: Link[] | null;
  source_url: string;
  last_scraped: string | null;
  created_at: string;
  updated_at: string;
}

export interface FinanceJobFilters {
  job_type?: JobType | 'all';
  category?: Category | 'all';
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
    category: Category;
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