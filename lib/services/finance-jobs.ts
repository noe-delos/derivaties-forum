/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any */
import { SupabaseClient } from "@supabase/supabase-js";
import { FinanceJob, FinanceJobFilters, FinanceJobStats, JobType, JobCategory } from "@/lib/types";

export async function fetchFinanceJobs(
  supabase: SupabaseClient,
  filters: FinanceJobFilters = {},
  page = 1,
  pageSize = 20
): Promise<{ data: FinanceJob[]; count: number }> {
  let query = supabase
    .from('finance_jobs')
    .select('*', { count: 'exact' });

  // Apply filters
  if (filters.job_type && filters.job_type !== 'all') {
    query = query.eq('job_type', filters.job_type);
  }

  if (filters.category && filters.category !== 'all') {
    query = query.eq('category', filters.category);
  }

  if (filters.company_name) {
    query = query.ilike('company_name', `%${filters.company_name}%`);
  }

  if (filters.locations) {
    query = query.ilike('locations', `%${filters.locations}%`);
  }

  if (filters.cv_required && filters.cv_required !== 'all') {
    query = query.eq('cv_required', filters.cv_required);
  }

  if (filters.cover_letter_required && filters.cover_letter_required !== 'all') {
    query = query.eq('cover_letter_required', filters.cover_letter_required);
  }

  if (filters.written_answers_required && filters.written_answers_required !== 'all') {
    query = query.eq('written_answers_required', filters.written_answers_required);
  }

  if (filters.has_test_prep) {
    query = query.not('info_test_prep', 'is', null);
  }

  if (filters.opening_date_from) {
    query = query.gte('opening_date', filters.opening_date_from);
  }

  if (filters.opening_date_to) {
    query = query.lte('opening_date', filters.opening_date_to);
  }

  if (filters.closing_date_from) {
    query = query.gte('closing_date', filters.closing_date_from);
  }

  if (filters.closing_date_to) {
    query = query.lte('closing_date', filters.closing_date_to);
  }

  if (filters.search) {
    query = query.or(`company_name.ilike.%${filters.search}%,programme_name.ilike.%${filters.search}%,notes.ilike.%${filters.search}%`);
  }

  // Pagination
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  query = query
    .range(from, to)
    .order('created_at', { ascending: false });

  const { data, error, count } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return {
    data: data as FinanceJob[],
    count: count || 0,
  };
}

export async function fetchFinanceJobById(
  supabase: SupabaseClient,
  id: string
): Promise<FinanceJob> {
  const { data, error } = await supabase
    .from('finance_jobs')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as FinanceJob;
}

export async function fetchFinanceJobStats(
  supabase: SupabaseClient
): Promise<FinanceJobStats> {
  // Get total and active jobs count
  const [totalJobsResult, activeJobsResult] = await Promise.all([
    supabase
      .from('finance_jobs')
      .select('*', { count: 'exact', head: true }),
    supabase
      .from('finance_jobs')
      .select('*', { count: 'exact', head: true })
      .or('closing_date.is.null,closing_date.gte.' + new Date().toISOString().split('T')[0]),
  ]);

  const total_jobs = totalJobsResult.count || 0;
  const active_jobs = activeJobsResult.count || 0;

  // Get jobs by type
  const { data: jobTypeData } = await supabase
    .from('finance_jobs')
    .select('job_type');

  const jobs_by_type = jobTypeData ? 
    Object.entries(
      jobTypeData.reduce((acc: any, job) => {
        acc[job.job_type] = (acc[job.job_type] || 0) + 1;
        return acc;
      }, {})
    ).map(([job_type, count]) => ({
      job_type: job_type as JobType,
      count: count as number,
      percentage: Math.round(((count as number) / jobTypeData.length) * 100),
    })) : [];

  // Get jobs by category
  const { data: categoryData } = await supabase
    .from('finance_jobs')
    .select('category')
    .not('category', 'is', null);

  const jobs_by_category = categoryData ? 
    Object.entries(
      categoryData.reduce((acc: any, job) => {
        acc[job.category] = (acc[job.category] || 0) + 1;
        return acc;
      }, {})
    ).map(([category, count]) => ({
      category: category as JobCategory,
      count: count as number,
      percentage: Math.round(((count as number) / categoryData.length) * 100),
    })) : [];

  // Get top companies
  const { data: companyData } = await supabase
    .from('finance_jobs')
    .select('company_name');

  const top_companies = companyData ? 
    Object.entries(
      companyData.reduce((acc: any, job) => {
        acc[job.company_name] = (acc[job.company_name] || 0) + 1;
        return acc;
      }, {})
    )
    .map(([company_name, count]) => ({
      company_name,
      count: count as number,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10) : [];

  // Get jobs closing soon (within next 30 days)
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  const { data: closingSoonData } = await supabase
    .from('finance_jobs')
    .select('*')
    .not('closing_date', 'is', null)
    .gte('closing_date', new Date().toISOString().split('T')[0])
    .lte('closing_date', thirtyDaysFromNow.toISOString().split('T')[0])
    .order('closing_date', { ascending: true })
    .limit(10);

  // Get recent additions (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data: recentData } = await supabase
    .from('finance_jobs')
    .select('*')
    .gte('created_at', sevenDaysAgo.toISOString())
    .order('created_at', { ascending: false })
    .limit(10);

  // Get requirement stats
  const { data: requirementData } = await supabase
    .from('finance_jobs')
    .select('cv_required, cover_letter_required, written_answers_required, info_test_prep');

  const requirement_stats = requirementData ? {
    cv_required: requirementData.filter(job => job.cv_required === 'Yes').length,
    cover_letter_required: requirementData.filter(job => job.cover_letter_required === 'Yes').length,
    written_answers_required: requirementData.filter(job => job.written_answers_required === 'Yes').length,
    has_test_prep: requirementData.filter(job => job.info_test_prep).length,
  } : {
    cv_required: 0,
    cover_letter_required: 0,
    written_answers_required: 0,
    has_test_prep: 0,
  };

  return {
    total_jobs,
    active_jobs,
    jobs_by_type,
    jobs_by_category,
    top_companies,
    jobs_closing_soon: closingSoonData as FinanceJob[] || [],
    recent_additions: recentData as FinanceJob[] || [],
    requirement_stats,
  };
}

export async function updateFinanceJob(
  supabase: SupabaseClient,
  id: string,
  updates: Partial<FinanceJob>
): Promise<FinanceJob> {
  const { data, error } = await supabase
    .from('finance_jobs')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as FinanceJob;
}

export async function createFinanceJob(
  supabase: SupabaseClient,
  jobData: Omit<FinanceJob, 'id' | 'created_at' | 'updated_at' | 'last_scraped'>
): Promise<FinanceJob> {
  const { data, error } = await supabase
    .from('finance_jobs')
    .insert([{
      ...jobData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }])
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as FinanceJob;
}

export async function deleteFinanceJob(
  supabase: SupabaseClient,
  id: string
): Promise<void> {
  const { error } = await supabase
    .from('finance_jobs')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(error.message);
  }
}

export async function getUniqueCompanies(
  supabase: SupabaseClient
): Promise<string[]> {
  const { data, error } = await supabase
    .from('finance_jobs')
    .select('company_name')
    .order('company_name');

  if (error) {
    throw new Error(error.message);
  }

  return [...new Set(data.map(item => item.company_name))];
}

export async function getUniqueLocations(
  supabase: SupabaseClient
): Promise<string[]> {
  const { data, error } = await supabase
    .from('finance_jobs')
    .select('locations')
    .not('locations', 'is', null)
    .order('locations');

  if (error) {
    throw new Error(error.message);
  }

  return [...new Set(data.map(item => item.locations))];
}