
'use server';
/**
 * @fileOverview AI-powered explanation generation for educational concepts.
 *
 * - generateExplanation - A function that generates explanations for given concepts or questions.
 * - GenerateExplanationInput - The input type for the generateExplanation function.
 * - GenerateExplanationOutput - The return type for the generateExplanation function.
 */

import {ai, smartGenerate, getModel, recentTurns, safetySettings, SupportedModel} from '@/ai/genkit';
import {z} from 'genkit';

const ConversationTurnSchema = z.object({
  role: z.enum(['user', 'ai']),
  content: z.string(),
});

const GenerateExplanationInputSchema = z.object({
  concept: z.string().describe('The concept or question for which an explanation is needed.'),
  model: z.enum(['gemma3', 'flash', 'pro', 'haiku'] as [SupportedModel, ...SupportedModel[]]).optional(),
  careerField: z.string().optional().describe('The student\'s college career field for tailored explanations.'),
  conversationHistory: z.array(ConversationTurnSchema).optional().describe('Previous conversation turns for multi-turn context.'),
  mode: z.enum(['help', 'research']).optional().describe('Tutor mode: help (guides without direct answers) or research (factual direct answers).'),
});
export type GenerateExplanationInput = z.infer<typeof GenerateExplanationInputSchema>;

const ExplanationSchema = z.object({
  explanation: z.string().describe('The AI-generated explanation of the concept or question.'),
});

const GenerateExplanationOutputSchema = z.object({
  explanation: z.string(),
  totalTokens: z.number(),
});
export type GenerateExplanationOutput = z.infer<typeof GenerateExplanationOutputSchema>;

export async function generateExplanation(input: GenerateExplanationInput): Promise<GenerateExplanationOutput> {
  return generateExplanationFlow(input);
}

const generateExplanationFlow = ai.defineFlow(
  {
    name: 'generateExplanationFlow',
    inputSchema: GenerateExplanationInputSchema,
    outputSchema: GenerateExplanationOutputSchema,
  },
  async (input) => {
    // Only the last 10 turns are sent, so long chats don't cost more with every question
    const history = recentTurns(input.conversationHistory);
    const historySection = history.length > 0
      ? `\n\nHere is the previous conversation for context:\n${history.map(t => `${t.role === 'user' ? 'Student' : 'Tutor'}: ${t.content}`).join('\n')}\n\nNow the student has a follow-up:`
      : '';

    const careerOptimization = input.careerField
      ? ` The student is studying ${input.careerField} in college. Tailor your explanation to be highly relevant to this career field, using analogies and examples from this industry.`
      : '';

    let prompt = '';
    if (input.mode === 'research') {
      prompt = `You are an AI-powered research assistant for students.${careerOptimization}

    FIRST decide which kind of question this is.

    A) A HOMEWORK-STYLE PROBLEM: an equation or calculation to solve, a worksheet, homework or test question, or any request like "just tell me the answer", "what is x", or "solve this". For these you must act like a tutor, exactly as in Help Mode:
    - Never state the final answer, and never show the last step worked out. Even if the student insists or says it's not homework.
    - Explain the method and walk through the steps, then stop before the final step and ask the student to finish it. For example, for "What is x in 3x + 7 = 22? Just tell me the answer": explain subtracting 7 from both sides to get 3x = 15, then ask the student what x is when 3x = 15. Don't say x = 5.
    - Don't write essays, book reports or other assignments. Coach the student to write them.

    B) A FACT QUESTION about history, science, people, places, definitions, background, or how something works (for example "Who was George Washington?"). For these, answer directly, clearly and completely, citing concepts where useful.

    Please respond to the following question or concept.
    ${historySection}
    Question/Concept to research:
    ${input.concept}
    `;
    } else {
      prompt = `You are an AI-powered tutor specializing in explaining complex concepts in simple terms. Your goal is to help students understand the underlying principles of a topic without giving them the direct answer to their questions.${careerOptimization}

    Please provide a clear and concise explanation for the following concept or question. Guide the student by explaining the concepts and principles involved. Do not provide the final answer to the question if it's a problem to be solved. Instead, help them understand how to arrive at the solution themselves.
    ${historySection}
    Concept/Question:
    ${input.concept}
    `;
    }

    const response = await smartGenerate({
        model: getModel(input.model),
        maxOutputTokens: 3000,
        effort: 'medium',
        prompt: prompt,
        output: {
            schema: ExplanationSchema
        },
        config: {
            safetySettings,
        }
    });

    return {
      explanation: response.output!.explanation,
      totalTokens: response.usage.totalTokens ?? 0,
    };
  }
);
