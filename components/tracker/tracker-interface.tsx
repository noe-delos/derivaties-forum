"use client";

import { useState } from "react";
import { Search, Plus, Calendar, Building } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Application {
  id: string;
  myStatus: string;
  companyName: string;
  programmeName: string;
  openingDate: string;
  closingDate: string;
  latestStage: string;
  lastYearOpening: string;
  process: string;
  infoTestPrep: string;
  rolling: boolean;
  cv: string;
  coverLetter: string;
  writtenAnswers: string;
  notes: string;
}

const mockApplications: Application[] = [
  {
    id: "1",
    myStatus: "Postulé",
    companyName: "Goldman Sachs",
    programmeName: "Summer Analyst - Investment Banking",
    openingDate: "2024-09-15",
    closingDate: "2024-10-31",
    latestStage: "Assessment Center",
    lastYearOpening: "2023-09-12",
    process: "CV + Cover Letter + Test + Entretien",
    infoTestPrep: "Numerical Reasoning + Situational Judgment",
    rolling: false,
    cv: "Soumis",
    coverLetter: "Soumis",
    writtenAnswers: "Complété",
    notes: "Entretien prévu le 15 novembre",
  },
  {
    id: "2",
    myStatus: "En cours",
    companyName: "Morgan Stanley",
    programmeName: "Spring Week - Sales & Trading",
    openingDate: "2024-08-20",
    closingDate: "2024-09-30",
    latestStage: "Entretien RH",
    lastYearOpening: "2023-08-18",
    process: "CV + Test + Entretien",
    infoTestPrep: "HackerRank + Brainteasers",
    rolling: true,
    cv: "Soumis",
    coverLetter: "N/A",
    writtenAnswers: "N/A",
    notes: "Réponse attendue sous 2 semaines",
  },
  {
    id: "3",
    myStatus: "Intéressé",
    companyName: "J.P. Morgan",
    programmeName: "Summer Analyst - Markets",
    openingDate: "2024-10-01",
    closingDate: "2024-11-15",
    latestStage: "Ouvert",
    lastYearOpening: "2023-09-28",
    process: "CV + Cover Letter + Entretien",
    infoTestPrep: "Pymetrics + Entretien technique",
    rolling: false,
    cv: "À préparer",
    coverLetter: "À préparer",
    writtenAnswers: "N/A",
    notes: "Deadline proche - priorité haute",
  },
];

const programTypes = [
  { value: "summer", label: "Stages d'été", count: 12 },
  { value: "spring", label: "Spring Weeks", count: 8 },
  { value: "off-cycle", label: "Stages hors-cycle", count: 5 },
  { value: "industrial", label: "Stages industriels", count: 3 },
  { value: "graduate", label: "Programmes Graduate", count: 15 },
  { value: "pre-uni", label: "Pré-université", count: 4 },
  { value: "events", label: "Événements", count: 7 },
];

const bankOptions = [
  { value: "all", label: "Toutes les banques" },
  { value: "goldman", label: "Goldman Sachs" },
  { value: "morgan", label: "Morgan Stanley" },
  { value: "jp-morgan", label: "J.P. Morgan" },
  { value: "ubs", label: "UBS" },
  { value: "credit-suisse", label: "Credit Suisse" },
  { value: "barclays", label: "Barclays" },
  { value: "deutsche", label: "Deutsche Bank" },
];

export function TrackerInterface() {
  const [selectedProgram, setSelectedProgram] = useState("summer");
  const [selectedBank, setSelectedBank] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("closing-date");

  const getStatusBadge = (status: string) => {
    const variants = {
      Postulé: "secondary",
      "En cours": "default",
      Intéressé: "outline",
      Refusé: "destructive",
      Accepté: "success",
    };
    return variants[status as keyof typeof variants] || "outline";
  };

  const getStageBadge = (stage: string) => {
    const variants = {
      Ouvert: "secondary",
      "Assessment Center": "default",
      "Entretien RH": "outline",
      "Entretien technique": "outline",
      Offre: "success",
    };
    return variants[stage as keyof typeof variants] || "outline";
  };

  const filteredApplications = mockApplications.filter((app) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        app.companyName.toLowerCase().includes(query) ||
        app.programmeName.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const selectedProgramType = programTypes.find(
    (p) => p.value === selectedProgram
  );

  return (
    <div className="space-y-6">
      {/* Filters and Search Row */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Search Bar */}
        <div className="flex-shrink-0 w-80">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Rechercher par entreprise ou programme..."
              className="pl-9 h-10 py-2 rounded-xl shadow-soft text-sm placeholder:text-muted-foreground/50"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Program Type Select */}
        <Select value={selectedProgram} onValueChange={setSelectedProgram}>
          <SelectTrigger className="w-48 h-10 py-2 rounded-xl shadow-soft">
            <SelectValue placeholder="Type de programme" />
          </SelectTrigger>
          <SelectContent>
            {programTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                <div className="flex items-center justify-between w-full">
                  <span>{type.label}</span>
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {type.count}
                  </Badge>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Bank Select */}
        <Select value={selectedBank} onValueChange={setSelectedBank}>
          <SelectTrigger className="w-48 h-10 py-2 rounded-xl shadow-soft">
            <SelectValue placeholder="Banque" />
          </SelectTrigger>
          <SelectContent>
            {bankOptions.map((bank) => (
              <SelectItem key={bank.value} value={bank.value}>
                {bank.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Sort By Select */}
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-48 h-10 py-2 rounded-xl shadow-soft">
            <SelectValue placeholder="Trier par" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="closing-date">Date de clôture</SelectItem>
            <SelectItem value="opening-date">Date d'ouverture</SelectItem>
            <SelectItem value="company">Entreprise</SelectItem>
            <SelectItem value="status">Mon statut</SelectItem>
          </SelectContent>
        </Select>

        {/* Add Application Button */}
        <Button className="gap-2 h-10 px-4 rounded-xl shadow-soft">
          <Plus className="h-4 w-4" />
          Ajouter une candidature
        </Button>
      </div>

      {/* Current Filter Badge */}
      {selectedProgramType && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Affichage:</span>
          <Badge variant="outline" className="gap-1">
            {selectedProgramType.label}
            <span className="text-xs">({selectedProgramType.count})</span>
          </Badge>
        </div>
      )}

      {/* Applications Table */}
      <Card className="border-0 shadow-soft rounded-2xl">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-muted">
                  <TableHead className="h-16 px-6 text-sm font-semibold">
                    Mon Statut
                  </TableHead>
                  <TableHead className="h-16 px-6 text-sm font-semibold">
                    Entreprise
                  </TableHead>
                  <TableHead className="h-16 px-6 text-sm font-semibold">
                    Programme
                  </TableHead>
                  <TableHead className="h-16 px-6 text-sm font-semibold">
                    Date d'ouverture
                  </TableHead>
                  <TableHead className="h-16 px-6 text-sm font-semibold">
                    Date de clôture
                  </TableHead>
                  <TableHead className="h-16 px-6 text-sm font-semibold">
                    Dernière étape
                  </TableHead>
                  <TableHead className="h-16 px-6 text-sm font-semibold">
                    Ouverture l'année dernière
                  </TableHead>
                  <TableHead className="h-16 px-6 text-sm font-semibold">
                    Processus
                  </TableHead>
                  <TableHead className="h-16 px-6 text-sm font-semibold">
                    Info & Test Prep
                  </TableHead>
                  <TableHead className="h-16 px-6 text-sm font-semibold">
                    Rolling
                  </TableHead>
                  <TableHead className="h-16 px-6 text-sm font-semibold">
                    CV
                  </TableHead>
                  <TableHead className="h-16 px-6 text-sm font-semibold">
                    Lettre de motivation
                  </TableHead>
                  <TableHead className="h-16 px-6 text-sm font-semibold">
                    Questions écrites
                  </TableHead>
                  <TableHead className="h-16 px-6 text-sm font-semibold">
                    Notes
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredApplications.map((app) => (
                  <TableRow
                    key={app.id}
                    className="hover:bg-muted/50 border-b border-muted/30"
                  >
                    <TableCell className="h-20 px-6">
                      <Badge variant={getStatusBadge(app.myStatus) as any}>
                        {app.myStatus}
                      </Badge>
                    </TableCell>
                    <TableCell className="h-20 px-6">
                      <div className="flex items-center gap-3">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        <button className="text-left hover:underline font-medium">
                          {app.companyName}
                        </button>
                      </div>
                    </TableCell>
                    <TableCell className="h-20 px-6">
                      <button className="text-left hover:underline max-w-[250px] truncate">
                        {app.programmeName}
                      </button>
                    </TableCell>
                    <TableCell className="h-20 px-6">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {new Date(app.openingDate).toLocaleDateString(
                            "fr-FR"
                          )}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="h-20 px-6">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {new Date(app.closingDate).toLocaleDateString(
                            "fr-FR"
                          )}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="h-20 px-6">
                      <Badge variant={getStageBadge(app.latestStage) as any}>
                        {app.latestStage}
                      </Badge>
                    </TableCell>
                    <TableCell className="h-20 px-6">
                      <span className="text-sm">
                        {new Date(app.lastYearOpening).toLocaleDateString(
                          "fr-FR"
                        )}
                      </span>
                    </TableCell>
                    <TableCell className="h-20 px-6">
                      <div
                        className="max-w-[200px] truncate text-sm"
                        title={app.process}
                      >
                        {app.process}
                      </div>
                    </TableCell>
                    <TableCell className="h-20 px-6">
                      <div
                        className="max-w-[180px] truncate text-sm"
                        title={app.infoTestPrep}
                      >
                        {app.infoTestPrep}
                      </div>
                    </TableCell>
                    <TableCell className="h-20 px-6">
                      {app.rolling ? (
                        <Badge variant="secondary">Oui</Badge>
                      ) : (
                        <Badge variant="outline">Non</Badge>
                      )}
                    </TableCell>
                    <TableCell className="h-20 px-6">
                      <Badge
                        variant={app.cv === "Soumis" ? "secondary" : "outline"}
                      >
                        {app.cv}
                      </Badge>
                    </TableCell>
                    <TableCell className="h-20 px-6">
                      <Badge
                        variant={
                          app.coverLetter === "Soumis" ? "secondary" : "outline"
                        }
                      >
                        {app.coverLetter}
                      </Badge>
                    </TableCell>
                    <TableCell className="h-20 px-6">
                      <Badge
                        variant={
                          app.writtenAnswers === "Complété"
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {app.writtenAnswers}
                      </Badge>
                    </TableCell>
                    <TableCell className="h-20 px-6">
                      <div
                        className="max-w-[200px] truncate text-sm"
                        title={app.notes}
                      >
                        {app.notes}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
