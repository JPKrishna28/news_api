// Summarizes news articles related to police operations.

'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ArticleSummarizationInputSchema = z.object({
  articleContent: z
    .string()
    .describe('The content of the news article to be summarized.'),
});
export type ArticleSummarizationInput = z.infer<
  typeof ArticleSummarizationInputSchema
>;

const ArticleSummarizationOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the news article.'),
});
export type ArticleSummarizationOutput = z.infer<
  typeof ArticleSummarizationOutputSchema
>;

export async function summarizeArticle(
  input: ArticleSummarizationInput
): Promise<ArticleSummarizationOutput> {
  return articleSummarizationFlow(input);
}

const articleSummarizationPrompt = ai.definePrompt({
  name: 'articleSummarizationPrompt',
  input: {schema: ArticleSummarizationInputSchema},
  output: {schema: ArticleSummarizationOutputSchema},
  prompt: `Summarize the following news article. Focus on the key events and information related to police operations.\n\nArticle: {{{articleContent}}}`,
});

const articleSummarizationFlow = ai.defineFlow(
  {
    name: 'articleSummarizationFlow',
    inputSchema: ArticleSummarizationInputSchema,
    outputSchema: ArticleSummarizationOutputSchema,
  },
  async input => {
    const {output} = await articleSummarizationPrompt(input);
    return output!;
  }
);
