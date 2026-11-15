'use server';
/**
 * @fileOverview AI-powered Bible verse generation.
 *
 * - getBibleVerse - A function that returns a Bible verse for what's on the student's mind.
 * - GetBibleVerseInput - The input type for the getBibleVerse function.
 * - GetBibleVerseOutput - The return type for the getBibleVerse function.
 */

import {ai, smartGenerate, getModel, safetySettings, SupportedModel} from '@/ai/genkit';
import {z} from 'genkit';
import { UserFacingError } from '@/lib/user-facing-error';
import { BIBLE_TRANSLATION } from '@/lib/bible';

const GetBibleVerseInputSchema = z.object({
  topic: z.string().optional().describe('What is on the student\'s mind: a word ("hope") or a sentence ("I am nervous about my test").'),
  model: z.enum(['gemma3', 'flash', 'pro', 'haiku'] as [SupportedModel, ...SupportedModel[]]).optional(),
});
export type GetBibleVerseInput = z.infer<typeof GetBibleVerseInputSchema>;

const VerseSchema = z.object({
    verse: z.string().describe('The exact words of the verse.'),
    reference: z.string().describe('The reference, like "2 Timothy 1:7".'),
    explanation: z.string().describe('Two or three kind sentences on how the verse speaks to what the student shared.'),
});
type Verse = z.infer<typeof VerseSchema>;

const GetBibleVerseOutputSchema = z.object({
    verse: z.string(),
    reference: z.string(),
    translation: z.string(),
    explanation: z.string(),
    totalTokens: z.number(),
});
export type GetBibleVerseOutput = z.infer<typeof GetBibleVerseOutputSchema>;

export async function getBibleVerse(input: GetBibleVerseInput): Promise<GetBibleVerseOutput> {
    return getBibleVerseFlow(input);
}

const isVerse = (v: Partial<Verse> | null): v is Verse =>
    !!v && typeof v.verse === 'string' && !!v.verse.trim() && typeof v.reference === 'string' && !!v.reference.trim()
    && typeof v.explanation === 'string';

const getBibleVerseFlow = ai.defineFlow(
    {
        name: 'getBibleVerseFlow',
        inputSchema: GetBibleVerseInputSchema,
        outputSchema: GetBibleVerseOutputSchema,
    },
    async (input) => {
        const shared = input.topic?.trim() || 'daily inspiration';
        const prompt = `A student shared what is on their mind. Choose one comforting, relevant Bible verse for them.

What they shared: "${shared}"

Rules:
- Quote the verse exactly as it reads in the ${BIBLE_TRANSLATION.name} (${BIBLE_TRANSLATION.short}). Never use another translation and never paraphrase.
- Give the reference in the usual form, like "Philippians 4:6".
- In the explanation, speak kindly to the student in two or three sentences about how the verse relates to what they shared.
- Reply with only a JSON object with the string fields "verse", "reference" and "explanation". No other text.`;

        let totalTokens = 0;
        // One retry: occasionally the reply isn't in the expected format
        for (let attempt = 1; attempt <= 2; attempt++) {
            let response: Awaited<ReturnType<typeof smartGenerate<Verse>>>;
            try {
                response = await smartGenerate<Verse>({
                    model: getModel(input.model),
                    maxOutputTokens: 1024,
                    effort: 'low',
                    prompt,
                    output: { schema: VerseSchema },
                    config: { safetySettings },
                });
            } catch (e) {
                // The real reason (a blocked reply, a timeout…) goes to the server log
                console.error(`Bible verse request failed (attempt ${attempt}) for "${shared.slice(0, 80)}":`, e);
                continue;
            }
            totalTokens += response.usage.totalTokens ?? 0;
            if (isVerse(response.output)) {
                return {
                    verse: response.output.verse.trim(),
                    reference: response.output.reference.trim(),
                    translation: BIBLE_TRANSLATION.short,
                    explanation: response.output.explanation.trim(),
                    totalTokens,
                };
            }
            console.error(`Bible verse reply wasn't usable (attempt ${attempt}):`, (response.text ?? '').slice(0, 500));
        }
        throw new UserFacingError("We couldn't find a verse just now. Please try again, or try a shorter phrase like \"courage\" or \"peace\".");
    }
);
