"use client";

import { Icon } from "@iconify/react";
import {
  Bar,
  BarChart,
  Pie,
  PieChart,
  Cell,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { FinanceJobStats, JOB_TYPES, JOB_CATEGORIES } from "@/lib/types";

interface FinanceJobsStatsProps {
  stats: FinanceJobStats;
}

export function FinanceJobsStats({ stats }: FinanceJobsStatsProps) {
  const statCards = [
    {
      title: "Total Offres",
      value: stats.total_jobs,
      change: `${stats.active_jobs} actives`,
      icon: "tdesign:setting-1-filled",
      color: "text-blue-600",
    },
    {
      title: "Actives",
      value: stats.active_jobs,
      change: "Offres ouvertes",
      icon: "material-symbols:work",
      color: "text-green-600",
    },
    {
      title: "CV Requis",
      value: stats.requirement_stats.cv_required,
      change: `${Math.round((stats.requirement_stats.cv_required / stats.total_jobs) * 100)}% des offres`,
      icon: "material-symbols:description",
      color: "text-orange-600",
    },
    {
      title: "Tests",
      value: stats.requirement_stats.has_test_prep,
      change: "Avec préparation test",
      icon: "material-symbols:quiz",
      color: "text-purple-600",
    },
  ];

  // Chart configurations
  const jobTypeChartConfig = stats.jobs_by_type.reduce((acc: any, item, index) => {
    acc[item.job_type] = {
      label: JOB_TYPES[item.job_type],
      color: `hsl(var(--chart-${(index % 5) + 1}))`,
    };
    return acc;
  }, {});

  const categoryChartConfig = stats.jobs_by_category.reduce((acc: any, item, index) => {
    acc[item.category] = {
      label: JOB_CATEGORIES[item.category],
      color: `hsl(var(--chart-${(index % 5) + 1}))`,
    };
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <Icon icon={stat.icon} className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Job Types Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon icon="material-symbols:pie-chart" className="h-5 w-5" />
              Répartition par type
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={jobTypeChartConfig}>
              <PieChart>
                <Pie
                  data={stats.jobs_by_type.map((item, index) => ({
                    ...item,
                    name: JOB_TYPES[item.job_type],
                    fill: `hsl(var(--chart-${(index % 5) + 1}))`,
                  }))}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Top Companies */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon icon="material-symbols:business" className="h-5 w-5" />
              Top entreprises
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{ companies: { label: "Offres", color: "hsl(var(--chart-1))" } }}>
              <BarChart data={stats.top_companies.slice(0, 8)} layout="horizontal">
                <XAxis type="number" />
                <YAxis dataKey="company_name" type="category" width={100} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="hsl(var(--chart-1))" />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Additions and Closing Soon */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon icon="material-symbols:new-releases" className="h-5 w-5" />
              Ajouts récents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recent_additions.slice(0, 5).map((job) => (
                <div key={job.id} className="flex items-center justify-between p-2 border rounded">
                  <div>
                    <div className="font-medium">{job.company_name}</div>
                    <div className="text-sm text-muted-foreground">
                      {job.programme_name || JOB_TYPES[job.job_type]}
                    </div>
                  </div>
                  <Badge variant="outline">
                    {new Date(job.created_at).toLocaleDateString('fr-FR')}
                  </Badge>
                </div>
              ))}
              {stats.recent_additions.length === 0 && (
                <div className="text-center text-muted-foreground py-4">
                  Aucun ajout récent
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon icon="material-symbols:schedule" className="h-5 w-5" />
              Clôtures prochaines
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.jobs_closing_soon.slice(0, 5).map((job) => (
                <div key={job.id} className="flex items-center justify-between p-2 border rounded">
                  <div>
                    <div className="font-medium">{job.company_name}</div>
                    <div className="text-sm text-muted-foreground">
                      {job.programme_name || JOB_TYPES[job.job_type]}
                    </div>
                  </div>
                  <Badge variant="destructive">
                    {job.closing_date && new Date(job.closing_date).toLocaleDateString('fr-FR')}
                  </Badge>
                </div>
              ))}
              {stats.jobs_closing_soon.length === 0 && (
                <div className="text-center text-muted-foreground py-4">
                  Aucune clôture prochaine
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Distribution if available */}
      {stats.jobs_by_category.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon icon="material-symbols:category" className="h-5 w-5" />
              Répartition par catégorie
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-5">
              {stats.jobs_by_category.map((category, index) => (
                <div key={category.category} className="text-center p-3 border rounded">
                  <div
                    className="w-4 h-4 rounded-full mx-auto mb-2"
                    style={{ backgroundColor: `hsl(var(--chart-${(index % 5) + 1}))` }}
                  />
                  <div className="font-medium text-sm">{JOB_CATEGORIES[category.category]}</div>
                  <div className="text-2xl font-bold">{category.count}</div>
                  <div className="text-xs text-muted-foreground">{category.percentage}%</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}