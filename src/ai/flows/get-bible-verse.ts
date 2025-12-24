'use server';
/**
 * @fileOverview AI-powered Bible verse generation.
 *
 * - getBibleVerse - A function that returns a random Bible verse.
 * - GetBibleVerseInput - The input type for the getBibleVerse function.
 * - GetBibleVerseOutput - The return type for the getBibleVerse function.
 */

import {ai, getModel, safetySettings} from '@/ai/genkit';
import {z} from 'genkit';

const GetBibleVerseInputSchema = z.object({
  topic: z.string().optional().describe('An optional topic for the Bible verse (e.g., "hope", "faith").'),
});
export type GetBibleVerseInput = z.infer<typeof GetBibleVerseInputSchema>;

const GetBibleVerseOutputSchema = z.object({
    verse: z.string().describe('The Bible verse text.'),
    reference: z.string().describe('The reference for the Bible verse (e.g., "John 3:16").'),
});
export type GetBibleVerseOutput = z.infer<typeof GetBibleVerseOutputSchema>;

export async function getBibleVerse(input: GetBibleVerseInput, isPremium: boolean = false): Promise<GetBibleVerseOutput> {
    return getBibleVerseFlow(input, isPremium);
}

const getBibleVerseFlow = ai.defineFlow(
    {
        name: 'getBibleVerseFlow',
        inputSchema: GetBibleVerseInputSchema,
        outputSchema: GetBibleVerseOutputSchema,
    },
    async (input, streamingCallback, isPremium) => {
        const prompt = `You are an AI assistant that provides Bible verses. 
        
        Please provide a random Bible verse. ${input.topic ? `The verse should be related to the topic of: ${input.topic}.` : ''}
        
        Return the verse and its reference.`;

        const {output} = await ai.generate({
            model: getModel(isPremium),
            prompt,
            output: {
                schema: GetBibleVerseOutputSchema,
            },
            config: {
                safetySettings,
            }
        });

        return output;
    }
);
