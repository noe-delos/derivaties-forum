"use server";

import OpenAI from "openai";
import { getAdminSupabaseClient } from "../supabase/admin";
import {
  Post,
  PostCategory,
  PostType,
  SearchFilters,
  PaginatedResponse,
  POST_CATEGORIES,
  POST_TYPES,
} from "@/lib/types";

const ITEMS_PER_PAGE = 10;

// Initialize OpenAI client only if API key is available
let openai: OpenAI | null = null;
try {
  if (process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
} catch (error) {
  console.warn("OpenAI not available:", error);
}

interface SearchAnalysis {
  searchTerms: string[];
  categories: PostCategory[];
  types: PostType[];
  tags: string[];
  dateRange?: {
    from?: string;
    to?: string;
  };
  sortBy: "recent" | "popular" | "comments";
  confidence: number;
}

async function analyzeNaturalLanguageQuery(
  query: string
): Promise<SearchAnalysis> {
  console.log("🤖 Starting natural language analysis for query:", query);

  // If OpenAI is not available, return a basic analysis
  if (!openai) {
    console.warn("⚠️ OpenAI not configured, falling back to keyword search");
    const fallbackResult = {
      searchTerms: query.split(" ").filter((term) => term.length > 2),
      categories: [],
      types: [],
      tags: [],
      sortBy: "recent" as const,
      confidence: 0.5,
    };
    console.log("📝 Fallback analysis result:", fallbackResult);
    return fallbackResult;
  }

  try {
    console.log("🔄 Sending query to OpenAI for analysis...");
    const prompt = `Analyze this search query for a French derivatives/trading forum and extract search parameters:

Query: "${query}"

Context: This is a forum about finance, trading, internships, and careers in:
- Sales & Trading interviews
- School advice 
- Internships/Summer/Graduate programs
- Quantitative finance & Hedge funds

Available categories:
- entretien_sales_trading: Sales & Trading interviews
- conseils_ecole: School advice
- stage_summer_graduate: Internships/Summer/Graduate
- quant_hedge_funds: Quantitative & Hedge funds

Available post types:
- question: Questions
- retour_experience: Experience feedback
- transcript_entretien: Interview transcripts
- fichier_attache: Attached files

Extract and return ONLY a JSON object with these fields:
{
  "searchTerms": ["array", "of", "relevant", "keywords"],
  "categories": ["array_of_matching_category_keys"],
  "types": ["array_of_matching_type_keys"],
  "tags": ["array", "of", "relevant", "tags"],
  "dateRange": {"from": "YYYY-MM-DD", "to": "YYYY-MM-DD"} or null,
  "sortBy": "recent|popular|comments",
  "confidence": 0.0-1.0
}

Rules:
- Only include categories/types that match the query
- Extract meaningful search terms in both French and English
- Set sortBy based on query intent (popular for "best", recent for "latest", comments for "discussion")
- Return confidence score based on how well you understand the query
- If no specific date mentioned, leave dateRange null`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "You are a search query analyzer for a French trading forum. Return only valid JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 500,
    });

    const content = response.choices[0]?.message?.content?.trim();
    if (!content) {
      throw new Error("No response from OpenAI");
    }

    console.log("📨 Raw OpenAI response:", content);

    // Parse the JSON response
    const analysis = JSON.parse(content) as SearchAnalysis;
    console.log("🔍 Parsed analysis from OpenAI:", analysis);

    // Validate and sanitize the response
    const validatedResult = {
      searchTerms: Array.isArray(analysis.searchTerms)
        ? analysis.searchTerms.filter((term) => term.length > 1)
        : query.split(" ").filter((term) => term.length > 2),
      categories: Array.isArray(analysis.categories)
        ? analysis.categories.filter((cat) =>
            Object.keys(POST_CATEGORIES).includes(cat)
          )
        : [],
      types: Array.isArray(analysis.types)
        ? analysis.types.filter((type) =>
            Object.keys(POST_TYPES).includes(type)
          )
        : [],
      tags: Array.isArray(analysis.tags) ? analysis.tags : [],
      dateRange: analysis.dateRange || undefined,
      sortBy: ["recent", "popular", "comments"].includes(analysis.sortBy)
        ? analysis.sortBy
        : ("recent" as const),
      confidence:
        typeof analysis.confidence === "number"
          ? Math.max(0, Math.min(1, analysis.confidence))
          : 0.7,
    };

    console.log("✅ Final validated analysis result:", validatedResult);
    return validatedResult;
  } catch (error) {
    console.error("❌ Error analyzing natural language query:", error);
    // Fallback: treat as simple keyword search
    const fallbackResult = {
      searchTerms: query.split(" ").filter((term) => term.length > 2),
      categories: [],
      types: [],
      tags: [],
      sortBy: "recent" as const,
      confidence: 0.5,
    };
    console.log("📝 Error fallback analysis result:", fallbackResult);
    return fallbackResult;
  }
}

export async function enhancedSearchPosts({
  query,
  filters,
  pageParam = 0,
  isAuthenticated = false,
  isNaturalLanguage = false,
}: {
  query?: string;
  filters?: SearchFilters;
  pageParam?: number;
  isAuthenticated?: boolean;
  isNaturalLanguage?: boolean;
}): Promise<PaginatedResponse<Post> & { searchAnalysis?: SearchAnalysis }> {
  console.log("🔍 Starting enhanced search with params:", {
    query,
    filters,
    pageParam,
    isAuthenticated,
    isNaturalLanguage,
  });

  const supabase = getAdminSupabaseClient();

  const startIndex = pageParam * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE - 1;

  let searchAnalysis: SearchAnalysis | undefined;
  let effectiveFilters = filters || {};
  let searchTerms: string[] = [];

  // If natural language search is enabled and we have a query
  if (isNaturalLanguage && query) {
    console.log("🤖 Using natural language search mode");
    searchAnalysis = await analyzeNaturalLanguageQuery(query);

    // Merge AI analysis with existing filters (only if no explicit filters are set)
    effectiveFilters = {
      ...effectiveFilters,
      category:
        effectiveFilters.category ||
        (searchAnalysis.categories.length === 1
          ? searchAnalysis.categories[0]
          : undefined),
      type:
        effectiveFilters.type ||
        (searchAnalysis.types.length === 1
          ? searchAnalysis.types[0]
          : undefined),
      tags: effectiveFilters.tags?.length
        ? effectiveFilters.tags
        : searchAnalysis.tags,
      date_from: effectiveFilters.date_from || searchAnalysis.dateRange?.from,
      date_to: effectiveFilters.date_to || searchAnalysis.dateRange?.to,
      sortBy: effectiveFilters.sortBy || searchAnalysis.sortBy,
    };

    searchTerms = searchAnalysis.searchTerms;
    console.log("🔧 Effective filters after AI analysis:", effectiveFilters);
    console.log("🔤 Search terms extracted:", searchTerms);
  } else if (query) {
    console.log("🔤 Using keyword search mode");
    // Traditional keyword search - split query into meaningful terms
    searchTerms = query.split(" ").filter((term) => term.length > 2);
    console.log("🔤 Keyword search terms:", searchTerms);
  }

  console.log("🗃️ Building database query...");
  let dbQuery = supabase
    .from("posts")
    .select(
      `
      *,
      user:users!posts_user_id_fkey(
        id,
        first_name,
        last_name,
        username,
        profile_picture_url,
        role
      ),
      bank:banks!posts_bank_id_fkey(
        id,
        name,
        logo_url
      ),
      media:post_media(*),
      user_vote:votes!votes_post_id_fkey(vote_type)
    `,
      { count: "exact" }
    )
    .eq("status", "approved");

  // Apply search terms - search in title and content
  if (searchTerms.length > 0) {
    console.log("🔍 Applying search terms to query...");
    if (isNaturalLanguage && searchTerms.length > 1) {
      // For natural language, create a more intelligent search
      const titleConditions = searchTerms
        .map((term) => `title.ilike.%${term}%`)
        .join(",");
      const contentConditions = searchTerms
        .map((term) => `content.ilike.%${term}%`)
        .join(",");

      console.log("🧠 Natural language search conditions:", {
        titleConditions,
        contentConditions,
      });

      dbQuery = dbQuery.or(`or(${titleConditions}),or(${contentConditions})`);
    } else {
      // For keyword search, use simpler approach
      const searchTerm = searchTerms.join(" ");
      console.log("🔤 Keyword search term:", searchTerm);
      dbQuery = dbQuery.or(
        `title.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%`
      );
    }
  }

  // If not authenticated, only show public posts
  if (!isAuthenticated) {
    console.log("🔒 User not authenticated - filtering to public posts only");
    dbQuery = dbQuery.eq("is_public", true);
  }

  // Apply filters
  if (effectiveFilters.category) {
    console.log("📂 Applying category filter:", effectiveFilters.category);
    dbQuery = dbQuery.eq("category", effectiveFilters.category);
  }
  if (effectiveFilters.type) {
    console.log("📝 Applying type filter:", effectiveFilters.type);
    dbQuery = dbQuery.eq("type", effectiveFilters.type);
  }
  if (effectiveFilters.banks && effectiveFilters.banks.length > 0) {
    console.log("🏦 Applying banks filter:", effectiveFilters.banks);
    dbQuery = dbQuery.in("bank_id", effectiveFilters.banks);
  }
  if (effectiveFilters.tags && effectiveFilters.tags.length > 0) {
    console.log("🏷️ Applying tags filter:", effectiveFilters.tags);
    dbQuery = dbQuery.overlaps("tags", effectiveFilters.tags);
  }
  if (effectiveFilters.date_from) {
    console.log("📅 Applying date_from filter:", effectiveFilters.date_from);
    dbQuery = dbQuery.gte("created_at", effectiveFilters.date_from);
  }
  if (effectiveFilters.date_to) {
    console.log("📅 Applying date_to filter:", effectiveFilters.date_to);
    dbQuery = dbQuery.lte("created_at", effectiveFilters.date_to);
  }

  // Apply sorting
  console.log("🔄 Applying sort:", effectiveFilters.sortBy || "recent");
  if (effectiveFilters.sortBy === "popular") {
    dbQuery = dbQuery.order("upvotes", { ascending: false });
  } else if (effectiveFilters.sortBy === "comments") {
    dbQuery = dbQuery.order("comments_count", { ascending: false });
  } else {
    dbQuery = dbQuery.order("created_at", { ascending: false });
  }

  console.log("📄 Applying pagination:", { startIndex, endIndex });
  dbQuery = dbQuery.range(startIndex, endIndex);

  console.log("🚀 Executing database query...");
  const { data: posts, error, count } = await dbQuery;

  if (error) {
    console.error("❌ Database query error:", error);
    throw new Error(error.message);
  }

  console.log("✅ Search completed successfully:", {
    postsFound: posts?.length || 0,
    totalCount: count,
    hasNextPage: count && (pageParam + 1) * ITEMS_PER_PAGE < count,
  });

  // Serialize the data for safe client transfer
  const serializedData = JSON.parse(JSON.stringify(posts || []));

  return {
    data: serializedData,
    count: count || 0,
    nextPage:
      count && (pageParam + 1) * ITEMS_PER_PAGE < count
        ? pageParam + 1
        : undefined,
    searchAnalysis,
  };
}

export async function getSearchSuggestions(query: string): Promise<string[]> {
  if (!query || query.length < 2) {
    return [];
  }

  const supabase = getAdminSupabaseClient();

  try {
    // Get suggestions from post titles and tags
    const { data: titleSuggestions } = await supabase
      .from("posts")
      .select("title")
      .eq("status", "approved")
      .ilike("title", `%${query}%`)
      .limit(5);

    const { data: tagSuggestions } = await supabase
      .from("posts")
      .select("tags")
      .eq("status", "approved")
      .overlaps("tags", [query])
      .limit(5);

    const suggestions = new Set<string>();

    // Add title suggestions
    titleSuggestions?.forEach((post) => {
      const words = post.title.toLowerCase().split(/\s+/);
      words.forEach((word: string) => {
        if (word.includes(query.toLowerCase()) && word.length > 2) {
          suggestions.add(word);
        }
      });
    });

    // Add tag suggestions
    tagSuggestions?.forEach((post) => {
      post.tags?.forEach((tag: string) => {
        if (tag.toLowerCase().includes(query.toLowerCase())) {
          suggestions.add(tag);
        }
      });
    });

    return Array.from(suggestions).slice(0, 10);
  } catch (error) {
    console.error("Error getting search suggestions:", error);
    return [];
  }
}

export async function getPopularTags(limit = 20): Promise<string[]> {
  const supabase = getAdminSupabaseClient();

  try {
    const { data: posts } = await supabase
      .from("posts")
      .select("tags")
      .eq("status", "approved")
      .not("tags", "is", null);

    const tagCounts = new Map<string, number>();

    posts?.forEach((post) => {
      post.tags?.forEach((tag: string) => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      });
    });

    return Array.from(tagCounts.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([tag]) => tag);
  } catch (error) {
    console.error("Error getting popular tags:", error);
    return [];
  }
}

// Check if OpenAI is available
export async function isOpenAIAvailable(): Promise<boolean> {
  return !!openai;
}
