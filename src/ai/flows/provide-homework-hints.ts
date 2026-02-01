
'use server';

/**
 * @fileOverview This file defines a Genkit flow for providing homework hints and guidance to students.
 *
 * It takes a homework problem as input and returns hints and guidance to help the student solve it independently.
 *
 * @interface ProvideHomeworkHintsInput - The input type for the provideHomeworkHints function.
 * @interface ProvideHomeworkHintsOutput - The output type for the provideHomeworkHints function.
 * @function provideHomeworkHints - The main function that orchestrates the homework hints flow.
 */

import {ai, getModel, safetySettings} from '@/ai/genkit';
import {z} from 'genkit';

const ProvideHomeworkHintsInputSchema = z.object({
  problem: z.string().describe('The homework problem to get hints for.'),
  subject: z.string().describe('The subject of the homework problem.'),
  gradeLevel: z.string().describe('The grade level of the student.'),
  model: z.enum(['flash', 'pro']).optional(),
});

export type ProvideHomeworkHintsInput = z.infer<typeof ProvideHomeworkHintsInputSchema>;

const HintsSchema = z.object({
  hints: z.array(z.string()).describe('An array of hints to help the student solve the problem.'),
  guidance: z.string().describe('General guidance and strategies for solving this type of problem.'),
});

const ProvideHomeworkHintsOutputSchema = z.object({
  hints: z.array(z.string()),
  guidance: z.string(),
  totalTokens: z.number(),
});

export type ProvideHomeworkHintsOutput = z.infer<typeof ProvideHomeworkHintsOutputSchema>;

export async function provideHomeworkHints(input: ProvideHomeworkHintsInput): Promise<ProvideHomeworkHintsOutput> {
  return provideHomeworkHintsFlow(input);
}

const provideHomeworkHintsFlow = ai.defineFlow(
  {
    name: 'provideHomeworkHintsFlow',
    inputSchema: ProvideHomeworkHintsInputSchema,
    outputSchema: ProvideHomeworkHintsOutputSchema,
  },
  async (input) => {
    const prompt = `You are an AI homework helper for a student in grade ${input.gradeLevel}.

    The student is working on a problem in ${input.subject}:
    
    Problem: ${input.problem}
    
    Provide a few hints to help the student solve the problem independently. Do not give away the answer.
    Also, provide general guidance and strategies for solving this type of problem.
    
    Format the hints as a numbered list.
    `;
    const response = await ai.generate({
        model: getModel(input.model),
        prompt: prompt,
        output: {
            schema: HintsSchema,
        },
        config: {
            safetySettings,
        }
    });

    return {
      ...response.output!,
      totalTokens: response.usage.totalTokens,
    }
  }
);
