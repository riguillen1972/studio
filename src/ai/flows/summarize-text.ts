
'use server';

/**
 * @fileOverview Text summarization flow using Genkit.
 *
 * - summarizeText - A function that summarizes text content.
 * - SummarizeTextInput - The input type for the summarizeText function.
 * - SummarizeTextOutput - The return type for the summarizeText function.
 */

import {ai, getModel, safetySettings, SupportedModel} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeTextInputSchema = z.object({
  text: z.string().describe('The text content to be summarized.'),
  model: z.enum(['gemma3', 'flash', 'pro', 'haiku'] as [SupportedModel, ...SupportedModel[]]).optional(),
});
export type SummarizeTextInput = z.infer<typeof SummarizeTextInputSchema>;

const SummarySchema = z.object({
  summary: z.string().describe('A summary of the key concepts in the text.'),
});

const SummarizeTextOutputSchema = z.object({
  summary: z.string(),
  totalTokens: z.number(),
});
export type SummarizeTextOutput = z.infer<typeof SummarizeTextOutputSchema>;

export async function summarizeText(input: SummarizeTextInput): Promise<SummarizeTextOutput> {
  return summarizeTextFlow(input);
}

const summarizeTextFlow = ai.defineFlow(
  {
    name: 'summarizeTextFlow',
    inputSchema: SummarizeTextInputSchema,
    outputSchema: SummarizeTextOutputSchema,
  },
  async (input) => {
    const prompt = `Summarize the key concepts in the following text:\n\n${input.text}`;
    const response = await ai.generate({
        model: getModel(input.model),
        prompt,
        output: {
            schema: SummarySchema,
        },
        config: {
            safetySettings,
        }
    });

    return {
      ...response.output!,
      totalTokens: response.usage.totalTokens ?? 0,
    };
  }
);
