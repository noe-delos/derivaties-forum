"use client";

import { useState } from "react";
import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TrackerFiltersProps {
  onFiltersChange: (filters: any) => void;
}

export function TrackerFilters({ onFiltersChange }: TrackerFiltersProps) {
  const [filterMyStatus, setFilterMyStatus] = useState(false);
  const [filterOpenOnly, setFilterOpenOnly] = useState(false);
  const [filterRecentOnly, setFilterRecentOnly] = useState(false);
  const [sortBy, setSortBy] = useState("closing-date");

  const handleFilterChange = (key: string, value: any) => {
    const newFilters = {
      filterMyStatus,
      filterOpenOnly,
      filterRecentOnly,
      sortBy,
      [key]: value
    };
    
    if (key === "filterMyStatus") setFilterMyStatus(value);
    if (key === "filterOpenOnly") setFilterOpenOnly(value);
    if (key === "filterRecentOnly") setFilterRecentOnly(value);
    if (key === "sortBy") setSortBy(value);
    
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    setFilterMyStatus(false);
    setFilterOpenOnly(false);
    setFilterRecentOnly(false);
    setSortBy("closing-date");
    onFiltersChange({
      filterMyStatus: false,
      filterOpenOnly: false,
      filterRecentOnly: false,
      sortBy: "closing-date"
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Filtres</CardTitle>
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 mr-2" />
            Effacer
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="filter-my-status"
              checked={filterMyStatus}
              onCheckedChange={(value) => handleFilterChange("filterMyStatus", value)}
            />
            <Label htmlFor="filter-my-status" className="text-sm">
              Filtrer par mon statut
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="filter-open-only"
              checked={filterOpenOnly}
              onCheckedChange={(value) => handleFilterChange("filterOpenOnly", value)}
            />
            <Label htmlFor="filter-open-only" className="text-sm">
              Programmes ouverts seulement
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="filter-recent-only"
              checked={filterRecentOnly}
              onCheckedChange={(value) => handleFilterChange("filterRecentOnly", value)}
            />
            <Label htmlFor="filter-recent-only" className="text-sm">
              Récemment ouverts seulement
            </Label>
          </div>
          <div className="space-y-2">
            <Label className="text-sm">Trier par</Label>
            <Select value={sortBy} onValueChange={(value) => handleFilterChange("sortBy", value)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="closing-date">Date de clôture</SelectItem>
                <SelectItem value="opening-date">Date d'ouverture</SelectItem>
                <SelectItem value="company">Entreprise</SelectItem>
                <SelectItem value="status">Mon statut</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}