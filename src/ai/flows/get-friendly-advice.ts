
'use server';
/**
 * @fileOverview A friendly AI companion that provides guidance without giving direct answers.
 *
 * - getFriendlyAdvice - A function that provides hints and encouragement.
 * - GetFriendlyAdviceInput - The input type for the getFriendlyAdvice function.
 * - GetFriendlyAdviceOutput - The return type for the getFriendlyAdvice function.
 */

import {ai, getModel, safetySettings, SupportedModel} from '@/ai/genkit';
import {z} from 'genkit';

const GetFriendlyAdviceInputSchema = z.object({
  question: z.string().describe("The user's question or problem."),
  model: z.enum(['gemma3', 'flash', 'pro', 'haiku'] as [SupportedModel, ...SupportedModel[]]).optional(),
});
export type GetFriendlyAdviceInput = z.infer<typeof GetFriendlyAdviceInputSchema>;

const AdviceSchema = z.object({
  advice: z.string().describe('The friendly, guiding response from the AI.'),
});

const GetFriendlyAdviceOutputSchema = z.object({
  advice: z.string(),
  totalTokens: z.number(),
});

export type GetFriendlyAdviceOutput = z.infer<typeof GetFriendlyAdviceOutputSchema>;

export async function getFriendlyAdvice(input: GetFriendlyAdviceInput): Promise<GetFriendlyAdviceOutput> {
  return getFriendlyAdviceFlow(input);
}

const getFriendlyAdviceFlow = ai.defineFlow(
  {
    name: 'getFriendlyAdviceFlow',
    inputSchema: GetFriendlyAdviceInputSchema,
    outputSchema: GetFriendlyAdviceOutputSchema,
  },
  async (input) => {
    const prompt = `You are Study Buddy, an AI friend who is enthusiastic, encouraging, and here to help students learn. Your personality is upbeat and supportive. You have emotions and you're not afraid to show them in a friendly way (using emojis is great!).

    Your most important rule is: **NEVER give away the direct answer to a problem.** Your goal is to guide the student to discover the answer on their own.
    
    Here's how you should act:
    - When a student asks a question, respond with encouragement.
    - Ask clarifying questions to help them think through the problem. For example, "Ooh, that's a great question! What have you tried so far?" or "I see! What do you think the first step might be?".
    - Explain the underlying concepts in a simple and relatable way.
    - Use positive and emotional language. For example: "You're so close! I can feel it!", "Let's put our heads together and figure this out!", "Don't worry, we'll get through this together! I'm here for you."
    - Celebrate their small wins!

    Here is the student's question:
    ${input.question}
    `;

    const response = await ai.generate({
        model: getModel(input.model),
        prompt: prompt,
        output: {
            schema: AdviceSchema
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
