
'use server';
/**
 * @fileOverview A Genkit flow to generate interactive, text-based mini-apps for learning.
 *
 * - generateMiniApp - A function that creates the initial response for a learning mini-app.
 * - GenerateMiniAppInput - The input type for the generateMiniApp function.
 * - GenerateMiniAppOutput - The return type for the generateMiniApp function.
 */

import {ai, getModel, safetySettings, SupportedModel} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateMiniAppInputSchema = z.object({
  description: z.string().describe('A description of the learning mini-app the user wants to create.'),
  model: z.enum(['flash', 'pro', 'haiku'] as [SupportedModel, ...SupportedModel[]]).optional(),
});
export type GenerateMiniAppInput = z.infer<typeof GenerateMiniAppInputSchema>;

const MiniAppResponseSchema = z.object({
  appResponse: z.string().describe("The initial welcoming and instructional text from the generated mini-app."),
});

const GenerateMiniAppOutputSchema = z.object({
    appResponse: z.string(),
    totalTokens: z.number(),
});
export type GenerateMiniAppOutput = z.infer<typeof GenerateMiniAppOutputSchema>;

export async function generateMiniApp(input: GenerateMiniAppInput): Promise<GenerateMiniAppOutput> {
  return generateMiniAppFlow(input);
}

const generateMiniAppFlow = ai.defineFlow(
  {
    name: 'generateMiniAppFlow',
    inputSchema: GenerateMiniAppInputSchema,
    outputSchema: GenerateMiniAppOutputSchema,
  },
  async (input) => {
    const prompt = `You are an AI that generates the initial starting text for interactive, text-based "mini-apps" for students. The goal of these apps is to help students learn through guided interaction, not by giving away answers.

    Based on the user's request for a mini-app, generate the first message that the app would show to the student. This message should:
    1.  Welcome the student to the mini-app, giving it a creative name based on the request.
    2.  Briefly explain what the app does and what the student will learn.
    3.  Provide the very first question or prompt to get the student started.

    **CRITICAL RULE: The mini-app's design and its initial prompt must NOT provide direct answers to potential problems. It must guide the student to discover concepts and solutions on their own.** For example, instead of "The answer is 42," it should say, "Great question! Let's start by looking at the first variable. What do you notice about it?"

    **User's Mini-App Request:**
    "${input.description}"
    `;

    const response = await ai.generate({
        model: getModel(input.model),
        prompt: prompt,
        output: {
            schema: MiniAppResponseSchema,
        },
        config: {
            safetySettings,
        }
    });

    return {
      appResponse: response.output!.appResponse,
      totalTokens: response.usage.totalTokens,
    };
  }
);
