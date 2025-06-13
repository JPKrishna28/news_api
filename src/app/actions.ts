
'use server';

import type { RawNewsArticle, ProcessedNewsArticle, NewsDigestData, UICommonHeadline, CommonNewsSubArticle, CategorizedNewsGroup } from '@/types';
// getMockNewsArticles is no longer needed
import { policeRelevanceFiltering } from '@/ai/flows/police-relevance-filtering';
import { summarizeArticle } from '@/ai/flows/article-summarization';
import { detectCommonNews, type DetectCommonNewsInput } from '@/ai/flows/common-news-detection';
import { format, startOfDay, endOfDay } from 'date-fns';

async function fetchNewsFromAPI(date: Date): Promise<RawNewsArticle[]> {
  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey) {
    console.error("NEWS_API_KEY is not set in environment variables.");
    // Potentially show a toast or user message from the calling function
    return [];
  }

  const formattedDate = format(date, 'yyyy-MM-dd');
  // NewsAPI recommends ISO 8601 for 'from' and 'to' for full day coverage.
  // However, some endpoints also accept YYYY-MM-DD.
  // Using YYYY-MM-DD for both 'from' and 'to' should effectively query for that specific day.
  const newsApiUrl = `https://newsapi.org/v2/top-headlines?country=in&from=${formattedDate}&to=${formattedDate}&pageSize=50&apiKey=${apiKey}`;
  // Alternative: use 'everything' endpoint for more comprehensive search, e.g.,
  // const newsApiUrl = `https://newsapi.org/v2/everything?q=India&from=${formattedDate}&to=${formattedDate}&language=en&sortBy=publishedAt&pageSize=50&apiKey=${apiKey}`;


  try {
    const response = await fetch(newsApiUrl);
    if (!response.ok) {
      const errorData = await response.json();
      console.error(`NewsAPI request failed with status ${response.status}:`, errorData.message || 'Unknown error');
      return [];
    }

    const data = await response.json();

    if (data.status !== 'ok') {
      console.error('NewsAPI response error:', data.message || data.code);
      return [];
    }

    return data.articles.map((article: any, index: number): RawNewsArticle => {
      let content = article.content || article.description || '';
      if (content === '[Removed]') {
        content = article.description || '';
      }
      // Remove typical truncation markers if present
      if (typeof content === 'string') {
        content = content.replace(/\[\+\d+ chars\]$/, '').trim();
      }


      return {
        id: article.url || `news-article-${index}-${new Date(article.publishedAt).getTime()}`, // Use URL as ID, fallback if null
        title: article.title || 'No Title Provided',
        content: content,
        source: article.source?.name || 'Unknown Source',
        url: article.url || '#',
        publishedDate: format(new Date(article.publishedAt), 'yyyy-MM-dd'),
      };
    }).filter((article: RawNewsArticle) => article.title && article.title !== '[Removed]' && article.content); // Filter out articles with no title or content

  } catch (error) {
    console.error('Failed to fetch or process news from NewsAPI:', error);
    return [];
  }
}

export async function fetchAndProcessNews(date: Date): Promise<NewsDigestData> {
  try {
    const rawArticles: RawNewsArticle[] = await fetchNewsFromAPI(date);

    if (rawArticles.length === 0) {
        console.log("No articles fetched from NewsAPI for the selected date.");
        // No need to proceed with AI processing if no articles
         return {
          commonHeadlines: [],
          categorizedNews: [],
        };
    }

    const processedArticlesFutures = rawArticles.map(async (article) => {
      try {
        // Skip AI processing for articles with very short content, as it might not be useful
        if (!article.content || article.content.length < 50) { // Threshold of 50 characters
           return {
            ...article,
            isRelevant: false,
            relevanceReason: "Content too short for analysis",
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
        console.error(`Error processing article ${article.id} for relevance/summary:`, error);
        return {
          ...article,
          isRelevant: false,
          relevanceReason: "Error in AI processing",
          summary: undefined,
        } as ProcessedNewsArticle;
      }
    });
    
    const processedArticles: ProcessedNewsArticle[] = await Promise.all(processedArticlesFutures);

    const relevantArticles = processedArticles.filter(a => a.isRelevant);

    // Prepare input for common news detection using all raw articles to get broader matches
    const commonNewsInput: DetectCommonNewsInput = rawArticles
      .filter(a => a.content && a.content.length >= 50) // Only include articles with sufficient content for detection
      .map(a => ({
        title: a.title,
        content: a.content, 
        source: a.source,
      }));

    let commonNewsOutput = [];
    if (commonNewsInput.length > 0) {
        try {
            commonNewsOutput = await detectCommonNews(commonNewsInput);
        } catch (error) {
            console.error('Error detecting common news:', error);
            commonNewsOutput = []; 
        }
    }
    

    const uiCommonHeadlines: UICommonHeadline[] = commonNewsOutput.map(group => {
      const detailedArticles: CommonNewsSubArticle[] = group.articles.map(articleInfo => {
        // Find the original article to get its URL.
        // Match based on title and source as the AI uses these.
        const originalArticle = rawArticles.find(
          ra => ra.title === articleInfo.title && ra.source === articleInfo.source
        );
        return {
          title: articleInfo.title,
          source: articleInfo.source,
          url: originalArticle?.url || '#',
        };
      });

      return {
        commonTitle: group.commonTitle,
        articles: detailedArticles,
      };
    });

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

    return {
      commonHeadlines: uiCommonHeadlines,
      categorizedNews,
    };

  } catch (error) {
    console.error("Error in fetchAndProcessNews:", error);
    return {
      commonHeadlines: [],
      categorizedNews: [],
    };
  }
}

