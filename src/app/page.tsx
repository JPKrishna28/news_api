
'use client';

import * as React from 'react';
import { fetchAndProcessNews } from './actions';
import type { NewsDigestData } from '@/types';
import { DateSelector } from '@/components/date-selector';
import { CommonHeadlinesSection } from '@/components/common-headlines-section';
import { CategorizedNewsSection } from '@/components/categorized-news-section';
import { LawLensHeader } from '@/components/lawlens-header';
import { NewsDigestSkeleton } from '@/components/skeletons';
import { useToast } from "@/hooks/use-toast";
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

export default function HomePage() {
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(new Date());
  const [newsData, setNewsData] = React.useState<NewsDigestData | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const { toast } = useToast();

  const handleFetchNews = React.useCallback(async (dateToFetch: Date | undefined) => {
    if (!dateToFetch) {
      setNewsData(null);
      return;
    }

    setIsLoading(true);
    setNewsData(null); // Clear previous data
    console.log('[HomePage] Calling fetchAndProcessNews with date:', dateToFetch);
    try {
      const data = await fetchAndProcessNews(dateToFetch);
      console.log('[HomePage] Received data from fetchAndProcessNews:', data);
      setNewsData(data);
      if (data.commonHeadlines.length === 0 && data.categorizedNews.length === 0) {
        toast({
          title: "No News Found",
          description: "No articles were found or processed for the selected date.",
          variant: "default",
        });
      }
    } catch (error) {
      console.error('[HomePage] Failed to fetch news:', error);
      toast({
        title: "Error Fetching News",
        description: "An error occurred while fetching news. Please try again.",
        variant: "destructive",
      });
      setNewsData({ commonHeadlines: [], categorizedNews: [] }); // Set to empty on error
    } finally {
      setIsLoading(false);
    }
  }, [toast]);
  
  React.useEffect(() => {
    // Initial fetch for today's date
    console.log('[HomePage] Initial fetch useEffect triggered.');
    if (selectedDate) { // Ensure selectedDate is defined before initial fetch
        handleFetchNews(selectedDate);
    }
  }, [handleFetchNews, selectedDate]); // Added handleFetchNews and selectedDate

  const onDateChangeAndFetch = (date: Date | undefined) => {
    setSelectedDate(date);
    // No automatic fetch on date change from selector here, user clicks button
    // If you want automatic fetch on date change, uncomment the line below
    // handleFetchNews(date); 
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <LawLensHeader />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="mb-8 p-6 bg-card rounded-lg shadow-md border border-border">
          <h2 className="text-xl font-headline font-semibold mb-3 text-primary">Select Date for News Digest</h2>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <DateSelector
              selectedDate={selectedDate}
              onDateChange={onDateChangeAndFetch} // Changed to custom handler
              className="w-full sm:w-auto"
            />
            <Button onClick={() => handleFetchNews(selectedDate)} disabled={isLoading || !selectedDate} className="w-full sm:w-auto">
              <Search className="mr-2 h-4 w-4" />
              {isLoading ? 'Fetching...' : 'Fetch News'}
            </Button>
          </div>
        </div>

        {isLoading && <NewsDigestSkeleton />}

        {!isLoading && newsData && (
          <div className="space-y-10">
            <CommonHeadlinesSection headlines={newsData.commonHeadlines} />
            <CategorizedNewsSection categorizedNews={newsData.categorizedNews} />
          </div>
        )}
        
        {!isLoading && !newsData && (
           <div className="text-center py-10">
             <p className="text-muted-foreground text-lg">Please select a date and click "Fetch News" to view the digest.</p>
           </div>
        )}

      </main>
      <footer className="py-4 text-center text-sm text-muted-foreground border-t border-border">
        © {new Date().getFullYear()} LawLens. All rights reserved.
      </footer>
    </div>
  );
}
