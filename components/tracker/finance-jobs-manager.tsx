"use client";

import { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Icon } from "@iconify/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  fetchFinanceJobs,
  fetchFinanceJobStats,
  getUniqueCompanies,
  getUniqueLocations,
} from "@/lib/services/finance-jobs";
import { useSupabase } from "@/hooks/use-supabase";
import {
  FinanceJobFilters,
  JobType,
  JobCategory,
  JOB_TYPES,
  JOB_CATEGORIES,
} from "@/lib/types";
import { FinanceJobsStats } from "./finance-jobs-stats";
import { FinanceJobDetail } from "./finance-job-detail";

export function FinanceJobsManager() {
  const supabase = useSupabase();
  const [filters, setFilters] = useState<FinanceJobFilters>({});
  const [page, setPage] = useState(1);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const pageSize = 20;

  // Memoize the query key to prevent unnecessary re-renders
  const queryKey = useMemo(() => [
    "finance-jobs", 
    JSON.stringify(filters), 
    page, 
    sortBy, 
    sortOrder
  ], [filters, page, sortBy, sortOrder]);

  const {
    data: jobsData,
    isLoading: jobsLoading,
    error: jobsError,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      try {
        console.log('Fetching finance jobs with:', { filters, page, pageSize });
        const result = await fetchFinanceJobs(supabase, filters, page, pageSize);
        console.log('Finance jobs result:', result);

        // Apply sorting
        const sorted = [...result.data].sort((a, b) => {
          let aVal: any = a[sortBy as keyof typeof a];
          let bVal: any = b[sortBy as keyof typeof b];
          
          if (aVal === null) aVal = '';
          if (bVal === null) bVal = '';
          
          if (sortBy === 'opening_date' || sortBy === 'closing_date') {
            aVal = aVal ? new Date(aVal as string).getTime() : 0;
            bVal = bVal ? new Date(bVal as string).getTime() : 0;
          }
          
          if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
          if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
          return 0;
        });

        // If no job type filter is selected, mix up the job types (but respect sorting)
        if ((!filters.job_type || filters.job_type === "all") && sortBy === 'created_at') {
          const shuffled = [...sorted].sort(() => Math.random() - 0.5);
          return { ...result, data: shuffled };
        }

        return { ...result, data: sorted };
      } catch (error) {
        console.error('Error in finance jobs query:', error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: false, // Disable auto-refetch to prevent infinite loops
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["finance-job-stats"],
    queryFn: () => fetchFinanceJobStats(supabase),
    refetchInterval: 60000,
  });

  const { data: companies } = useQuery({
    queryKey: ["finance-job-companies"],
    queryFn: () => getUniqueCompanies(supabase),
  });

  const { data: locations } = useQuery({
    queryKey: ["finance-job-locations"],
    queryFn: () => getUniqueLocations(supabase),
  });

  const updateFilter = useCallback((key: keyof FinanceJobFilters, value: any) => {
    setFilters((prev) => {
      // Only update if value actually changed
      if (prev[key] === value) return prev;
      return { ...prev, [key]: value };
    });
    setPage(1);
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
    setPage(1);
  }, []);

  const handleSort = useCallback((column: string) => {
    if (sortBy === column) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
    setPage(1);
  }, [sortBy]);

  const getJobTypeColor = (jobType: JobType) => {
    switch (jobType) {
      case "off-cycle-internships":
        return "bg-blue-100 text-blue-800";
      case "summer-internships":
        return "bg-green-100 text-green-800";
      case "graduate-programmes":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch (error) {
      console.error('Date formatting error:', error, dateString);
      return "-";
    }
  };

  if (selectedJobId) {
    return (
      <FinanceJobDetail
        jobId={selectedJobId}
        onBack={() => setSelectedJobId(null)}
        onUpdate={() => refetch()}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters - Single Row */}
      <div className="flex flex-wrap items-center gap-4">
        <Input
          placeholder="Rechercher..."
          value={filters.search || ""}
          onChange={(e) => updateFilter("search", e.target.value || undefined)}
          className="w-48 py-5 rounded-xl shadow-soft"
        />

        <Select
          value={filters.job_type || "all"}
          onValueChange={(value) =>
            updateFilter("job_type", value === "all" ? undefined : value)
          }
        >
          <SelectTrigger className="w-fit py-5 rounded-xl shadow-soft">
            <SelectValue placeholder="Type d'offre" />
            <Icon icon="material-symbols:keyboard-arrow-down" className="h-4 w-4" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les types</SelectItem>
            {Object.entries(JOB_TYPES).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.category || "all"}
          onValueChange={(value) =>
            updateFilter("category", value === "all" ? undefined : value)
          }
        >
          <SelectTrigger className="w-fit py-5 rounded-xl shadow-soft">
            <SelectValue placeholder="Catégorie" />
            <Icon icon="material-symbols:keyboard-arrow-down" className="h-4 w-4" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes</SelectItem>
            {Object.entries(JOB_CATEGORIES).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.company_name || "all_companies"}
          onValueChange={(value) =>
            updateFilter(
              "company_name",
              value === "all_companies" ? undefined : value
            )
          }
        >
          <SelectTrigger className="w-fit py-5 rounded-xl shadow-soft">
            <SelectValue placeholder="Entreprise" />
            <Icon icon="material-symbols:keyboard-arrow-down" className="h-4 w-4" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all_companies">Toutes</SelectItem>
            {companies?.map((company) => (
              <SelectItem key={company} value={company}>
                {company}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.locations || "all_locations"}
          onValueChange={(value) =>
            updateFilter(
              "locations",
              value === "all_locations" ? undefined : value
            )
          }
        >
          <SelectTrigger className="w-fit py-5 rounded-xl shadow-soft">
            <SelectValue placeholder="Localisation" />
            <Icon icon="material-symbols:keyboard-arrow-down" className="h-4 w-4" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all_locations">Toutes</SelectItem>
            {locations?.map((location) => (
              <SelectItem key={location} value={location}>
                {location}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          onClick={clearFilters}
          size="sm"
          className="py-5 rounded-xl shadow-soft"
        >
          <Icon icon="material-symbols:clear" className="h-4 w-4 mr-2" />
          Effacer
        </Button>

        <div className="flex items-center gap-2 ml-auto">
          <Badge
            variant="outline"
            className="text-green-600 py-2 bg-green-50 rounded-xl shadow-soft"
          >
            <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
            Connecté
          </Badge>
        </div>
      </div>

      {/* Jobs Table */}
      {jobsError ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-4">
          <div className="text-red-800">
            <h3 className="font-medium">Erreur de chargement</h3>
            <p className="text-sm mt-1">
              Impossible de charger les données des emplois finance. 
              {process.env.NODE_ENV === 'development' && (
                <span className="block mt-2 font-mono text-xs">
                  {jobsError instanceof Error ? jobsError.message : String(jobsError)}
                </span>
              )}
            </p>
            <Button 
              onClick={() => refetch()} 
              variant="outline" 
              size="sm" 
              className="mt-3"
            >
              <Icon icon="material-symbols:refresh" className="h-4 w-4 mr-2" />
              Réessayer
            </Button>
          </div>
        </div>
      ) : jobsLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="cursor-pointer hover:bg-blue-50 hover:text-blue-700 select-none transition-colors duration-200 group"
                    onClick={() => handleSort('company_name')}
                  >
                    <div className="flex items-center gap-2">
                      Entreprise
                      <div className="flex flex-col opacity-30 group-hover:opacity-70 transition-opacity">
                        <Icon 
                          icon="material-symbols:keyboard-arrow-up"
                          className={`h-3 w-3 ${sortBy === 'company_name' && sortOrder === 'asc' ? 'text-blue-600 opacity-100' : ''}`}
                        />
                        <Icon 
                          icon="material-symbols:keyboard-arrow-down"
                          className={`h-3 w-3 -mt-1 ${sortBy === 'company_name' && sortOrder === 'desc' ? 'text-blue-600 opacity-100' : ''}`}
                        />
                      </div>
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-blue-50 hover:text-blue-700 select-none transition-colors duration-200 group"
                    onClick={() => handleSort('programme_name')}
                  >
                    <div className="flex items-center gap-2">
                      Programme
                      <div className="flex flex-col opacity-30 group-hover:opacity-70 transition-opacity">
                        <Icon 
                          icon="material-symbols:keyboard-arrow-up"
                          className={`h-3 w-3 ${sortBy === 'programme_name' && sortOrder === 'asc' ? 'text-blue-600 opacity-100' : ''}`}
                        />
                        <Icon 
                          icon="material-symbols:keyboard-arrow-down"
                          className={`h-3 w-3 -mt-1 ${sortBy === 'programme_name' && sortOrder === 'desc' ? 'text-blue-600 opacity-100' : ''}`}
                        />
                      </div>
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-blue-50 hover:text-blue-700 select-none transition-colors duration-200 group"
                    onClick={() => handleSort('job_type')}
                  >
                    <div className="flex items-center gap-2">
                      Type
                      <div className="flex flex-col opacity-30 group-hover:opacity-70 transition-opacity">
                        <Icon 
                          icon="material-symbols:keyboard-arrow-up"
                          className={`h-3 w-3 ${sortBy === 'job_type' && sortOrder === 'asc' ? 'text-blue-600 opacity-100' : ''}`}
                        />
                        <Icon 
                          icon="material-symbols:keyboard-arrow-down"
                          className={`h-3 w-3 -mt-1 ${sortBy === 'job_type' && sortOrder === 'desc' ? 'text-blue-600 opacity-100' : ''}`}
                        />
                      </div>
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-blue-50 hover:text-blue-700 select-none transition-colors duration-200 group"
                    onClick={() => handleSort('category')}
                  >
                    <div className="flex items-center gap-2">
                      Catégorie
                      <div className="flex flex-col opacity-30 group-hover:opacity-70 transition-opacity">
                        <Icon 
                          icon="material-symbols:keyboard-arrow-up"
                          className={`h-3 w-3 ${sortBy === 'category' && sortOrder === 'asc' ? 'text-blue-600 opacity-100' : ''}`}
                        />
                        <Icon 
                          icon="material-symbols:keyboard-arrow-down"
                          className={`h-3 w-3 -mt-1 ${sortBy === 'category' && sortOrder === 'desc' ? 'text-blue-600 opacity-100' : ''}`}
                        />
                      </div>
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-blue-50 hover:text-blue-700 select-none transition-colors duration-200 group"
                    onClick={() => handleSort('locations')}
                  >
                    <div className="flex items-center gap-2">
                      Localisation
                      <div className="flex flex-col opacity-30 group-hover:opacity-70 transition-opacity">
                        <Icon 
                          icon="material-symbols:keyboard-arrow-up"
                          className={`h-3 w-3 ${sortBy === 'locations' && sortOrder === 'asc' ? 'text-blue-600 opacity-100' : ''}`}
                        />
                        <Icon 
                          icon="material-symbols:keyboard-arrow-down"
                          className={`h-3 w-3 -mt-1 ${sortBy === 'locations' && sortOrder === 'desc' ? 'text-blue-600 opacity-100' : ''}`}
                        />
                      </div>
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-blue-50 hover:text-blue-700 select-none transition-colors duration-200 group"
                    onClick={() => handleSort('opening_date')}
                  >
                    <div className="flex items-center gap-2">
                      Date d'ouverture
                      <div className="flex flex-col opacity-30 group-hover:opacity-70 transition-opacity">
                        <Icon 
                          icon="material-symbols:keyboard-arrow-up"
                          className={`h-3 w-3 ${sortBy === 'opening_date' && sortOrder === 'asc' ? 'text-blue-600 opacity-100' : ''}`}
                        />
                        <Icon 
                          icon="material-symbols:keyboard-arrow-down"
                          className={`h-3 w-3 -mt-1 ${sortBy === 'opening_date' && sortOrder === 'desc' ? 'text-blue-600 opacity-100' : ''}`}
                        />
                      </div>
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-blue-50 hover:text-blue-700 select-none transition-colors duration-200 group"
                    onClick={() => handleSort('closing_date')}
                  >
                    <div className="flex items-center gap-2">
                      Date de clôture
                      <div className="flex flex-col opacity-30 group-hover:opacity-70 transition-opacity">
                        <Icon 
                          icon="material-symbols:keyboard-arrow-up"
                          className={`h-3 w-3 ${sortBy === 'closing_date' && sortOrder === 'asc' ? 'text-blue-600 opacity-100' : ''}`}
                        />
                        <Icon 
                          icon="material-symbols:keyboard-arrow-down"
                          className={`h-3 w-3 -mt-1 ${sortBy === 'closing_date' && sortOrder === 'desc' ? 'text-blue-600 opacity-100' : ''}`}
                        />
                      </div>
                    </div>
                  </TableHead>
                  <TableHead>Exigences</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobsData?.data.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell className="font-medium">
                      {job.company_name}
                    </TableCell>
                    <TableCell>
                      {job.programme_links && job.programme_links.length > 0 ? (
                        <a
                          href={job.programme_links[0].url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {job.programme_name || job.programme_links[0].text}
                        </a>
                      ) : (
                        <span>{job.programme_name || "-"}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={getJobTypeColor(job.job_type)}>
                        {JOB_TYPES[job.job_type]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {job.category ? JOB_CATEGORIES[job.category] : "-"}
                    </TableCell>
                    <TableCell>{job.locations || "-"}</TableCell>
                    <TableCell>{formatDate(job.opening_date)}</TableCell>
                    <TableCell>{formatDate(job.closing_date)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {job.cv_required === "Yes" && (
                          <Badge variant="outline" className="text-xs">
                            CV
                          </Badge>
                        )}
                        {job.cover_letter_required === "Yes" && (
                          <Badge variant="outline" className="text-xs">
                            LM
                          </Badge>
                        )}
                        {job.written_answers_required === "Yes" && (
                          <Badge variant="outline" className="text-xs">
                            QR
                          </Badge>
                        )}
                        {job.info_test_prep && (
                          <Badge variant="outline" className="text-xs">
                            Test
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {jobsData && jobsData.count > pageSize && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-muted-foreground">
                Affichage de {(page - 1) * pageSize + 1} à{" "}
                {Math.min(page * pageSize, jobsData.count)} sur {jobsData.count}{" "}
                offres
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="rounded-xl shadow-soft"
                >
                  <Icon
                    icon="material-symbols:chevron-left"
                    className="h-4 w-4"
                  />
                  Précédent
                </Button>

                <div className="flex items-center gap-1">
                  {(() => {
                    if (!jobsData?.count) return null;
                    
                    const totalPages = Math.ceil(jobsData.count / pageSize);
                    const pages = [];
                    
                    // Always show first page
                    if (page > 3) {
                      pages.push(1);
                      if (page > 4) pages.push('...');
                    }
                    
                    // Show pages around current page
                    const start = Math.max(1, page - 2);
                    const end = Math.min(totalPages, page + 2);
                    
                    for (let i = start; i <= end; i++) {
                      pages.push(i);
                    }
                    
                    // Always show last page
                    if (page < totalPages - 2) {
                      if (page < totalPages - 3) pages.push('...');
                      pages.push(totalPages);
                    }
                    
                    return pages.map((pageNum, index) => {
                      if (pageNum === '...') {
                        return <span key={`ellipsis-${index}`} className="px-2">...</span>;
                      }
                      
                      return (
                        <Button
                          key={pageNum}
                          variant={pageNum === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => setPage(pageNum as number)}
                          className="w-10 h-10 p-0 rounded-lg shadow-soft"
                        >
                          {pageNum}
                        </Button>
                      );
                    });
                  })()}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page >= Math.ceil(jobsData.count / pageSize)}
                  className="rounded-xl shadow-soft"
                >
                  Suivant
                  <Icon
                    icon="material-symbols:chevron-right"
                    className="h-4 w-4"
                  />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
