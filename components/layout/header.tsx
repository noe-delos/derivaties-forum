"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  User,
  LogOut,
  Settings,
  PlusCircle,
  Filter,
  Sparkles,
  X,
  Tag,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  User as UserType,
  SearchFilters,
  POST_CATEGORIES,
  POST_TYPES,
  PostCategory,
  PostType,
} from "@/lib/types";
import { signOutAction } from "@/lib/actions/auth";

interface HeaderProps {
  isAuthenticated: boolean;
  profile: UserType | null;
  onSearch?: (
    query: string,
    filters: SearchFilters,
    isNaturalLanguage: boolean
  ) => void;
  popularTags?: string[];
}

export function Header({
  isAuthenticated,
  profile,
  onSearch,
  popularTags = [],
}: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<SearchFilters>({
    sortBy: "recent",
  });
  const [isNaturalLanguage, setIsNaturalLanguage] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize from URL params
  useEffect(() => {
    const query = searchParams.get("q") || "";
    const category = searchParams.get("category");
    const type = searchParams.get("type");
    const sort = searchParams.get("sort") || "recent";
    const nl = searchParams.get("nl") === "true";

    setSearchQuery(query);
    setFilters({
      category:
        category && Object.keys(POST_CATEGORIES).includes(category)
          ? (category as PostCategory)
          : undefined,
      type:
        type && Object.keys(POST_TYPES).includes(type)
          ? (type as PostType)
          : undefined,
      sortBy: sort as "recent" | "popular" | "comments",
    });
    setIsNaturalLanguage(nl);
  }, [searchParams]);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    console.log("🔍 Header search initiated:", {
      searchQuery: searchQuery.trim(),
      filters,
      isNaturalLanguage,
    });

    setIsSearching(true);

    // Update URL
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set("q", searchQuery.trim());
    if (filters.category) params.set("category", filters.category);
    if (filters.type) params.set("type", filters.type);
    if (filters.sortBy && filters.sortBy !== "recent")
      params.set("sort", filters.sortBy);
    if (isNaturalLanguage) params.set("nl", "true");

    const url = `/${params.toString() ? `?${params.toString()}` : ""}`;
    console.log("🔗 Updating URL to:", url);
    router.push(url, { scroll: false });

    // Call parent search handler
    if (onSearch) {
      console.log("📞 Calling parent search handler...");
      await onSearch(searchQuery.trim(), filters, isNaturalLanguage);
      console.log("✅ Parent search handler completed");
    }

    setIsSearching(false);
  };

  const handleFilterChange = (newFilters: SearchFilters) => {
    console.log("🔧 Filter change:", { oldFilters: filters, newFilters });
    setFilters(newFilters);
    // Trigger search immediately when filters change
    setTimeout(async () => {
      if (onSearch) {
        console.log("⚡ Auto-triggering search due to filter change...");
        setIsSearching(true);
        await onSearch(searchQuery.trim(), newFilters, isNaturalLanguage);
        setIsSearching(false);
        console.log("✅ Auto-search completed");
      }
    }, 0);
  };

  const handleNaturalLanguageToggle = (enabled: boolean) => {
    console.log("🤖 Natural language toggle:", enabled);
    setIsNaturalLanguage(enabled);
    if (searchQuery.trim() && onSearch) {
      console.log("⚡ Auto-triggering search due to NL toggle...");
      setIsSearching(true);
      onSearch(searchQuery.trim(), filters, enabled);
      setTimeout(() => setIsSearching(false), 500);
    }
  };

  const clearFilters = () => {
    console.log("🗑️ Clearing all filters and search");
    setFilters({});
    setSearchQuery("");
    setIsNaturalLanguage(false);
    router.push("/", { scroll: false });
    if (onSearch) {
      onSearch("", {}, false);
    }
  };

  const addTagFilter = (tag: string) => {
    const currentTags = filters.tags || [];
    if (!currentTags.includes(tag)) {
      const newFilters = { ...filters, tags: [...currentTags, tag] };
      handleFilterChange(newFilters);
    }
  };

  const removeTagFilter = (tag: string) => {
    const currentTags = filters.tags || [];
    const newFilters = {
      ...filters,
      tags: currentTags.filter((t) => t !== tag),
    };
    handleFilterChange(newFilters);
  };

  const hasActiveFilters =
    Object.keys(filters).some((key) => {
      const value = filters[key as keyof SearchFilters];
      return Array.isArray(value) ? value.length > 0 : !!value;
    }) || searchQuery.trim();

  const handleSignOut = async () => {
    try {
      toast.loading("Déconnexion en cours...");

      // Use server action for signout
      const result = await signOutAction();

      toast.dismiss();

      if (result.success) {
        toast.success(result.message || "Déconnexion réussie !");
        router.push("/");
        router.refresh();
      } else {
        toast.error(result.error || "Erreur lors de la déconnexion");
      }
    } catch (error) {
      console.error("Error during logout:", error);
      toast.dismiss();
      toast.error("Erreur lors de la déconnexion");
    }
  };

  const getUserInitials = () => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase();
    }
    if (profile?.username) {
      return profile.username.slice(0, 2).toUpperCase();
    }
    return "U";
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-muted bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container pl-10">
        {/* Main Header Row */}
        <div className="flex h-14 items-center gap-4">
          {/* Search Bar */}
          <div className="flex-1 max-w-xl">
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder={
                  isNaturalLanguage
                    ? "Posez votre question en langage naturel..."
                    : "Rechercher des discussions..."
                }
                className="pl-10 pr-12 h-10 rounded-full text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                disabled={isSearching}
              />

              {/* Loading indicator */}
              {isSearching && (
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              )}
            </form>
          </div>

          {/* AI Toggle */}
          <div className="flex items-center space-x-2">
            <Sparkles className="h-4 w-4 text-muted-foreground" />
            <Switch
              checked={isNaturalLanguage}
              onCheckedChange={handleNaturalLanguageToggle}
              className="scale-90"
            />
          </div>

          {/* Search Controls Row */}
          <div className="flex items-center gap-2">
            {/* Filters Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-1 h-8"
            >
              <Filter className="h-3 w-3" />
              {hasActiveFilters && (
                <Badge
                  variant="secondary"
                  className="h-4 w-4 p-0 flex items-center justify-center text-xs"
                >
                  {
                    Object.keys(filters).filter((key) => {
                      const value = filters[key as keyof SearchFilters];
                      return Array.isArray(value) ? value.length > 0 : !!value;
                    }).length
                  }
                </Badge>
              )}
            </Button>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="gap-1 h-8"
              >
                <X className="h-3 w-3" />
                Effacer
              </Button>
            )}
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-2 ml-auto">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/create">
                <PlusCircle className="h-4 w-4 mr-2" />
                Publier
              </Link>
            </Button>

            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-8 w-8 rounded-full"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={profile?.profile_picture_url}
                        alt={profile?.first_name || "User"}
                      />
                      <AvatarFallback>{getUserInitials()}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {profile?.first_name && profile?.last_name
                          ? `${profile.first_name} ${profile.last_name}`
                          : profile?.username || "Utilisateur"}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {profile?.email}
                      </p>
                      <div className="flex items-center gap-1 pt-1">
                        <Badge variant="secondary" className="text-xs">
                          {profile?.tokens || 0} tokens
                        </Badge>
                        {profile?.role !== "user" && (
                          <Badge variant="outline" className="text-xs">
                            {profile?.role}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profil</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Paramètres</span>
                    </Link>
                  </DropdownMenuItem>
                  {(profile?.role === "moderator" ||
                    profile?.role === "admin") && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Administration</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="cursor-pointer"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Déconnexion</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/auth/login">Connexion</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/auth/signup">S&apos;inscrire</Link>
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Advanced Filters Panel */}
        <Collapsible open={showFilters}>
          <CollapsibleContent>
            <div className="border-t border-muted/50 bg-muted/20 py-3">
              <Card>
                <CardContent className="p-3">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {/* Category Filter */}
                    <div className="space-y-1">
                      <Label className="text-xs">Catégorie</Label>
                      <Select
                        value={filters.category || "all"}
                        onValueChange={(value: string) =>
                          handleFilterChange({
                            ...filters,
                            category:
                              value === "all"
                                ? undefined
                                : (value as PostCategory),
                          })
                        }
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">
                            Toutes les catégories
                          </SelectItem>
                          {Object.entries(POST_CATEGORIES).map(
                            ([key, label]) => (
                              <SelectItem key={key} value={key}>
                                {String(label)}
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Type Filter */}
                    <div className="space-y-1">
                      <Label className="text-xs">Type</Label>
                      <Select
                        value={filters.type || "all"}
                        onValueChange={(value: string) =>
                          handleFilterChange({
                            ...filters,
                            type:
                              value === "all" ? undefined : (value as PostType),
                          })
                        }
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tous les types</SelectItem>
                          {Object.entries(POST_TYPES).map(([key, label]) => (
                            <SelectItem key={key} value={key}>
                              {String(label)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Sort Filter */}
                    <div className="space-y-1">
                      <Label className="text-xs">Trier par</Label>
                      <Select
                        value={filters.sortBy || "recent"}
                        onValueChange={(value) =>
                          handleFilterChange({
                            ...filters,
                            sortBy: value as "recent" | "popular" | "comments",
                          })
                        }
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="recent">Récent</SelectItem>
                          <SelectItem value="popular">Populaire</SelectItem>
                          <SelectItem value="comments">Commenté</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Tags */}
                    <div className="space-y-1">
                      <Label className="text-xs">Tags sélectionnés</Label>
                      <div className="flex flex-wrap gap-1 min-h-[32px] items-center">
                        {(filters.tags || []).length > 0 ? (
                          (filters.tags || []).map((tag) => (
                            <Badge
                              key={tag}
                              variant="secondary"
                              className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground text-xs h-5"
                              onClick={() => removeTagFilter(tag)}
                            >
                              {tag}
                              <X className="h-2 w-2 ml-1" />
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            Aucun tag
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Popular Tags */}
                  {popularTags.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <Label className="text-xs text-muted-foreground">
                        Tags populaires:
                      </Label>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {popularTags.slice(0, 12).map((tag) => (
                          <Badge
                            key={tag}
                            variant="outline"
                            className="cursor-pointer hover:bg-primary hover:text-primary-foreground text-xs h-5"
                            onClick={() => addTagFilter(tag)}
                          >
                            <Tag className="h-2 w-2 mr-1" />
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </header>
  );
}
