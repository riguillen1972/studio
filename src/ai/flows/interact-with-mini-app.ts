
'use server';
/**
 * @fileOverview A Genkit flow for continuing interaction with a generated mini-app.
 *
 * - interactWithMiniApp - A function that handles the ongoing conversation within a mini-app.
 */

import {ai, getModel, isClaudeModel, safetySettings, SupportedModel} from '@/ai/genkit';
import {z} from 'genkit';
import { summarizeText } from './summarize-text';

const summarizeTextTool = ai.defineTool(
  {
    name: 'summarizeText',
    description: 'Summarizes a given piece of text. Use this if the student provides a long text and asks for a summary.',
    inputSchema: z.object({ text: z.string().describe('The text to summarize.') }),
    outputSchema: z.string(),
  },
  async (input) => {
    // This tool calls another flow.
    const result = await summarizeText({ text: input.text, model: 'flash' }); // Use flash to be economical
    return result.summary;
  }
);

const ConversationTurnSchema = z.object({
  role: z.enum(['user', 'app']),
  content: z.string(),
});

const InteractWithMiniAppInputSchema = z.object({
  appDescription: z.string().describe('The original description of the mini-app.'),
  conversationHistory: z.array(ConversationTurnSchema).describe('The history of the conversation so far.'),
  userInput: z.string().describe("The user's latest message."),
  model: z.enum(['gemma3', 'flash', 'pro', 'haiku'] as [SupportedModel, ...SupportedModel[]]).optional(),
  allowLLM: z.boolean().describe('Whether the mini-app is allowed to use other AI models as tools.'),
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
    const genericPersonality = `You are an AI that is running an interactive, text-based "mini-app" for a student. Your primary goal is to guide the student to discover concepts and solutions on their own.`;

    // Build the full prompt including conversation history context
    const historyText = input.conversationHistory
      .map(turn => `${turn.role === 'user' ? 'Student' : 'App'}: ${turn.content}`)
      .join('\n');

    const prompt = `${genericPersonality}
    
    You are continuing a conversation within the mini-app. The original request for the app was: "${input.appDescription}"
    ${input.allowLLM ? `
**AI Capabilities Enabled:** You have access to AI tools. If the student's request matches a tool's description (like asking for a summary), you should use the tool to fulfill their request.` : ''}

    Your task is to generate the next response for the mini-app based on the conversation history and the student's latest input.

    **CRITICAL RULES:**
    1.  Stay in character. Be flexible and adapt your responses to the student's input to make the experience collaborative.
    2.  **DO NOT provide direct answers to problems.** Ask guiding questions, provide hints, and explain underlying principles.
    3.  Make the interaction engaging and educational.

    **Conversation History:**
    ${historyText}

    **Student's Latest Message:**
    ${input.userInput}
    `;

    const modelStr = getModel(input.model);
    const isClaude = isClaudeModel(modelStr);

    // Claude doesn't support structured output, so handle differently
    const generateOpts: Record<string, unknown> = {
        model: modelStr,
        prompt: isClaude ? prompt + '\n\nRespond with ONLY a JSON object like: {"appResponse": "your response here"}' : prompt,
        config: isClaude ? {} : { safetySettings },
    };
    if (!isClaude) {
        generateOpts.tools = input.allowLLM ? [summarizeTextTool] : [];
        generateOpts.output = { schema: MiniAppResponseSchema };
    }

    const response = await ai.generate(generateOpts as Parameters<typeof ai.generate>[0]);

    let appResponse: string;
    if (isClaude) {
        try {
            let text = response.text.trim();
            if (text.startsWith('```')) {
                text = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
            }
            const parsed = JSON.parse(text);
            appResponse = parsed.appResponse || text;
        } catch {
            appResponse = response.text;
        }
    } else if (!response.output?.appResponse) {
        return { appResponse: "I had trouble processing that request. Please try again.", totalTokens: response.usage.totalTokens ?? 0 };
    } else {
        appResponse = response.output.appResponse;
    }

    return {
      appResponse,
      totalTokens: response.usage.totalTokens ?? 0,
    };
  }
);
