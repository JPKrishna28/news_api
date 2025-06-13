import type { CategorizedNewsGroup } from '@/types';
import { ArticleCard } from './article-card';
import { Building } from 'lucide-react';

interface CategorizedNewsSectionProps {
  categorizedNews: CategorizedNewsGroup[];
}

export function CategorizedNewsSection({ categorizedNews }: CategorizedNewsSectionProps) {
  if (!categorizedNews || categorizedNews.length === 0) {
    return <p className="text-center text-muted-foreground py-8">No relevant news articles found for this date.</p>;
  }

  return (
    <section>
      <h2 className="text-2xl font-headline font-bold mb-6 text-primary">News by Source</h2>
      <div className="space-y-8">
        {categorizedNews.map((group) => (
          <div key={group.sourceName}>
            <h3 className="text-xl font-headline font-semibold mb-4 text-secondary-foreground flex items-center">
              <Building className="h-6 w-6 mr-2 text-accent" />
              {group.sourceName}
            </h3>
            {group.articles && group.articles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {group.articles.map((article) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No relevant articles from this source for the selected date.</p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
