'use server';

import type { RawNewsArticle, ProcessedNewsArticle, NewsDigestData, UICommonHeadline, CommonNewsSubArticle, CategorizedNewsGroup } from '@/types';
import { getMockNewsArticles } from '@/lib/mock-data';
import { policeRelevanceFiltering } from '@/ai/flows/police-relevance-filtering';
import { summarizeArticle } from '@/ai/flows/article-summarization';
import { detectCommonNews, type DetectCommonNewsInput } from '@/ai/flows/common-news-detection';
import { format } from 'date-fns';

export async function fetchAndProcessNews(date: Date): Promise<NewsDigestData> {
  try {
    const rawArticles: RawNewsArticle[] = getMockNewsArticles(date);

    const processedArticlesFutures = rawArticles.map(async (article) => {
      try {
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
        // Return article with default non-relevant status on error
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
    const commonNewsInput: DetectCommonNewsInput = rawArticles.map(a => ({
      title: a.title,
      content: a.content, 
      source: a.source,
    }));

    let commonNewsOutput;
    try {
        commonNewsOutput = await detectCommonNews(commonNewsInput);
    } catch (error) {
        console.error('Error detecting common news:', error);
        commonNewsOutput = []; // Default to empty if AI fails
    }
    

    const uiCommonHeadlines: UICommonHeadline[] = commonNewsOutput.map(group => {
      const detailedArticles: CommonNewsSubArticle[] = group.articles.map(articleInfo => {
        const originalArticle = rawArticles.find(
          ra => ra.title === articleInfo.title && ra.source === articleInfo.source && ra.publishedDate === format(date, 'yyyy-MM-dd')
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
    // Return empty data structure or throw a more specific error
    return {
      commonHeadlines: [],
      categorizedNews: [],
    };
  }
}
