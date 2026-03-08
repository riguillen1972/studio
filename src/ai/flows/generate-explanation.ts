
'use server';
/**
 * @fileOverview AI-powered explanation generation for educational concepts.
 *
 * - generateExplanation - A function that generates explanations for given concepts or questions.
 * - GenerateExplanationInput - The input type for the generateExplanation function.
 * - GenerateExplanationOutput - The return type for the generateExplanation function.
 */

import {ai, getModel, safetySettings, SupportedModel} from '@/ai/genkit';
import {z} from 'genkit';

const ConversationTurnSchema = z.object({
  role: z.enum(['user', 'ai']),
  content: z.string(),
});

const GenerateExplanationInputSchema = z.object({
  concept: z.string().describe('The concept or question for which an explanation is needed.'),
  model: z.enum(['flash', 'pro', 'haiku'] as [SupportedModel, ...SupportedModel[]]).optional(),
  conversationHistory: z.array(ConversationTurnSchema).optional().describe('Previous conversation turns for multi-turn context.'),
});
export type GenerateExplanationInput = z.infer<typeof GenerateExplanationInputSchema>;

const ExplanationSchema = z.object({
  explanation: z.string().describe('The AI-generated explanation of the concept or question.'),
});

const GenerateExplanationOutputSchema = z.object({
  explanation: z.string(),
  totalTokens: z.number(),
});
export type GenerateExplanationOutput = z.infer<typeof GenerateExplanationOutputSchema>;

export async function generateExplanation(input: GenerateExplanationInput): Promise<GenerateExplanationOutput> {
  return generateExplanationFlow(input);
}

const generateExplanationFlow = ai.defineFlow(
  {
    name: 'generateExplanationFlow',
    inputSchema: GenerateExplanationInputSchema,
    outputSchema: GenerateExplanationOutputSchema,
  },
  async (input) => {
    const historySection = input.conversationHistory && input.conversationHistory.length > 0
      ? `\n\nHere is the previous conversation for context:\n${input.conversationHistory.map(t => `${t.role === 'user' ? 'Student' : 'Tutor'}: ${t.content}`).join('\n')}\n\nNow the student has a follow-up:`
      : '';

    const prompt = `You are an AI-powered tutor specializing in explaining complex concepts in simple terms. Your goal is to help students understand the underlying principles of a topic without giving them the direct answer to their questions.

    Please provide a clear and concise explanation for the following concept or question. Guide the student by explaining the concepts and principles involved. Do not provide the final answer to the question if it's a problem to be solved. Instead, help them understand how to arrive at the solution themselves.
    ${historySection}
    Concept/Question:
    ${input.concept}
    `;

    const response = await ai.generate({
        model: getModel(input.model),
        prompt: prompt,
        output: {
            schema: ExplanationSchema
        },
        config: {
            safetySettings,
        }
    });

    return {
      explanation: response.output!.explanation,
      totalTokens: response.usage.totalTokens ?? 0,
    };
  }
);
