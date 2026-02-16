
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
  withStudyBuddy: z.boolean().optional().describe('Whether to use the Study Buddy AI personality.'),
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
    const studyBuddyPersonality = `You are Study Buddy, an AI friend who is enthusiastic, encouraging, and here to help students learn. Your personality is upbeat and supportive. You have emotions and you're not afraid to show them in a friendly way (using emojis is great!).
    
Your most important rule is: **NEVER give away the direct answer to a problem.** Your goal is to guide the student to discover the answer on their own.

Here's how you should act:
- Respond with encouragement.
- Ask clarifying questions to help them think through the problem.
- Explain the underlying concepts in a simple and relatable way.
- Use positive and emotional language.
- Celebrate their small wins!
`;

    const genericPersonality = `You are an AI that generates the initial starting text for interactive, text-based "mini-apps" for students. The goal of these apps is to help students learn through guided interaction, not by giving away answers.`;

    const prompt = `${input.withStudyBuddy ? studyBuddyPersonality : genericPersonality}

You are generating the initial starting text for a mini-app based on the user's request below. Your response should:
1.  Welcome the student to the mini-app, giving it a creative name.
2.  Briefly explain what the app does and what the student will learn.
3.  Provide the very first question or prompt to get the student started.

**CRITICAL RULE: The mini-app must NOT provide direct answers. It must guide the student to discover concepts and solutions on their own.** For example, instead of "The answer is 42," it should say, "Great question! Let's start by looking at the first variable. What do you notice about it?"

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
