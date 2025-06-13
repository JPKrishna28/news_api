import type { ProcessedNewsArticle } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Info } from 'lucide-react';

interface ArticleCardProps {
  article: ProcessedNewsArticle;
}

export function ArticleCard({ article }: ArticleCardProps) {
  return (
    <Card className="flex flex-col h-full shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader>
        <CardTitle className="font-headline text-xl">
          <a href={article.url} target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors">
            {article.title} <ExternalLink className="inline h-4 w-4 ml-1" />
          </a>
        </CardTitle>
        <CardDescription className="text-sm pt-1">
          Source: {article.source}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        {article.isRelevant && article.relevanceReason && (
          <div className="mb-3 p-2 bg-accent/10 rounded-md border border-accent/30">
            <p className="text-xs text-accent-foreground flex items-start">
              <Info className="h-4 w-4 mr-2 mt-0.5 text-accent shrink-0" />
              <span className="font-semibold">Relevance:</span> {article.relevanceReason}
            </p>
          </div>
        )}
        {article.summary && (
          <div>
            <h4 className="font-semibold text-sm mb-1">Summary:</h4>
            <p className="text-sm text-muted-foreground">{article.summary}</p>
          </div>
        )}
        {!article.summary && !article.isRelevant && (
            <p className="text-sm text-muted-foreground italic">This article was not identified as relevant for detailed analysis.</p>
        )}
      </CardContent>
      <CardFooter>
        {article.isRelevant ? (
          <Badge variant="default" className="bg-primary text-primary-foreground">Police Relevant</Badge>
        ) : (
          <Badge variant="secondary">General News</Badge>
        )}
      </CardFooter>
    </Card>
  );
}
