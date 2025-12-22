'use server';
/**
 * @fileOverview AI-powered explanation generation for educational concepts.
 *
 * - generateExplanation - A function that generates explanations for given concepts or questions.
 * - GenerateExplanationInput - The input type for the generateExplanation function.
 * - GenerateExplanationOutput - The return type for the generateExplanation function.
 */

import {ai, getModel} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateExplanationInputSchema = z.object({
  concept: z.string().describe('The concept or question for which an explanation is needed.'),
});
export type GenerateExplanationInput = z.infer<typeof GenerateExplanationInputSchema>;

const GenerateExplanationOutputSchema = z.object({
  explanation: z.string().describe('The AI-generated explanation of the concept or question.'),
});
export type GenerateExplanationOutput = z.infer<typeof GenerateExplanationOutputSchema>;

export async function generateExplanation(input: GenerateExplanationInput, isPremium: boolean = false): Promise<GenerateExplanationOutput> {
  return generateExplanationFlow(input, isPremium);
}

const generateExplanationFlow = ai.defineFlow(
  {
    name: 'generateExplanationFlow',
    inputSchema: GenerateExplanationInputSchema,
    outputSchema: GenerateExplanationOutputSchema,
  },
  async (input, streamingCallback, isPremium) => {
    const prompt = `You are an AI-powered tutor specializing in explaining complex concepts in simple terms. Your goal is to help students understand the underlying principles of a topic without giving them the direct answer to their questions.

    Please provide a clear and concise explanation for the following concept or question. Guide the student by explaining the concepts and principles involved. Do not provide the final answer to the question if it's a problem to be solved. Instead, help them understand how to arrive at the solution themselves.
    
    Concept/Question:
    ${input.concept}
    `;

    const {output} = await ai.generate({
        model: getModel(isPremium),
        prompt: prompt,
        output: {
            schema: GenerateExplanationOutputSchema
        }
    });

    return output;
  }
);
