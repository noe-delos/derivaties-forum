"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

import { PostsFeed } from "@/components/posts/posts-feed";
import { SearchFiltersComponent } from "@/components/posts/search-filters";
import { SearchFilters, PostCategory, PostType } from "@/lib/types";

export default function HomePageContent() {
  const searchParams = useSearchParams();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({});
  const [isNaturalLanguage, setIsNaturalLanguage] = useState(false);

  // Initialize search state from URL params
  useEffect(() => {
    const query = searchParams.get("q") || "";
    const category = searchParams.get("category");
    const type = searchParams.get("type");
    const sort = searchParams.get("sort") || "recent";
    const nl = searchParams.get("nl") === "true";
    const banksParam = searchParams.get("banks");

    setSearchQuery(query);
    setSearchFilters({
      category: (category as PostCategory) || undefined,
      type: (type as PostType) || undefined,
      banks: banksParam ? banksParam.split(",") : undefined,
      sortBy: sort as "recent" | "popular" | "comments",
    });
    setIsNaturalLanguage(nl);
  }, [searchParams]);

  const handleSearch = (
    query: string,
    filters: SearchFilters,
    isNaturalLanguage: boolean
  ) => {
    setSearchQuery(query);
    setSearchFilters(filters);
    setIsNaturalLanguage(isNaturalLanguage);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 space-y-6 pt-10">
      {/* Search and Filters as one row */}
      <SearchFiltersComponent onSearch={handleSearch} />

      {/* Posts Feed */}
      <PostsFeed
        category={searchFilters.category}
        filters={searchFilters}
        searchQuery={searchQuery}
        isNaturalLanguage={isNaturalLanguage}
        className="space-y-4"
      />
    </div>
  );
}