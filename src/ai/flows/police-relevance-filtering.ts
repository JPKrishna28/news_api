'use server';
/**
 * @fileOverview AI-powered news article filtering for police relevance.
 *
 * - policeRelevanceFiltering - A function that determines the relevance of a news article to police operations.
 * - PoliceRelevanceFilteringInput - The input type for the policeRelevanceFiltering function.
 * - PoliceRelevanceFilteringOutput - The return type for the policeRelevanceFiltering function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PoliceRelevanceFilteringInputSchema = z.object({
  articleContent: z
    .string()
    .describe('The content of the news article to be analyzed.'),
});
export type PoliceRelevanceFilteringInput = z.infer<
  typeof PoliceRelevanceFilteringInputSchema
>;

const PoliceRelevanceFilteringOutputSchema = z.object({
  isRelevant: z
    .boolean()
    .describe('Whether the news article is relevant to police operations.'),
  reason: z
    .string()
    .describe(
      'A short explanation or reason for why the article is relevant to police operations.'
    ),
});
export type PoliceRelevanceFilteringOutput = z.infer<
  typeof PoliceRelevanceFilteringOutputSchema
>;

export async function policeRelevanceFiltering(
  input: PoliceRelevanceFilteringInput
): Promise<PoliceRelevanceFilteringOutput> {
  return policeRelevanceFilteringFlow(input);
}

const policeRelevancePrompt = ai.definePrompt({
  name: 'policeRelevancePrompt',
  input: {schema: PoliceRelevanceFilteringInputSchema},
  output: {schema: PoliceRelevanceFilteringOutputSchema},
  prompt: `You are an AI expert in determining if a news article is relevant to police operations.

  Analyze the news article content provided and determine if it is relevant to police operations.
  If it is relevant, provide a short explanation or reason for why it is relevant.

  News Article Content: {{{articleContent}}}
  `,
});

const policeRelevanceFilteringFlow = ai.defineFlow(
  {
    name: 'policeRelevanceFilteringFlow',
    inputSchema: PoliceRelevanceFilteringInputSchema,
    outputSchema: PoliceRelevanceFilteringOutputSchema,
  },
  async input => {
    const {output} = await policeRelevancePrompt(input);
    return output!;
  }
);
