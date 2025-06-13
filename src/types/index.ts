// Raw data structure from mock data source
export interface RawNewsArticle {
  id: string;
  title: string;
  content: string;
  source: string;
  url: string;
  publishedDate: string; // YYYY-MM-DD
}

// After AI processing, for UI display in categorized list
export interface ProcessedNewsArticle extends RawNewsArticle {
  isRelevant: boolean;
  relevanceReason?: string;
  summary?: string;
}

// For detectCommonNews AI input
export interface DetectCommonNewsArticleInput {
  title: string;
  content: string;
  source: string;
}

// Article detail within a common headline group, for UI display
export interface CommonNewsSubArticle {
  title: string;
  source: string;
  url: string;
}

// Structure for displaying a common headline group in UI
export interface UICommonHeadline {
  commonTitle: string; // This is the AI-generated summary/title for the group
  articles: CommonNewsSubArticle[];
}

// Structure for displaying categorized news in UI
export interface CategorizedNewsGroup {
  sourceName: string;
  articles: ProcessedNewsArticle[];
}

// Overall data structure for the news digest page
export interface NewsDigestData {
  commonHeadlines: UICommonHeadline[];
  categorizedNews: CategorizedNewsGroup[];
}
