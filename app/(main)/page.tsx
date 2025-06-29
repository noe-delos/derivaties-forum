"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

import { PostsFeed } from "@/components/posts/posts-feed";
import { SearchFilters, PostCategory, PostType } from "@/lib/types";

export default function HomePage() {
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

    setSearchQuery(query);
    setSearchFilters({
      category: (category as PostCategory) || undefined,
      type: (type as PostType) || undefined,
      sortBy: sort as "recent" | "popular" | "comments",
    });
    setIsNaturalLanguage(nl);
  }, [searchParams]);

  return (
    <div className="space-y-6">
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
