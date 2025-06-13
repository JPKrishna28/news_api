
'use server';

import type { RawNewsArticle, ProcessedNewsArticle, NewsDigestData, UICommonHeadline, CommonNewsSubArticle, CategorizedNewsGroup } from '@/types';
import { policeRelevanceFiltering } from '@/ai/flows/police-relevance-filtering';
import { summarizeArticle } from '@/ai/flows/article-summarization';
import { detectCommonNews, type DetectCommonNewsInput } from '@/ai/flows/common-news-detection';
import { format } from 'date-fns';
import NewsAPI from 'newsapi';
import type { Article as NewsApiArticle } from 'newsapi';


async function fetchNewsFromAPI(date: Date): Promise<RawNewsArticle[]> {
  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey) {
    console.error("NEWS_API_KEY is not set in environment variables.");
    return [];
  }

  const newsapi = new NewsAPI(apiKey);
  const formattedDate = format(date, 'yyyy-MM-dd');

  try {
    // Use 'everything' endpoint for date filtering with a general query for India.
    // Sort by popularity to get more relevant "top-like" news for the day.
    const response = await newsapi.v2.everything({
      q: 'India', // General query for news related to India
      language: 'en',
      from: formattedDate,
      to: formattedDate,
      sortBy: 'popularity', // 'relevancy' or 'publishedAt' are other options
      pageSize: 50,
    });

    if (response.status !== 'ok') {
      console.error('NewsAPI response error:', response.code, response.message);
      return [];
    }
    
    if (!response.articles) {
        console.log("No articles found in NewsAPI response for the selected date.");
        return [];
    }

    return response.articles.map((article: NewsApiArticle, index: number): RawNewsArticle => {
      let content = article.content || article.description || '';
      // NewsAPI sometimes returns "[Removed]" for content
      if (content === '[Removed]') {
        content = article.description || '';
      }
      // Remove typical truncation markers if present, e.g., "[+1234 chars]"
      if (typeof content === 'string') {
        content = content.replace(/\[\+\d+\s*chars\]$/, '').trim();
      }

      return {
        id: article.url || `news-article-${index}-${new Date(article.publishedAt || Date.now()).getTime()}`,
        title: article.title || 'No Title Provided',
        content: content,
        source: article.source?.name || 'Unknown Source',
        url: article.url || '#',
        publishedDate: article.publishedAt ? format(new Date(article.publishedAt), 'yyyy-MM-dd') : formattedDate,
      };
    }).filter((article: RawNewsArticle) => article.title && article.title !== '[Removed]' && article.content); // Filter out articles with no title or content

  } catch (error: any) {
    console.error('Failed to fetch or process news from NewsAPI:', error.message || error);
    return [];
  }
}

export async function fetchAndProcessNews(date: Date): Promise<NewsDigestData> {
  try {
    const rawArticles: RawNewsArticle[] = await fetchNewsFromAPI(date);

    if (rawArticles.length === 0) {
        console.log("No articles fetched from NewsAPI for the selected date.");
         return {
          commonHeadlines: [],
          categorizedNews: [],
        };
    }

    const processedArticlesFutures = rawArticles.map(async (article) => {
      try {
        if (!article.content || article.content.length < 50) { 
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

    const commonNewsInput: DetectCommonNewsInput = rawArticles
      .filter(a => a.content && a.content.length >= 50) 
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
