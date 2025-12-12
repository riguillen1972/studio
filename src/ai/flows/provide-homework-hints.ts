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

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ProvideHomeworkHintsInputSchema = z.object({
  problem: z.string().describe('The homework problem to get hints for.'),
  subject: z.string().describe('The subject of the homework problem.'),
  gradeLevel: z.string().describe('The grade level of the student.'),
});

export type ProvideHomeworkHintsInput = z.infer<typeof ProvideHomeworkHintsInputSchema>;

const ProvideHomeworkHintsOutputSchema = z.object({
  hints: z.array(z.string()).describe('An array of hints to help the student solve the problem.'),
  guidance: z.string().describe('General guidance and strategies for solving this type of problem.'),
});

export type ProvideHomeworkHintsOutput = z.infer<typeof ProvideHomeworkHintsOutputSchema>;

export async function provideHomeworkHints(input: ProvideHomeworkHintsInput): Promise<ProvideHomeworkHintsOutput> {
  return provideHomeworkHintsFlow(input);
}

const provideHomeworkHintsPrompt = ai.definePrompt({
  name: 'provideHomeworkHintsPrompt',
  input: {schema: ProvideHomeworkHintsInputSchema},
  output: {schema: ProvideHomeworkHintsOutputSchema},
  prompt: `You are an AI homework helper for a student in grade {{gradeLevel}}.

The student is working on a problem in {{subject}}:

Problem: {{{problem}}}

Provide a few hints to help the student solve the problem independently. Do not give away the answer.
Also, provide general guidance and strategies for solving this type of problem.

Format the hints as a numbered list.
`,
});

const provideHomeworkHintsFlow = ai.defineFlow(
  {
    name: 'provideHomeworkHintsFlow',
    inputSchema: ProvideHomeworkHintsInputSchema,
    outputSchema: ProvideHomeworkHintsOutputSchema,
  },
  async input => {
    const {output} = await provideHomeworkHintsPrompt(input);
    return output!;
  }
);
