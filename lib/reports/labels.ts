const SCORE_LABELS: Record<string, string> = {
  ai_citability: "AI Citability",
  brand_authority: "Brand Authority",
  content_eeat: "Content E-E-A-T",
  technical: "Technical",
  schema: "Schema",
  platform_optimization: "Platform Optimization",
};

const SCORE_LABELS_PDF: Record<string, string> = {
  ai_citability: "AI Citability & Visibility",
  brand_authority: "Brand Authority Signals",
  content_eeat: "Content Quality & E-E-A-T",
  technical: "Technical GEO",
  schema: "Structured Data",
  platform_optimization: "Platform Optimization",
};

const SCORE_WEIGHTS: Record<string, string> = {
  ai_citability: "25%",
  brand_authority: "20%",
  content_eeat: "20%",
  technical: "15%",
  schema: "10%",
  platform_optimization: "10%",
};

const SCORE_DESCRIPTIONS: Record<string, string> = {
  ai_citability:
    "Measures how likely your content is to be quoted in AI answers — citation-ready passages, crawler access, and llms.txt guidance.",
  brand_authority:
    "Tracks entity signals AI models use to trust a brand: Wikipedia/Wikidata presence, press mentions, and authoritative third-party references.",
  content_eeat:
    "Evaluates expertise, experience, authoritativeness, and trustworthiness — author credentials, factual depth, and transparent sourcing.",
  technical:
    "Covers technical foundations for AI crawlers: indexability, page speed risks, mobile readiness, security headers, and server-rendered content.",
  schema:
    "Assesses structured data (JSON-LD) that helps AI systems understand your organisation, people, products, and page topics.",
  platform_optimization:
    "Aggregates readiness patterns shared across major AI search surfaces — direct answers, entity links, and platform-specific signals.",
};

const PLATFORM_LABELS: Record<string, string> = {
  bing_copilot: "Bing Copilot",
  google_gemini: "Google Gemini",
  perplexity_ai: "Perplexity AI",
  chatgpt_web_search: "ChatGPT Web Search",
  google_ai_overviews: "Google AI Overviews",
};

const PLATFORM_DESCRIPTIONS: Record<string, string> = {
  google_ai_overviews:
    "How well your site is structured to appear as a source in Google's AI-generated search overviews.",
  chatgpt_web_search:
    "Readiness for ChatGPT web search — entity recognition, factual citable statements, and OAI-SearchBot access.",
  perplexity_ai:
    "Likelihood of being cited in Perplexity answers, including community validation and direct, authoritative source pages.",
  google_gemini:
    "Optimization for Google Gemini — clear topical structure, trustworthy content, and strong entity signals.",
  bing_copilot:
    "Readiness for Microsoft Copilot and Bing AI answers, including crawl access and well-structured source content.",
};

/** Preferred display order for score and platform sections. */
export const SCORE_KEYS = [
  "ai_citability",
  "brand_authority",
  "content_eeat",
  "technical",
  "schema",
  "platform_optimization",
] as const;

export const PLATFORM_KEYS = [
  "google_ai_overviews",
  "chatgpt_web_search",
  "perplexity_ai",
  "google_gemini",
  "bing_copilot",
] as const;

function titleCaseWords(value: string): string {
  return value
    .split(/[\s_]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export function formatScoreLabel(key: string, variant: "web" | "pdf" = "web"): string {
  const labels = variant === "pdf" ? SCORE_LABELS_PDF : SCORE_LABELS;
  return labels[key] ?? titleCaseWords(key);
}

export function formatScoreWeight(key: string): string {
  return SCORE_WEIGHTS[key] ?? "—";
}

export function formatScoreDescription(key: string): string {
  return (
    SCORE_DESCRIPTIONS[key] ??
    "Contributes to the overall GEO score based on automated analysis of your site."
  );
}

export function formatPlatformName(key: string): string {
  return PLATFORM_LABELS[key] ?? titleCaseWords(key);
}

export function formatPlatformDescription(key: string): string {
  return (
    PLATFORM_DESCRIPTIONS[key] ??
    "Estimated visibility and citation readiness on this AI search platform."
  );
}

export function formatSeverity(severity: "critical" | "high" | "medium"): string {
  return severity.charAt(0).toUpperCase() + severity.slice(1);
}

export function orderedScoreEntries(
  scores: Record<string, number>
): Array<[string, number]> {
  const seen = new Set<string>();
  const ordered: Array<[string, number]> = [];

  for (const key of SCORE_KEYS) {
    if (key in scores) {
      ordered.push([key, scores[key]]);
      seen.add(key);
    }
  }

  for (const [key, value] of Object.entries(scores)) {
    if (!seen.has(key)) {
      ordered.push([key, value]);
    }
  }

  return ordered;
}

export function orderedPlatformEntries(
  platforms: Record<string, number>
): Array<[string, number]> {
  const seen = new Set<string>();
  const ordered: Array<[string, number]> = [];

  for (const key of PLATFORM_KEYS) {
    if (key in platforms) {
      ordered.push([key, platforms[key]]);
      seen.add(key);
    }
  }

  for (const [key, value] of Object.entries(platforms)) {
    if (!seen.has(key)) {
      ordered.push([key, value]);
    }
  }

  return ordered;
}
