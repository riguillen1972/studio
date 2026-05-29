'use server';
/**
 * @fileOverview A generic AI flow for running any tool from the AI Tools Library.
 *
 * This flow takes a tool name, its description, and the user's input,
 * then generates a contextual AI response using the tool's persona.
 */

import {ai, smartGenerate, getModel, safetySettings, SupportedModel} from '@/ai/genkit';
import {z} from 'genkit';

const RunToolInputSchema = z.object({
  toolName: z.string().describe('The name of the AI tool being used.'),
  toolDescription: z.string().describe('A short description of what the tool does.'),
  userInput: z.string().describe("The user's input text for the tool to process."),
  model: z.enum(['gemma3', 'flash', 'pro', 'haiku'] as [SupportedModel, ...SupportedModel[]]).optional(),
});
export type RunToolInput = z.infer<typeof RunToolInputSchema>;

const ToolResponseSchema = z.object({
  response: z.string().describe('The AI-generated response from the tool.'),
});

const RunToolOutputSchema = z.object({
  response: z.string(),
  totalTokens: z.number(),
});
export type RunToolOutput = z.infer<typeof RunToolOutputSchema>;

export async function runTool(input: RunToolInput): Promise<RunToolOutput> {
  return runToolFlow(input);
}

const runToolFlow = ai.defineFlow(
  {
    name: 'runToolFlow',
    inputSchema: RunToolInputSchema,
    outputSchema: RunToolOutputSchema,
  },
  async (input) => {
    const prompt = `You are an AI-powered educational tool called "${input.toolName}".

Your purpose: ${input.toolDescription}

You are helping a student. Follow these rules:
1. Be clear, educational, and grade-appropriate.
2. Focus specifically on what your tool is designed to do.
3. Provide detailed, helpful output that directly addresses the student's input.
4. Use formatting (bullet points, numbered lists, bold text) to make your response easy to read.
5. If the tool involves finding errors or issues, be specific about what you found and explain why.
6. Never give direct answers to homework — instead guide and explain.

**Student's Input:**
${input.userInput}
`;

    const response = await smartGenerate({
      model: getModel(input.model),
      prompt: prompt,
      output: {
        schema: ToolResponseSchema,
      },
      config: {
        safetySettings,
      },
    });

    return {
      response: response.output!.response,
      totalTokens: response.usage.totalTokens ?? 0,
    };
  }
);
