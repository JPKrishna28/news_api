import type { RawNewsArticle, ProcessedNewsArticle, NewsDigestData, UICommonHeadline, CommonNewsSubArticle, CategorizedNewsGroup } from '@/types';
import { policeRelevanceFiltering } from '@/ai/flows/police-relevance-filtering';
import { summarizeArticle } from '@/ai/flows/article-summarization';
import { detectCommonNews, type DetectCommonNewsInput } from '@/ai/flows/common-news-detection';
import { format } from 'date-fns';
import https from 'https';

// Define the NewsAPI response type
interface NewsAPIResponse {
  status: string;
  totalResults: number;
  articles: NewsAPIArticle[];
  code?: string;
  message?: string;
}

interface NewsAPIArticle {
  source: {
    id: string | null;
    name: string;
  };
  author: string | null;
  title: string;
  description: string | null;
  url: string;
  urlToImage: string | null;
  publishedAt: string;
  content: string | null;
}

function httpsGet(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const req = https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve(jsonData);
        } catch (error) {
          reject(new Error(`Failed to parse JSON: ${error}`));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function fetchNewsFromAPI(date: Date): Promise<RawNewsArticle[]> {
  const apiKey = process.env.NEWS_API_KEY || 'e04b6662078b49348733d1a0b0ecd04b';
  if (!apiKey) {
    console.error("NEWS_API_KEY is not set in environment variables. Please ensure it's set in your .env file.");
    return [];
  }

  const formattedDate = format(date, 'yyyy-MM-dd');
  console.log(`Fetching news from NewsAPI for date: ${formattedDate} with query 'Andhra Pradesh'`);

  // Construct the API URL
  const baseUrl = 'https://newsapi.org/v2/everything';
  const params = new URLSearchParams({
    q: 'Andhra Pradesh',
    language: 'en',
    from: formattedDate,
    to: formattedDate,
    sortBy: 'popularity',
    pageSize: '100',
    apiKey: apiKey
  });

  try {
    const data: NewsAPIResponse = await httpsGet(`${baseUrl}?${params.toString()}`);

    if (data.status !== 'ok') {
      console.error(`NewsAPI response error for ${formattedDate}: Code: ${data.code}, Message: ${data.message}`);
      return [];
    }
    
    if (!data.articles || data.articles.length === 0) {
      console.log(`NewsAPI returned no articles for ${formattedDate}. Query: 'Andhra Pradesh', sortBy: 'popularity'. This could be due to the date being too old (free tier limits to ~1 month) or no matching news.`);
      return [];
    }

    console.log(`NewsAPI returned ${data.articles.length} articles for ${formattedDate} before client-side filtering.`);

    const mappedArticles = data.articles.map((article: NewsAPIArticle, index: number): RawNewsArticle => {
      let content = article.content || article.description || '';
      // Handle "[Removed]" content, fallback to description if content is "[Removed]"
      if (content === '[Removed]') {
        content = article.description || ''; 
      }
      
      // Further ensure content is a string and remove common API truncation markers
      if (typeof content === 'string') {
        content = content.replace(/\[\+\d+\s*chars\]$/, '').trim();
      } else {
        content = ''; // Ensure content is always a string
      }

      return {
        id: article.url || `news-article-${index}-${new Date(article.publishedAt || Date.now()).getTime()}`, // Ensure unique ID
        title: article.title || 'No Title Provided',
        content: content,
        source: article.source?.name || 'Unknown Source',
        url: article.url || '#',
        publishedDate: article.publishedAt ? format(new Date(article.publishedAt), 'yyyy-MM-dd') : formattedDate,
      };
    });

    // Filter out articles that still have no meaningful title or content after mapping
    const filteredArticles = mappedArticles.filter(a => a.title && a.title !== '[Removed]' && a.content && a.content.trim() !== '');
    console.log(`Returning ${filteredArticles.length} articles for ${formattedDate} after client-side filtering (title/content checks).`);
    return filteredArticles;

  } catch (error: any) {
    console.error(`Failed to fetch or process news from NewsAPI for ${formattedDate}:`, error.message || error);
    // Log more detailed error information if available
    if (error.message) {
      console.error('Error details:', error.message, error);
    } else {
      console.error('Unknown error fetching news from NewsAPI:', error);
    }
    return [];
  }
}

export async function fetchAndProcessNews(date: Date): Promise<NewsDigestData> {
  try {
    const rawArticles: RawNewsArticle[] = await fetchNewsFromAPI(date);

    if (rawArticles.length === 0) {
      console.log(`fetchAndProcessNews: No raw articles to process for date ${format(date, 'yyyy-MM-dd')}. This usually means NewsAPI returned no suitable articles or all were filtered out.`);
      return {
        commonHeadlines: [],
        categorizedNews: [],
      };
    }

    console.log(`fetchAndProcessNews: Starting AI processing for ${rawArticles.length} articles for date ${format(date, 'yyyy-MM-dd')}.`);

    const processedArticlesFutures = rawArticles.map(async (article) => {
      try {
        // Content length check before calling AI, to save resources if content is too short
        if (!article.content || article.content.length < 50) { 
          console.log(`Article "${article.title}" (ID: ${article.id}) skipped for AI processing due to short content (length: ${article.content?.length || 0}).`);
          return {
            ...article,
            isRelevant: false,
            relevanceReason: "Content too short for AI analysis",
            summary: undefined,
          } as ProcessedNewsArticle;
        }

        const relevanceResult = await policeRelevanceFiltering({ articleContent: article.content });
        let summaryResult;
        if (relevanceResult.isRelevant) {
          summaryResult = await summarizeArticle({ articleContent: article.content });
        }
        return {
          ...article,
          isRelevant: relevanceResult.isRelevant,
          relevanceReason: relevanceResult.isRelevant ? relevanceResult.reason : undefined,
          summary: summaryResult?.summary,
        } as ProcessedNewsArticle;
      } catch (error) {
        console.error(`Error during AI processing for article ${article.id} ("${article.title}"):`, error);
        return {
          ...article,
          isRelevant: false,
          relevanceReason: "Error in AI processing",
          summary: undefined,
        } as ProcessedNewsArticle;
      }
    });
    
    const processedArticles: ProcessedNewsArticle[] = await Promise.all(processedArticlesFutures);
    console.log(`fetchAndProcessNews: Finished AI processing. ${processedArticles.filter(p => p.isRelevant).length} articles deemed relevant.`);

    const relevantArticles = processedArticles.filter(a => a.isRelevant);

    // Input for common news detection should be based on raw articles with sufficient content
    const commonNewsInput: DetectCommonNewsInput = rawArticles
      .filter(a => a.content && a.content.length >= 50) // Ensure only articles with substantial content are used for common news detection.
      .map(a => ({
        title: a.title,
        content: a.content, // Make sure to pass the actual content for better detection
        source: a.source,
      }));

    let commonNewsOutput = [];
    if (commonNewsInput.length > 0) {
      console.log(`fetchAndProcessNews: Detecting common news from ${commonNewsInput.length} articles.`);
      try {
        commonNewsOutput = await detectCommonNews(commonNewsInput);
        console.log(`fetchAndProcessNews: Detected ${commonNewsOutput.length} common headline groups.`);
      } catch (error) {
        console.error('Error detecting common news:', error);
        commonNewsOutput = []; // Default to empty array on error
      }
    } else {
      console.log("fetchAndProcessNews: No articles with sufficient content for common news detection.");
    }
    
    // Map AI output to UI structure
    const uiCommonHeadlines: UICommonHeadline[] = commonNewsOutput.map(group => {
      // Ensure that the articles in the group are mapped correctly to include their URL
      const detailedArticles: CommonNewsSubArticle[] = group.articles.map(articleInfo => {
        // Find the original article to get its URL and ensure correct mapping
        const originalArticle = rawArticles.find(
          ra => ra.title === articleInfo.title && ra.source === articleInfo.source // Ensure content is also checked if titles can be non-unique for same source
        );
        return {
          title: articleInfo.title,
          source: articleInfo.source,
          url: originalArticle?.url || '#', // Fallback URL if not found
        };
      });

      return {
        commonTitle: group.commonTitle,
        articles: detailedArticles,
      };
    });

    // Categorize relevant articles by source
    const categorizedMap: Record<string, ProcessedNewsArticle[]> = relevantArticles.reduce((acc, article) => {
      const source = article.source;
      if (!acc[source]) {
        acc[source] = [];
      }
      acc[source].push(article);
      return acc;
    }, {} as Record<string, ProcessedNewsArticle[]>);

    const categorizedNews: CategorizedNewsGroup[] = Object.entries(categorizedMap).map(([sourceName, articles]) => ({
      sourceName,
      articles,
    }));
    
    console.log(`fetchAndProcessNews: Final data prepared. Common headlines: ${uiCommonHeadlines.length}, Categorized news groups: ${categorizedNews.length}.`);

    return {
      commonHeadlines: uiCommonHeadlines,
      categorizedNews,
    };

  } catch (error) {
    console.error("Overall error in fetchAndProcessNews:", error);
    return { // Return empty structure on error
      commonHeadlines: [],
      categorizedNews: [],
    };
  }
}