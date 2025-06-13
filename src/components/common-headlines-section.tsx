import type { UICommonHeadline } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ExternalLink, Newspaper } from 'lucide-react';

interface CommonHeadlinesSectionProps {
  headlines: UICommonHeadline[];
}

export function CommonHeadlinesSection({ headlines }: CommonHeadlinesSectionProps) {
  if (!headlines || headlines.length === 0) {
    return null;
  }

  return (
    <section className="mb-8">
      <h2 className="text-2xl font-headline font-bold mb-4 text-primary flex items-center">
        <Newspaper className="h-7 w-7 mr-2 text-accent" />
        Common Headlines
      </h2>
      <Accordion type="single" collapsible className="w-full space-y-4">
        {headlines.map((headline, index) => (
          <AccordionItem value={`item-${index}`} key={index} className="bg-card border border-border rounded-lg shadow-md">
            <AccordionTrigger className="p-4 hover:no-underline">
              <h3 className="text-lg font-headline text-left">{headline.commonTitle}</h3>
            </AccordionTrigger>
            <AccordionContent className="p-4 pt-0">
              <p className="text-sm text-muted-foreground mb-3">
                This topic was reported by multiple sources:
              </p>
              <ul className="space-y-2">
                {headline.articles.map((article, subIndex) => (
                  <li key={subIndex} className="text-sm">
                    <span className="font-semibold">{article.source}:</span>{' '}
                    <a
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent hover:underline"
                    >
                      {article.title} <ExternalLink className="inline h-3 w-3 ml-0.5" />
                    </a>
                  </li>
                ))}
              </ul>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
