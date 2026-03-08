
'use server';

/**
 * @fileOverview This file defines a Genkit flow for providing homework hints based on an image of the work.
 *
 * It takes a homework problem as an image and text, and returns hints and guidance.
 *
 * @interface ScanHomeworkInput - The input type for the scanHomework function.
 * @interface ScanHomeworkOutput - The output type for the scanHomework function.
 * @function scanHomework - The main function that orchestrates the homework scanning flow.
 */

import {ai, getModel, safetySettings, SupportedModel} from '@/ai/genkit';
import {z} from 'genkit';

const ScanHomeworkInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of the homework problem, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  question: z.string().describe('The specific question the student has about the problem.'),
  subject: z.string().describe('The subject of the homework problem.'),
  gradeLevel: z.string().describe('The grade level of the student.'),
  model: z.enum(['flash', 'pro', 'haiku'] as [SupportedModel, ...SupportedModel[]]).optional(),
});

export type ScanHomeworkInput = z.infer<typeof ScanHomeworkInputSchema>;

const HintsSchema = z.object({
  hints: z.array(z.string()).describe('An array of hints to help the student solve the problem.'),
  guidance: z.string().describe('General guidance and strategies for solving this type of problem.'),
});

const ScanHomeworkOutputSchema = z.object({
  hints: z.array(z.string()),
  guidance: z.string(),
  totalTokens: z.number(),
});

export type ScanHomeworkOutput = z.infer<typeof ScanHomeworkOutputSchema>;

export async function scanHomework(input: ScanHomeworkInput): Promise<ScanHomeworkOutput> {
  return scanHomeworkFlow(input);
}

const scanHomeworkFlow = ai.defineFlow(
  {
    name: 'scanHomeworkFlow',
    inputSchema: ScanHomeworkInputSchema,
    outputSchema: ScanHomeworkOutputSchema,
  },
  async (input) => {
    const prompt = `You are an AI homework helper for a student in grade ${input.gradeLevel}.

    The student is working on a problem in ${input.subject}. They have provided a photo of their work and have the following question:
    
    Question: ${input.question}
    
    Here is the photo of their work:
    {{media url=${input.photoDataUri}}}
    
    Analyze the image and the student's question. Provide a few hints to help the student solve the problem independently. Do not give away the answer.
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
      totalTokens: response.usage.totalTokens ?? 0,
    };
  }
);
