"use server";

import OpenAI from "openai";
import { POST_CATEGORIES, POST_TYPES } from "@/lib/types";

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

interface TagGenerationParams {
  title: string;
  category: string;
  bankName?: string;
  type?: string;
}

export async function generateTags({
  title,
  category,
  bankName,
  type,
}: TagGenerationParams): Promise<string[]> {
  console.log("🏷️ Starting AI tag generation for:", { title, category, bankName, type });

  // If OpenAI is not available, return fallback tags
  if (!openai) {
    console.warn("⚠️ OpenAI not configured, falling back to basic tags");
    return generateFallbackTags({ title, category, bankName, type });
  }

  try {
    console.log("🔄 Sending request to OpenAI for tag generation...");
    const prompt = `Generate relevant tags for a French finance forum post with these details:

Title: "${title}"
Category: ${POST_CATEGORIES[category as keyof typeof POST_CATEGORIES] || category}
${bankName ? `Bank: ${bankName}` : ''}
${type ? `Type: ${POST_TYPES[type as keyof typeof POST_TYPES] || type}` : ''}

Context: This is a forum about finance interviews, trading, internships, and banking careers. Posts are primarily about:
- Interview experiences and preparation
- Banking industry insights
- Career advice
- Academic guidance
- Job applications and processes

Generate 3-5 relevant tags that would help users find this content. Tags should be:
- In French
- Relevant to finance/banking/interviews
- Specific but searchable
- Professional terminology when appropriate

Common tag categories:
- Interview types: "entretien-technique", "entretien-comportemental", "case-study", "assessment-center"
- Job types: "stage", "graduate-program", "cdi", "summer-internship", "off-cycle"
- Skills: "finance-corporate", "sales-trading", "quantitative", "risk-management", "m-a"
- Preparation: "preparation-entretien", "cv-optimisation", "motivation", "networking"
- Banks: Use bank name if relevant like "goldman-sachs", "bnp-paribas", etc.
- General: "conseils", "experience", "retour", "questions-frequentes"

Return ONLY a JSON array of 3-5 tag strings. No explanations.

Example: ["entretien-sales-trading", "goldman-sachs", "preparation", "case-study", "stage-ete"]`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a tag generator for a French finance forum. Return only a JSON array of relevant tags.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 150,
    });

    const content = response.choices[0]?.message?.content?.trim();
    if (!content) {
      throw new Error("No response from OpenAI");
    }

    console.log("📨 Raw OpenAI response:", content);

    // Parse the JSON response
    const tags = JSON.parse(content) as string[];
    console.log("🏷️ Parsed tags from OpenAI:", tags);

    // Validate and clean tags
    const validatedTags = tags
      .filter((tag) => typeof tag === "string" && tag.length > 1)
      .map((tag) => tag.toLowerCase().trim())
      .slice(0, 5); // Limit to 5 tags

    console.log("✅ Final validated tags:", validatedTags);
    return validatedTags;
  } catch (error) {
    console.error("❌ Error generating tags with AI:", error);
    // Fallback to basic tag generation
    return generateFallbackTags({ title, category, bankName, type });
  }
}

function generateFallbackTags({
  title,
  category,
  bankName,
  type,
}: TagGenerationParams): string[] {
  const tags: string[] = [];
  
  // Add category-based tag
  if (category === "entretien_sales_trading") {
    tags.push("entretien-sales-trading");
  } else if (category === "conseils_ecole") {
    tags.push("conseils-ecole");
  } else if (category === "stage_summer_graduate") {
    tags.push("stage");
  } else if (category === "quant_hedge_funds") {
    tags.push("quantitative");
  }

  // Add bank-based tag
  if (bankName) {
    const bankTag = bankName.toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
    tags.push(bankTag);
  }

  // Add type-based tag
  if (type === "transcript_entretien") {
    tags.push("transcript");
  } else if (type === "retour_experience") {
    tags.push("experience");
  } else if (type === "question") {
    tags.push("question");
  }

  // Add general tags based on title keywords
  const titleLower = title.toLowerCase();
  if (titleLower.includes("entretien")) tags.push("entretien");
  if (titleLower.includes("stage")) tags.push("stage");
  if (titleLower.includes("conseil")) tags.push("conseils");
  if (titleLower.includes("preparation") || titleLower.includes("prep")) tags.push("preparation");

  // Ensure at least 2 tags
  if (tags.length < 2) {
    tags.push("finance", "carriere");
  }

  console.log("📝 Fallback tags generated:", tags.slice(0, 4));
  return tags.slice(0, 4);
}

// Check if OpenAI is available
export async function isAITagGenerationAvailable(): Promise<boolean> {
  return !!openai;
}