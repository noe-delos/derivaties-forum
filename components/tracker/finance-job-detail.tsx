"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Icon } from "@iconify/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  fetchFinanceJobById
} from "@/lib/services/finance-jobs";
import { useSupabase } from "@/hooks/use-supabase";
import { 
  JOB_TYPES,
  JOB_CATEGORIES 
} from "@/lib/types";

interface FinanceJobDetailProps {
  jobId: string;
  onBack: () => void;
  onUpdate: () => void;
}

export function FinanceJobDetail({ jobId, onBack, onUpdate }: FinanceJobDetailProps) {
  const supabase = useSupabase();

  const { data: job, isLoading, error } = useQuery({
    queryKey: ["finance-job", jobId],
    queryFn: () => fetchFinanceJobById(supabase, jobId),
    enabled: !!jobId,
  });

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Non spécifié';
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-8 w-48" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>
            <Icon icon="material-symbols:arrow-back" className="h-4 w-4 mr-2" />
            Retour
          </Button>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <p className="text-red-500">Erreur lors du chargement de l'offre d'emploi.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>
            <Icon icon="material-symbols:arrow-back" className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{job.company_name}</h1>
            <p className="text-muted-foreground">{job.programme_name || 'Programme non spécifié'}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="capitalize">
            {JOB_TYPES[job.job_type]}
          </Badge>
          {job.category && (
            <Badge variant="secondary">
              {JOB_CATEGORIES[job.category]}
            </Badge>
          )}
        </div>
      </div>

      {/* Job Details */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon icon="material-symbols:info" className="h-5 w-5" />
              Informations générales
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Entreprise</label>
              <p className="font-medium">{job.company_name}</p>
            </div>
            
            {job.programme_name && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Programme</label>
                <p>{job.programme_name}</p>
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-muted-foreground">Type d'offre</label>
              <p>{JOB_TYPES[job.job_type]}</p>
            </div>

            {job.category && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Catégorie</label>
                <p>{JOB_CATEGORIES[job.category]}</p>
              </div>
            )}

            {job.locations && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Localisation</label>
                <p>{job.locations}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dates */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon icon="material-symbols:calendar-month" className="h-5 w-5" />
              Dates importantes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Date d'ouverture</label>
              <p>{formatDate(job.opening_date)}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-muted-foreground">Date de clôture</label>
              <p className={job.closing_date && new Date(job.closing_date) < new Date() ? 'text-red-600' : 'text-green-600'}>
                {formatDate(job.closing_date)}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Dernière mise à jour</label>
              <p>{formatDate(job.updated_at)}</p>
            </div>

            {job.last_scraped && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Dernière extraction</label>
                <p>{formatDate(job.last_scraped)}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Requirements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon icon="material-symbols:checklist" className="h-5 w-5" />
            Exigences
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center justify-between p-3 border rounded">
              <span>CV requis</span>
              <Badge variant={job.cv_required === 'Yes' ? 'default' : 'outline'}>
                {job.cv_required === 'Yes' ? 'Oui' : 'Non'}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded">
              <span>Lettre de motivation</span>
              <Badge variant={job.cover_letter_required === 'Yes' ? 'default' : 'outline'}>
                {job.cover_letter_required === 'Yes' ? 'Requise' : 'Non requise'}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded">
              <span>Réponses écrites</span>
              <Badge variant={job.written_answers_required === 'Yes' ? 'default' : 'outline'}>
                {job.written_answers_required === 'Yes' ? 'Requises' : 'Non requises'}
              </Badge>
            </div>
          </div>

          {job.info_test_prep && (
            <div className="mt-4">
              <label className="text-sm font-medium text-muted-foreground">Information sur les tests</label>
              <p className="mt-1 p-3 bg-muted rounded">{job.info_test_prep}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Links */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon icon="material-symbols:link" className="h-5 w-5" />
            Liens utiles
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {job.company_links && job.company_links.length > 0 && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">Liens entreprise</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {job.company_links.map((link, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    asChild
                  >
                    <a href={link.url} target="_blank" rel="noopener noreferrer">
                      <Icon icon="material-symbols:business" className="h-4 w-4 mr-2" />
                      {link.text}
                      <Icon icon="material-symbols:open-in-new" className="h-4 w-4 ml-2" />
                    </a>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {job.programme_links && job.programme_links.length > 0 && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">Liens programme</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {job.programme_links.map((link, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    asChild
                  >
                    <a href={link.url} target="_blank" rel="noopener noreferrer">
                      <Icon icon="material-symbols:school" className="h-4 w-4 mr-2" />
                      {link.text}
                      <Icon icon="material-symbols:open-in-new" className="h-4 w-4 ml-2" />
                    </a>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {job.test_prep_links && job.test_prep_links.length > 0 && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">Liens préparation test</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {job.test_prep_links.map((link, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    asChild
                  >
                    <a href={link.url} target="_blank" rel="noopener noreferrer">
                      <Icon icon="material-symbols:quiz" className="h-4 w-4 mr-2" />
                      {link.text}
                      <Icon icon="material-symbols:open-in-new" className="h-4 w-4 ml-2" />
                    </a>
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-muted-foreground">Source</label>
            <div className="mt-2">
              <Button variant="outline" size="sm" asChild>
                <a href={job.source_url} target="_blank" rel="noopener noreferrer">
                  <Icon icon="material-symbols:link" className="h-4 w-4 mr-2" />
                  Voir l'annonce originale
                  <Icon icon="material-symbols:open-in-new" className="h-4 w-4 ml-2" />
                </a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      {job.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon icon="material-symbols:notes" className="h-5 w-5" />
              Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{job.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}