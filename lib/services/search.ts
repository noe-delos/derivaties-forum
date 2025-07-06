"use server";

import OpenAI from "openai";
import { getAdminSupabaseClient } from "../supabase/admin";
import { fetchBanks } from "./banks";
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

// Bank name mapping cache
let bankCache: { name: string; id: string }[] | null = null;

async function getBankIdsByNames(bankNames: string[]): Promise<string[]> {
  if (!bankCache) {
    try {
      const banks = await fetchBanks();
      bankCache = banks.map(bank => ({ name: bank.name, id: bank.id }));
    } catch (error) {
      console.error("Error fetching banks for name mapping:", error);
      return [];
    }
  }

  const bankIds: string[] = [];
  
  for (const bankName of bankNames) {
    const bank = bankCache.find(b => 
      b.name.toLowerCase() === bankName.toLowerCase() ||
      b.name.toLowerCase().includes(bankName.toLowerCase()) ||
      bankName.toLowerCase().includes(b.name.toLowerCase())
    );
    
    if (bank) {
      bankIds.push(bank.id);
    } else {
      console.warn(`Bank not found in database: ${bankName}`);
    }
  }
  
  return bankIds;
}

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
  cities: string[];
  banks: string[];
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
      cities: [],
      banks: [],
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
- Sales & Trading interviews and processes
- School advice and university guidance
- Internships/Summer/Graduate programs and applications
- Quantitative finance & Hedge funds careers
- Banking industry insights and networking

IMPORTANT: This forum primarily contains INTERVIEW content (entretiens) for various banks and financial institutions.

Available categories:
- entretien_sales_trading: Sales & Trading interviews (includes interview questions, prep, experiences)
- conseils_ecole: School advice (university choices, courses, academic guidance)
- stage_summer_graduate: Internships/Summer/Graduate (applications, experiences, programs)
- quant_hedge_funds: Quantitative & Hedge funds (quant roles, hedge fund careers, math finance)

Available post types:
- question: Questions (seeking advice, asking for help)
- retour_experience: Experience feedback (sharing experiences, testimonials)
- transcript_entretien: Interview transcripts (actual interview Q&A, prep materials)
- fichier_attache: Attached files (documents, resources, materials)

Available banks in database (use EXACT names):
- Goldman Sachs
- Rothschild & Co  
- Société Générale
- BNP Paribas
- Crédit Agricole
- Crédit Mutuel

Common cities: Paris, Londres, New York, Hong Kong, Singapour, Dubaï, Francfort, Tokyo, Zurich, Toronto

Extract and return ONLY a JSON object with these fields:
{
  "searchTerms": ["array", "of", "relevant", "keywords", "excluding", "detected", "banks"],
  "categories": ["array_of_matching_category_keys"],
  "types": ["array_of_matching_type_keys"],
  "tags": ["relevant", "tags", "from", "finance", "domain"],
  "cities": ["detected", "city", "names"],
  "banks": ["exact", "bank", "names", "from", "database", "list"],
  "dateRange": {"from": "YYYY-MM-DD", "to": "YYYY-MM-DD"} or null,
  "sortBy": "recent|popular|comments",
  "confidence": 0.0-1.0
}

CRITICAL Bank Detection Rules:
- When "entretiens de [bank]" or "entretiens chez [bank]" is mentioned → focus on bank filtering, be flexible with categories
- When user asks for "trucs de [bank]" or "donne moi des [anything] de [bank]" → assume they want interview content for that bank
- When user says "je veux passer des entretiens en finance" → leave banks empty to show all interview content
- Map common bank aliases to exact names:
  * "Goldman" or "GS" → "Goldman Sachs"
  * "SocGen" or "Société Générale" or "Societe Generale" → "Société Générale"
  * "BNP" → "BNP Paribas"
  * "Rothschild" → "Rothschild & Co"
  * "Crédit Ag" → "Crédit Agricole"
- When a specific bank is mentioned:
  * Include ONLY that bank in "banks" array
  * Remove bank names from searchTerms to avoid keyword conflicts
  * For generic requests like "trucs" or "infos", automatically include interview-related categories (entretien_sales_trading)
  * Leave "tags" empty to allow broader matching
  * Set higher confidence (0.8+) when specific banks are detected
- Prioritize bank-specific content over strict categorization
- For vague requests about a bank, assume user wants interview experiences and transcripts

Enhanced Rules:
- Extract ALL relevant keywords EXCEPT detected bank names
- Detect implicit categories (e.g., "entretien Goldman" → entretien_sales_trading + banks: ["Goldman Sachs"])
- Recognize synonyms (stage=internship, école=university, conseil=advice)
- Identify financial jargon (M&A, IBD, S&T, quant, hedge fund, PE, VC)
- Parse temporal expressions ("cette année", "2024", "recent")
- Set appropriate sortBy: "popular" for "meilleur/best", "recent" for "récent/latest", "comments" for "discussion/débat"
- When banks are specified, focus results on that bank only
- Include cities if mentioned or implied

French Query Understanding:
- "je veux passer des entretiens en [field]" → show all interview content, optionally filter by field
- "donne moi des trucs/infos/conseils de [bank]" → banks: ["bank"], categories: ["entretien_sales_trading"]
- "comment se préparer pour [bank]" → banks: ["bank"], categories: ["entretien_sales_trading"], types: ["question", "transcript_entretien"]
- Generic requests about banks should default to interview content since that's the primary content
- Be flexible with colloquial French (trucs, infos, etc.) and understand they usually mean interview-related content`;

    const response = await openai.chat.completions.create({
      model: "gpt-4.1",
      messages: [
        {
          role: "system",
          content:
            "You are a search query analyzer for a French trading forum focused on finance interviews. This forum primarily contains interview experiences, questions, and transcripts for major banks. When users ask about a bank, they typically want interview content. Return only valid JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3,
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
      cities: Array.isArray(analysis.cities) ? analysis.cities : [],
      banks: Array.isArray(analysis.banks) ? analysis.banks : [],
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
      cities: [],
      banks: [],
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

    // Convert bank names to bank IDs
    let bankIds: string[] = [];
    if (searchAnalysis.banks && searchAnalysis.banks.length > 0) {
      bankIds = await getBankIdsByNames(searchAnalysis.banks);
      console.log("🏦 Converted bank names to IDs:", { 
        names: searchAnalysis.banks, 
        ids: bankIds 
      });
    }

    // Merge AI analysis with existing filters (only if no explicit filters are set)
    // Special handling: If specific banks are detected, prioritize bank filtering and be more flexible with other filters
    const hasBankSpecified = bankIds.length > 0;
    
    // If a bank is specified with generic terms, automatically include interview category
    const hasGenericTermsWithBank = hasBankSpecified && searchAnalysis.searchTerms.some(term => 
      ["trucs", "infos", "conseils", "prep", "preparation"].includes(term.toLowerCase())
    );
    
    effectiveFilters = {
      ...effectiveFilters,
      category:
        effectiveFilters.category ||
        // If bank + generic terms, default to interview category
        (hasGenericTermsWithBank ? "entretien_sales_trading" :
         // Otherwise, only apply category filter if no specific bank mentioned, or if category is very confident
         (!hasBankSpecified && searchAnalysis.categories.length === 1
           ? searchAnalysis.categories[0]
           : searchAnalysis.categories.length === 1 ? searchAnalysis.categories[0] : undefined)),
      type:
        effectiveFilters.type ||
        (searchAnalysis.types.length === 1
          ? searchAnalysis.types[0]
          : undefined),
      // Don't apply tag filters when a specific bank is mentioned - let the bank filter do the work
      tags: effectiveFilters.tags?.length
        ? effectiveFilters.tags
        : (hasBankSpecified ? [] : searchAnalysis.tags),
      cities: effectiveFilters.cities?.length
        ? effectiveFilters.cities
        : searchAnalysis.cities,
      banks: effectiveFilters.banks?.length
        ? effectiveFilters.banks
        : bankIds, // Use converted bank IDs
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
      user_vote:votes!votes_post_id_fkey(vote_type),
      selected_correction:corrections!corrections_post_id_fkey(
        id,
        content,
        status,
        is_selected,
        tokens_awarded,
        created_at,
        user:users!corrections_user_id_fkey(
          id,
          username,
          first_name,
          last_name,
          profile_picture_url,
          role
        )
      )
    `,
      { count: "exact" }
    )
    .eq("status", "approved");

  // Apply search terms - search in title and content
  // Special handling: If bank is specified and search terms are generic (like "entretiens"), make text search optional
  const hasBankFilter = effectiveFilters.banks && effectiveFilters.banks.length > 0;
  const hasGenericSearchTerms = searchTerms.length <= 2 && 
    searchTerms.some(term => 
      ["entretiens", "entretien", "stages", "stage", "trucs", "infos", "conseils", "prep", "preparation"].includes(term.toLowerCase())
    );
  
  if (searchTerms.length > 0 && !(hasBankFilter && hasGenericSearchTerms)) {
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
  } else if (hasBankFilter && hasGenericSearchTerms) {
    console.log("🏦 Bank-specific search: skipping generic search term matching for broader results");
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
  if (effectiveFilters.cities && effectiveFilters.cities.length > 0) {
    console.log("🏙️ Applying cities filter:", effectiveFilters.cities);
    dbQuery = dbQuery.in("city", effectiveFilters.cities);
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

  // Process posts to add corrected flag based on approved corrections
  const processedPosts = (posts || []).map(post => ({
    ...post,
    corrected: post.selected_correction && post.selected_correction.some((c: any) => c.status === 'approved')
  }));

  // Serialize the data for safe client transfer
  const serializedData = JSON.parse(JSON.stringify(processedPosts));

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
