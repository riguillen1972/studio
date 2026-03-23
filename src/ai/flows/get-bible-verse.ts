
'use server';
/**
 * @fileOverview AI-powered Bible verse generation.
 *
 * - getBibleVerse - A function that returns a random Bible verse.
 * - GetBibleVerseInput - The input type for the getBibleVerse function.
 * - GetBibleVerseOutput - The return type for the getBibleVerse function.
 */

import {ai, getModel, safetySettings, SupportedModel} from '@/ai/genkit';
import {z} from 'genkit';

const GetBibleVerseInputSchema = z.object({
  topic: z.string().optional().describe('An optional topic for the Bible verse (e.g., "hope", "faith").'),
  model: z.enum(['flash-lite', 'flash', 'pro', 'haiku'] as [SupportedModel, ...SupportedModel[]]).optional(),
});
export type GetBibleVerseInput = z.infer<typeof GetBibleVerseInputSchema>;

const VerseSchema = z.object({
    verse: z.string().describe('The Bible verse text.'),
    reference: z.string().describe('The reference for the Bible verse (e.g., "John 3:16").'),
});

const GetBibleVerseOutputSchema = z.object({
    verse: z.string(),
    reference: z.string(),
    totalTokens: z.number(),
});
export type GetBibleVerseOutput = z.infer<typeof GetBibleVerseOutputSchema>;

export async function getBibleVerse(input: GetBibleVerseInput): Promise<GetBibleVerseOutput> {
    return getBibleVerseFlow(input);
}

const getBibleVerseFlow = ai.defineFlow(
    {
        name: 'getBibleVerseFlow',
        inputSchema: GetBibleVerseInputSchema,
        outputSchema: GetBibleVerseOutputSchema,
    },
    async (input) => {
        const prompt = `You are an AI assistant that provides Bible verses. 
        
        Please provide a random Bible verse. ${input.topic ? `The verse should be related to the topic of: ${input.topic}.` : ''}
        
        Return the verse and its reference.`;

        const response = await ai.generate({
            model: getModel(input.model),
            prompt,
            output: {
                schema: VerseSchema,
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
