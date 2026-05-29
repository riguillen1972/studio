
'use server';
/**
 * @fileOverview A Genkit flow to generate interactive, text-based mini-apps for learning.
 *
 * - generateMiniApp - A function that creates the initial response for a learning mini-app.
 * - GenerateMiniAppInput - The input type for the generateMiniApp function.
 * - GenerateMiniAppOutput - The return type for the generateMiniApp function.
 */

import {ai, smartGenerate, getModel, safetySettings, SupportedModel} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateMiniAppInputSchema = z.object({
  description: z.string().describe('A description of the learning mini-app the user wants to create.'),
  model: z.enum(['gemma3', 'flash', 'pro', 'haiku'] as [SupportedModel, ...SupportedModel[]]).optional(),
  allowLLM: z.boolean().describe('Whether to allow the mini-app to use other AI models as tools.'),
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
    const genericPersonality = `You are an AI that generates the initial starting text for interactive, text-based "mini-apps" for students. The goal of these apps is to help students learn through guided interaction, not by giving away answers.`;

    const prompt = `${genericPersonality}

You are generating the initial starting text for a mini-app based on the user's request below. Your response should:
1.  Welcome the student to the mini-app, giving it a creative name.
2.  Briefly explain what the app does and what the student will learn.
3.  Provide the very first question or prompt to get the student started.
${input.allowLLM ? `
**This mini-app has AI capabilities!** It can perform tasks like summarizing text. You can let the student know they can ask it to perform these tasks.` : ''}

**CRITICAL RULE: The mini-app must NOT provide direct answers. It must guide the student to discover concepts and solutions on their own.** For example, instead of "The answer is 42," it should say, "Great question! Let's start by looking at the first variable. What do you notice about it?"

**User's Mini-App Request:**
"${input.description}"
`;

    const response = await smartGenerate({
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
      totalTokens: response.usage.totalTokens ?? 0,
    };
  }
);
