'use server';

/**
 * @fileOverview Text summarization flow using Genkit.
 *
 * - summarizeText - A function that summarizes text content.
 * - SummarizeTextInput - The input type for the summarizeText function.
 * - SummarizeTextOutput - The return type for the summarizeText function.
 */

import {ai, getModel} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeTextInputSchema = z.object({
  text: z.string().describe('The text content to be summarized.'),
});
export type SummarizeTextInput = z.infer<typeof SummarizeTextInputSchema>;

const SummarizeTextOutputSchema = z.object({
  summary: z.string().describe('A summary of the key concepts in the text.'),
});
export type SummarizeTextOutput = z.infer<typeof SummarizeTextOutputSchema>;

export async function summarizeText(input: SummarizeTextInput, isPremium: boolean = false): Promise<SummarizeTextOutput> {
  return summarizeTextFlow(input, isPremium);
}

const summarizeTextFlow = ai.defineFlow(
  {
    name: 'summarizeTextFlow',
    inputSchema: SummarizeTextInputSchema,
    outputSchema: SummarizeTextOutputSchema,
  },
  async (input, streamingCallback, isPremium) => {
    const prompt = `Summarize the key concepts in the following text:\n\n${input.text}`;
    const {output} = await ai.generate({
        model: getModel(isPremium),
        prompt,
        output: {
            schema: SummarizeTextOutputSchema,
        }
    });

    return output;
  }
);
