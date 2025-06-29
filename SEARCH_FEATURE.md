# Search Feature Documentation

## Overview

The search feature provides both traditional keyword search and AI-powered natural language search capabilities for the derivatives forum.

## Features

### 1. Keyword Search

- Search through post titles, content, and tags
- Basic filtering by category, type, and sorting options
- Infinite scroll for results

### 2. Natural Language Search (AI-Powered)

- Uses OpenAI GPT-3.5-turbo to analyze natural language queries
- Automatically extracts relevant keywords, categories, and filters
- Provides confidence scoring for analysis quality
- Shows detected search terms and suggested categories

### 3. Advanced Filters

- **Category filtering**: Filter by post categories (Sales & Trading, School Advice, etc.)
- **Type filtering**: Filter by post types (Questions, Experience feedback, etc.)
- **Tag filtering**: Add/remove tags to narrow search results
- **Sorting options**: Sort by recent, popular, or most commented
- **Popular tags**: Quick access to trending tags

## Setup Instructions

### 1. Environment Variables

To enable natural language search, add your OpenAI API key to your environment:

```bash
# .env or .env.local
OPENAI_API_KEY=your_openai_api_key_here
```

### 2. Required Dependencies

The following packages are required and should already be installed:

```json
{
  "openai": "^4.x.x",
  "@radix-ui/react-collapsible": "^1.x.x"
}
```

### 3. Database Requirements

The search feature uses the existing database schema. Ensure you have:

- Posts table with `title`, `content`, `tags`, `category`, `type` columns
- Proper indexing on searchable fields (already included in migrations.sql)

## Usage

### From Header Search

Users can search from the header search bar, which will redirect to `/search` with the query parameter.

### Direct Search Page

Navigate to `/search` for the full search interface with filters and natural language toggle.

### Natural Language Examples

When natural language search is enabled, users can ask questions like:

- "Quels sont les meilleurs conseils pour un entretien chez Goldman Sachs ?"
- "Comment préparer un summer internship en trading ?"
- "Retours d'expérience sur les écoles de commerce"

The AI will analyze these queries and automatically:

- Extract relevant keywords
- Suggest appropriate categories
- Set optimal sorting preferences
- Show confidence in the analysis

## API Endpoints

### Search Service Functions

1. **`enhancedSearchPosts()`** - Main search function with AI analysis
2. **`getPopularTags()`** - Retrieve trending tags
3. **`getSearchSuggestions()`** - Get search suggestions (future feature)
4. **`isOpenAIAvailable()`** - Check if OpenAI is configured

## Components Structure

```
components/
  search/
    search-interface.tsx    # Main search interface
lib/
  services/
    search.ts              # Search service with AI integration
app/
  (main)/
    search/
      page.tsx             # Search page server component
```

## Fallback Behavior

If OpenAI is not configured:

- Natural language toggle still appears but shows a warning
- Queries fall back to keyword search
- No AI analysis is performed
- Standard filtering and sorting still work

## Performance Considerations

- Search results are paginated (10 items per page)
- Infinite scroll for smooth user experience
- Results are cached using React Query
- AI analysis is cached per query

## Future Enhancements

1. **Search Suggestions**: Auto-complete based on popular searches
2. **Saved Searches**: Allow users to save and re-run searches
3. **Search Analytics**: Track popular search terms
4. **Enhanced AI**: Use embeddings for semantic search
5. **Search Filters Persistence**: Remember user filter preferences

## Troubleshooting

### Natural Language Search Not Working

1. Check if `OPENAI_API_KEY` is set in environment
2. Verify OpenAI API quota and billing
3. Check browser console for API errors

### No Search Results

1. Verify database has approved posts
2. Check if posts are marked as public (for anonymous users)
3. Ensure search terms match existing content

### Performance Issues

1. Check database indexes on search fields
2. Monitor API response times
3. Consider implementing search result caching
