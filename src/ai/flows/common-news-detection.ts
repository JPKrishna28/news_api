'use server';

/**
 * @fileOverview Detects and groups common news headlines across different sources using AI.
 *
 * - detectCommonNews - A function that detects common news headlines.
 * - DetectCommonNewsInput - The input type for the detectCommonNews function.
 * - DetectCommonNewsOutput - The return type for the detectCommonNews function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DetectCommonNewsInputSchema = z.array(
  z.object({
    title: z.string().describe('The title of the news article.'),
    content: z.string().describe('The content of the news article.'),
    source: z.string().describe('The source of the news article.'),
  })
);
export type DetectCommonNewsInput = z.infer<typeof DetectCommonNewsInputSchema>;

const DetectCommonNewsOutputSchema = z.array(
  z.object({
    commonTitle: z.string().describe('A common title that summarizes the grouped articles.'),
    articles: z.array(
      z.object({
        title: z.string().describe('The title of the news article.'),
        content: z.string().describe('The content of the news article.'),
        source: z.string().describe('The source of the news article.'),
      })
    ),
  })
);
export type DetectCommonNewsOutput = z.infer<typeof DetectCommonNewsOutputSchema>;

export async function detectCommonNews(input: DetectCommonNewsInput): Promise<DetectCommonNewsOutput> {
  return detectCommonNewsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'detectCommonNewsPrompt',
  input: {schema: DetectCommonNewsInputSchema},
  output: {schema: DetectCommonNewsOutputSchema},
  prompt: `You are an AI expert in detecting common news headlines across different sources.

  Given a list of news articles, you will group articles with highly similar titles or content from different sources under a common title that summarizes the grouped articles.

  The output should be a JSON array of objects, where each object contains a commonTitle and an array of articles that belong to that common title.

  News Articles:
  {{#each this}}
  Source: {{{source}}}
  Title: {{{title}}}
  Content: {{{content}}}
  {{/each}}`,
});

const detectCommonNewsFlow = ai.defineFlow(
  {
    name: 'detectCommonNewsFlow',
    inputSchema: DetectCommonNewsInputSchema,
    outputSchema: DetectCommonNewsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
