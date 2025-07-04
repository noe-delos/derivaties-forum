/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/no-unescaped-entities */
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
import {
  Search,
  Filter,
  Sparkles,
  Loader2,
  X,
  Calendar,
  Tag,
  SortAsc,
  AlertCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

import { PostCard } from "@/components/posts/post-card";
import { PostSkeleton } from "@/components/posts/post-skeleton";
import {
  enhancedSearchPosts,
  getPopularTags,
  isOpenAIAvailable,
} from "@/lib/services/search";
import { SearchFilters, POST_CATEGORIES, POST_TYPES } from "@/lib/types";
import { useAuth } from "@/lib/providers/auth-provider";

interface SearchInterfaceProps {
  initialQuery?: string;
  initialFilters?: SearchFilters;
  initialNaturalLanguage?: boolean;
  isAuthenticated: boolean;
}

export function SearchInterface({
  initialQuery = "",
  initialFilters = {},
  initialNaturalLanguage = false,
  isAuthenticated,
}: SearchInterfaceProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { profile } = useAuth();

  const [query, setQuery] = useState(initialQuery);
  const [filters, setFilters] = useState<SearchFilters>(initialFilters);
  const [isNaturalLanguage, setIsNaturalLanguage] = useState(
    initialNaturalLanguage
  );
  const [showFilters, setShowFilters] = useState(false);
  const [searchAnalysisVisible, setSearchAnalysisVisible] = useState(false);
  const [openAIAvailable, setOpenAIAvailable] = useState(true);

  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: "100px",
  });

  // Check if OpenAI is available on component mount
  useEffect(() => {
    // This would normally be done server-side, but for demo purposes
    // we'll assume it's available unless there's an error
    setOpenAIAvailable(true);
  }, []);

  // Get popular tags
  const { data: popularTags = [] }: any = useQuery({
    queryKey: ["popular-tags"],
    queryFn: getPopularTags as any,
  });

  // Search results
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["search", query, filters, isAuthenticated, isNaturalLanguage],
    queryFn: ({ pageParam = 0 }) =>
      enhancedSearchPosts({
        query: query || undefined,
        filters,
        pageParam,
        isAuthenticated,
        isNaturalLanguage,
      }),
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
    enabled: !!query || Object.keys(filters).length > 0,
  });

  const posts = data?.pages.flatMap((page) => page.data) ?? [];
  const searchAnalysis = data?.pages[0]?.searchAnalysis;

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleSearch = (searchQuery: string) => {
    setQuery(searchQuery);
    updateURL(searchQuery, filters, isNaturalLanguage);
  };

  const handleFilterChange = (newFilters: SearchFilters) => {
    setFilters(newFilters);
    updateURL(query, newFilters, isNaturalLanguage);
  };

  const handleNaturalLanguageToggle = (enabled: boolean) => {
    setIsNaturalLanguage(enabled);
    updateURL(query, filters, enabled);
  };

  const updateURL = (q: string, f: SearchFilters, nl: boolean) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (f.category) params.set("category", f.category);
    if (f.type) params.set("type", f.type);
    if (f.sortBy && f.sortBy !== "recent") params.set("sort", f.sortBy);
    if (nl) params.set("nl", "true");

    const url = `/forum/search${
      params.toString() ? `?${params.toString()}` : ""
    }`;
    router.push(url);
  };

  const clearFilters = () => {
    setFilters({});
    setQuery("");
    setIsNaturalLanguage(false);
    router.push("/forum/search");
  };

  const addTagFilter = (tag: string) => {
    const currentTags = filters.tags || [];
    if (!currentTags.includes(tag)) {
      handleFilterChange({ ...filters, tags: [...currentTags, tag] });
    }
  };

  const removeTagFilter = (tag: string) => {
    const currentTags = filters.tags || [];
    handleFilterChange({
      ...filters,
      tags: currentTags.filter((t) => t !== tag),
    });
  };

  const hasActiveFilters = Object.keys(filters).some((key) => {
    const value = filters[key as keyof SearchFilters];
    return Array.isArray(value) ? value.length > 0 : !!value;
  });

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">Recherche</h1>
          <div className="flex items-center space-x-2">
            <Sparkles className="h-4 w-4" />
            <Label htmlFor="natural-language" className="text-sm">
              Recherche naturelle
            </Label>
            <Switch
              id="natural-language"
              checked={isNaturalLanguage}
              onCheckedChange={handleNaturalLanguageToggle}
            />
          </div>
        </div>

        {/* OpenAI Not Available Notice */}
        {isNaturalLanguage && !openAIAvailable && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              La recherche naturelle n'est pas disponible. Veuillez configurer
              votre clé API OpenAI ou utilisez la recherche par mots-clés.
            </AlertDescription>
          </Alert>
        )}

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="search"
            placeholder={
              isNaturalLanguage
                ? "Décrivez ce que vous cherchez... ex: 'Quels sont les meilleurs conseils pour un entretien chez Goldman Sachs ?'"
                : "Rechercher par mots-clés..."
            }
            className="pl-10 pr-12 h-12 text-base"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSearch(query);
              }
            }}
          />
          <Button
            size="sm"
            className="absolute right-2 top-1/2 transform -translate-y-1/2"
            onClick={() => handleSearch(query)}
          >
            Rechercher
          </Button>
        </div>

        {/* Natural Language Analysis */}
        <AnimatePresence>
          {isNaturalLanguage &&
            searchAnalysis &&
            searchAnalysis.confidence > 0.6 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200 dark:from-purple-950/20 dark:to-blue-950/20">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-purple-600" />
                        <span className="text-sm font-medium">Analyse IA</span>
                        <Badge variant="secondary" className="text-xs">
                          {Math.round(searchAnalysis.confidence * 100)}%
                          confiance
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setSearchAnalysisVisible(!searchAnalysisVisible)
                        }
                      >
                        {searchAnalysisVisible ? "Masquer" : "Voir détails"}
                      </Button>
                    </div>
                    <Collapsible open={searchAnalysisVisible}>
                      <CollapsibleContent className="mt-3 space-y-2">
                        {searchAnalysis.searchTerms.length > 0 && (
                          <div>
                            <span className="text-xs text-muted-foreground">
                              Mots-clés détectés:
                            </span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {searchAnalysis.searchTerms.map((term, i) => (
                                <Badge
                                  key={i}
                                  variant="outline"
                                  className="text-xs"
                                >
                                  {term}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        {searchAnalysis.categories.length > 0 && (
                          <div>
                            <span className="text-xs text-muted-foreground">
                              Catégories suggérées:
                            </span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {searchAnalysis.categories.map((cat, i) => (
                                <Badge
                                  key={i}
                                  variant="secondary"
                                  className="text-xs"
                                >
                                  {POST_CATEGORIES[cat]}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </CollapsibleContent>
                    </Collapsible>
                  </CardContent>
                </Card>
              </motion.div>
            )}
        </AnimatePresence>

        {/* Filters Toggle */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2"
          >
            <Filter className="h-4 w-4" />
            Filtres
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-1">
                {
                  Object.keys(filters).filter((key) => {
                    const value = filters[key as keyof SearchFilters];
                    return Array.isArray(value) ? value.length > 0 : !!value;
                  }).length
                }
              </Badge>
            )}
          </Button>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="gap-2"
            >
              <X className="h-4 w-4" />
              Effacer les filtres
            </Button>
          )}
        </div>
      </div>

      {/* Advanced Filters */}
      <Collapsible open={showFilters}>
        <CollapsibleContent>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filtres avancés</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Category Filter */}
                <div className="space-y-2">
                  <Label>Catégorie</Label>
                  <Select
                    value={filters.category || ""}
                    onValueChange={(value) =>
                      handleFilterChange({
                        ...filters,
                        category: (value || undefined) as any,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Toutes les catégories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Toutes les catégories</SelectItem>
                      {Object.entries(POST_CATEGORIES).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label as any}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Type Filter */}
                <div className="space-y-2">
                  <Label>Type de publication</Label>
                  <Select
                    value={filters.type || ""}
                    onValueChange={(value) =>
                      handleFilterChange({
                        ...filters,
                        type: (value || undefined) as any,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Tous les types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Tous les types</SelectItem>
                      {Object.entries(POST_TYPES).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label as any}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Sort Filter */}
                <div className="space-y-2">
                  <Label>Trier par</Label>
                  <Select
                    value={filters.sortBy || "recent"}
                    onValueChange={(value) =>
                      handleFilterChange({
                        ...filters,
                        sortBy: value as any,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recent">Plus récent</SelectItem>
                      <SelectItem value="popular">Plus populaire</SelectItem>
                      <SelectItem value="comments">Plus commenté</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label>Tags sélectionnés</Label>
                {(filters.tags || []).length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {(filters.tags || []).map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => removeTagFilter(tag)}
                      >
                        {tag}
                        <X className="h-3 w-3 ml-1" />
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Aucun tag sélectionné
                  </p>
                )}
              </div>

              {/* Popular Tags */}
              <div className="space-y-2">
                <Label>Tags populaires</Label>
                <div className="flex flex-wrap gap-2">
                  {popularTags.slice(0, 15).map((tag: any) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                      onClick={() => addTagFilter(tag)}
                    >
                      <Tag className="h-3 w-3 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>

      {/* Search Results */}
      <div className="space-y-4">
        {query || hasActiveFilters ? (
          <>
            {/* Results Header */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {data?.pages[0]?.count ? (
                  <>
                    {data.pages[0].count} résultat
                    {data.pages[0].count > 1 ? "s" : ""} trouvé
                    {data.pages[0].count > 1 ? "s" : ""}
                    {query && <> pour "{query}"</>}
                  </>
                ) : (
                  "Recherche en cours..."
                )}
              </p>
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <PostSkeleton key={i} />
                ))}
              </div>
            )}

            {/* Error State */}
            {error && (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-destructive">
                    Une erreur s'est produite lors de la recherche.
                  </p>
                  <Button
                    variant="outline"
                    className="mt-2"
                    onClick={() => refetch()}
                  >
                    Réessayer
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* No Results */}
            {!isLoading && !error && posts.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="space-y-4">
                    <Search className="h-12 w-12 text-muted-foreground mx-auto" />
                    <div>
                      <h3 className="text-lg font-semibold">
                        Aucun résultat trouvé
                      </h3>
                      <p className="text-muted-foreground">
                        Essayez de modifier votre recherche ou vos filtres.
                      </p>
                    </div>
                    {isNaturalLanguage && (
                      <div className="text-sm text-muted-foreground">
                        <p>
                          Suggestions pour améliorer votre recherche naturelle :
                        </p>
                        <ul className="mt-2 space-y-1">
                          <li>• Soyez plus spécifique dans votre question</li>
                          <li>
                            • Utilisez des termes liés à la finance ou aux
                            entretiens
                          </li>
                          <li>• Essayez de poser une question complète</li>
                        </ul>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Results */}
            {posts.length > 0 && (
              <div className="space-y-4">
                {posts.map((post, index) => {
                  const shouldBlur = !isAuthenticated && !post.is_public;
                  return (
                    <motion.div
                      key={post.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.4,
                        delay: index * 0.05,
                        ease: "easeOut",
                      }}
                    >
                      <PostCard
                        post={post}
                        isBlurred={shouldBlur}
                        showActions={isAuthenticated || post.is_public}
                        isAuthenticated={isAuthenticated}
                        profile={profile}
                      />
                    </motion.div>
                  );
                })}

                {/* Infinite scroll trigger */}
                <div ref={ref} className="flex justify-center py-4">
                  {isFetchingNextPage && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Chargement...</span>
                    </div>
                  )}
                </div>

                {/* End of results */}
                {!hasNextPage && posts.length > 0 && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground text-sm">
                      Fin des résultats de recherche
                    </p>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          /* Empty State */
          <Card>
            <CardContent className="p-8 text-center">
              <div className="space-y-4">
                <Search className="h-16 w-16 text-muted-foreground mx-auto" />
                <div>
                  <h3 className="text-xl font-semibold">
                    Recherchez dans le forum
                  </h3>
                  <p className="text-muted-foreground mt-2">
                    Utilisez la recherche par mots-clés ou activez la recherche
                    naturelle pour poser des questions en langage naturel.
                  </p>
                </div>

                {/* Popular Tags as Suggestions */}
                {popularTags.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Tags populaires :</p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {popularTags.slice(0, 10).map((tag: any) => (
                        <Badge
                          key={tag}
                          variant="outline"
                          className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                          onClick={() => {
                            addTagFilter(tag);
                            setShowFilters(true);
                          }}
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
