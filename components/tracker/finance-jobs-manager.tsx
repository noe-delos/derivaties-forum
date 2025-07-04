"use client";

import { useState } from "react";
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

  const {
    data: jobsData,
    isLoading: jobsLoading,
    refetch,
  } = useQuery({
    queryKey: ["finance-jobs", filters, page, sortBy, sortOrder],
    queryFn: async () => {
      const result = await fetchFinanceJobs(supabase, filters, page, pageSize);

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
    },
    refetchInterval: 30000,
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

  const updateFilter = (key: keyof FinanceJobFilters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({});
    setPage(1);
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
    setPage(1);
  };

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
      {jobsLoading ? (
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
                    className="cursor-pointer hover:bg-muted/50 select-none"
                    onClick={() => handleSort('company_name')}
                  >
                    <div className="flex items-center gap-1">
                      Entreprise
                      {sortBy === 'company_name' && (
                        <Icon 
                          icon={sortOrder === 'asc' ? "material-symbols:keyboard-arrow-up" : "material-symbols:keyboard-arrow-down"}
                          className="h-4 w-4"
                        />
                      )}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50 select-none"
                    onClick={() => handleSort('programme_name')}
                  >
                    <div className="flex items-center gap-1">
                      Programme
                      {sortBy === 'programme_name' && (
                        <Icon 
                          icon={sortOrder === 'asc' ? "material-symbols:keyboard-arrow-up" : "material-symbols:keyboard-arrow-down"}
                          className="h-4 w-4"
                        />
                      )}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50 select-none"
                    onClick={() => handleSort('job_type')}
                  >
                    <div className="flex items-center gap-1">
                      Type
                      {sortBy === 'job_type' && (
                        <Icon 
                          icon={sortOrder === 'asc' ? "material-symbols:keyboard-arrow-up" : "material-symbols:keyboard-arrow-down"}
                          className="h-4 w-4"
                        />
                      )}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50 select-none"
                    onClick={() => handleSort('category')}
                  >
                    <div className="flex items-center gap-1">
                      Catégorie
                      {sortBy === 'category' && (
                        <Icon 
                          icon={sortOrder === 'asc' ? "material-symbols:keyboard-arrow-up" : "material-symbols:keyboard-arrow-down"}
                          className="h-4 w-4"
                        />
                      )}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50 select-none"
                    onClick={() => handleSort('locations')}
                  >
                    <div className="flex items-center gap-1">
                      Localisation
                      {sortBy === 'locations' && (
                        <Icon 
                          icon={sortOrder === 'asc' ? "material-symbols:keyboard-arrow-up" : "material-symbols:keyboard-arrow-down"}
                          className="h-4 w-4"
                        />
                      )}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50 select-none"
                    onClick={() => handleSort('opening_date')}
                  >
                    <div className="flex items-center gap-1">
                      Date d'ouverture
                      {sortBy === 'opening_date' && (
                        <Icon 
                          icon={sortOrder === 'asc' ? "material-symbols:keyboard-arrow-up" : "material-symbols:keyboard-arrow-down"}
                          className="h-4 w-4"
                        />
                      )}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50 select-none"
                    onClick={() => handleSort('closing_date')}
                  >
                    <div className="flex items-center gap-1">
                      Date de clôture
                      {sortBy === 'closing_date' && (
                        <Icon 
                          icon={sortOrder === 'asc' ? "material-symbols:keyboard-arrow-up" : "material-symbols:keyboard-arrow-down"}
                          className="h-4 w-4"
                        />
                      )}
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
