
'use server';
/**
 * @fileOverview A Genkit flow for continuing interaction with a generated mini-app.
 *
 * - interactWithMiniApp - A function that handles the ongoing conversation within a mini-app.
 */

import {ai, getModel, safetySettings, SupportedModel} from '@/ai/genkit';
import {z} from 'genkit';

const ConversationTurnSchema = z.object({
  role: z.enum(['user', 'app']),
  content: z.string(),
});

const InteractWithMiniAppInputSchema = z.object({
  appDescription: z.string().describe('The original description of the mini-app.'),
  conversationHistory: z.array(ConversationTurnSchema).describe('The history of the conversation so far.'),
  userInput: z.string().describe("The user's latest message."),
  withStudyBuddy: z.boolean().optional().describe('Whether to use the Study Buddy AI personality.'),
  model: z.enum(['flash', 'pro', 'haiku'] as [SupportedModel, ...SupportedModel[]]).optional(),
});
export type InteractWithMiniAppInput = z.infer<typeof InteractWithMiniAppInputSchema>;

const MiniAppResponseSchema = z.object({
  appResponse: z.string().describe("The mini-app's response to the user's input."),
});

const InteractWithMiniAppOutputSchema = z.object({
    appResponse: z.string(),
    totalTokens: z.number(),
});
export type InteractWithMiniAppOutput = z.infer<typeof InteractWithMiniAppOutputSchema>;

export async function interactWithMiniApp(input: InteractWithMiniAppInput): Promise<InteractWithMiniAppOutput> {
  return interactWithMiniAppFlow(input);
}

const interactWithMiniAppFlow = ai.defineFlow(
  {
    name: 'interactWithMiniAppFlow',
    inputSchema: InteractWithMiniAppInputSchema,
    outputSchema: InteractWithMiniAppOutputSchema,
  },
  async (input) => {
    const formattedHistory = input.conversationHistory
      .map(turn => `${turn.role === 'user' ? 'Student' : 'App'}: ${turn.content}`)
      .join('\n');

    const studyBuddyPersonality = `You are Study Buddy, an AI friend who is enthusiastic, encouraging, and here to help students learn. Your personality is upbeat and supportive. You have emotions and you're not afraid to show them in a friendly way (using emojis is great!).
    
Your most important rule is: **NEVER give away the direct answer to a problem.** Your goal is to guide the student to discover the answer on their own.

Here's how you should act:
- Respond with encouragement.
- Ask clarifying questions to help them think through the problem.
- Explain the underlying concepts in a simple and relatable way.
- Use positive and emotional language.
- Celebrate their small wins!
`;
    
    const genericPersonality = `You are an AI that is running an interactive, text-based "mini-app" for a student. Your primary goal is to guide the student to discover concepts and solutions on their own.`;

    const prompt = `${input.withStudyBuddy ? studyBuddyPersonality : genericPersonality}
    
    You are continuing a conversation within the mini-app. The original request for the app was: "${input.appDescription}"
    
    Here is the history so far:
    ${formattedHistory}

    The student just said:
    "${input.userInput}"

    Your task is to generate the next response for the mini-app.

    **CRITICAL RULES:**
    1.  Stay in character. Be flexible and adapt your responses to the student's input to make the experience collaborative.
    2.  **DO NOT provide direct answers to problems.** Ask guiding questions, provide hints, and explain underlying principles.
    3.  Make the interaction engaging and educational.
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
