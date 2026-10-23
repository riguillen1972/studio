
'use server';

/**
 * @fileOverview Homework help from a photo of the student's work.
 *
 * Teaches the student how to solve the problem (the idea, a step-by-step walkthrough of their
 * own problem, and feedback on their work) without ever giving the final answer.
 *
 * @interface ScanHomeworkInput - The input type for the scanHomework function.
 * @interface ScanHomeworkOutput - The output type for the scanHomework function.
 * @function scanHomework - The main function that orchestrates the homework scanning flow.
 */

import {ai, smartGenerate, getModel, safetySettings, SupportedModel} from '@/ai/genkit';
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
  model: z.enum(['gemma3', 'flash', 'pro', 'haiku'] as [SupportedModel, ...SupportedModel[]]).optional(),
});

export type ScanHomeworkInput = z.infer<typeof ScanHomeworkInputSchema>;

const HelpSchema = z.object({
  problem: z.string().describe('In one or two sentences, what the problem is asking.'),
  explanation: z.string().describe('The idea or method needed, explained simply for this grade level.'),
  steps: z.array(z.string()).describe("Step-by-step walkthrough of the student's own problem. Stops before the final answer; the last step tells the student what to do to finish."),
  feedback: z.string().describe("What is right or wrong in the work shown in the photo. Empty string if no work is shown."),
  check: z.string().describe('How the student can check their own answer once they finish.'),
});

const ScanHomeworkOutputSchema = HelpSchema.extend({
  // Older app versions read these
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
    const promptText = `You are a patient tutor helping a student in grade ${input.gradeLevel} with ${input.subject} homework. They sent a photo of the problem and their work, and asked:

${input.question}

Teach them how to solve it, using their actual problem (not a different example):
- Explain the idea or method they need in simple words for their grade.
- Walk through the solution step by step on their problem, showing the method and the setup, but stop before the final answer. Never state the final answer, the final number, the correct choice, or a finished sentence they could copy. The last step should tell them what to do to finish on their own.
- If the photo shows their work, say what they did right and point out any mistake and why, without fixing it for them.
- Tell them how to check their answer once they have it.
If the photo has several problems, help with the one they asked about (or the first one). Be accurate about the problem; don't describe how many steps it takes unless you're sure.`;

    const prompt = [
      { text: promptText },
      { media: { url: input.photoDataUri } }
    ];

    const response = await smartGenerate({
        model: getModel(input.model),
        maxOutputTokens: 3000,
        effort: 'medium',
        prompt: prompt,
        output: {
            schema: HelpSchema,
        },
        config: {
            safetySettings,
        }
    });

    const help = response.output!;
    return {
      ...help,
      hints: help.steps,
      guidance: help.explanation,
      totalTokens: response.usage.totalTokens ?? 0,
    };
  }
);
