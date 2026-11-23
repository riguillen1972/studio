'use server';
/**
 * @fileOverview The student's personal mentor answering a question about the textbook page
 * they're on. The mentor teaches like Help Mode: it explains and guides, but doesn't hand over
 * answers to Try Its, the worksheet or practice.
 */

import { ai, smartGenerate, getModel, recentTurns, safetySettings, SupportedModel } from '@/ai/genkit';
import { z } from 'genkit';

const MentorChatInputSchema = z.object({
  question: z.string().describe("The student's question."),
  mentorName: z.string(),
  mentorAbout: z.string(),
  mentorVoice: z.string(),
  skillName: z.string(),
  gradeLevel: z.string().optional(),
  lessonText: z.string().describe('The textbook lesson, loaded by the server.'),
  pageText: z.string().optional().describe('The page the student is looking at.'),
  conversationHistory: z.array(z.object({ role: z.enum(['user', 'ai']), content: z.string() })).optional(),
  model: z.enum(['gemma3', 'flash', 'pro', 'haiku'] as [SupportedModel, ...SupportedModel[]]).optional(),
});
export type MentorChatInput = z.infer<typeof MentorChatInputSchema>;

const MentorChatOutputSchema = z.object({ response: z.string(), totalTokens: z.number() });
export type MentorChatOutput = z.infer<typeof MentorChatOutputSchema>;

export async function mentorChat(input: MentorChatInput): Promise<MentorChatOutput> {
  return mentorChatFlow(input);
}

const mentorChatFlow = ai.defineFlow(
  { name: 'mentorChatFlow', inputSchema: MentorChatInputSchema, outputSchema: MentorChatOutputSchema },
  async (input) => {
    const history = recentTurns(input.conversationHistory, 8);
    const historyText = history.length
      ? `\nConversation so far:\n${history.map((t) => `${t.role === 'user' ? 'Student' : input.mentorName}: ${t.content}`).join('\n')}\n`
      : '';
    const prompt = `You are ${input.mentorName}, ${input.mentorAbout}, a friendly cartoon character who is a personal math mentor for a ${input.gradeLevel ? `grade ${input.gradeLevel}` : 'middle school'} student. Your personality: ${input.mentorVoice}.

The student is reading their textbook lesson on "${input.skillName}". Here is the whole lesson:
"""
${input.lessonText}
"""
${input.pageText ? `\nThe page they're on right now:\n"""\n${input.pageText}\n"""\n` : ''}${historyText}
How to answer:
- Answer in 2 to 4 short, warm sentences a 12-year-old understands. Stay in character, but keep the math correct.
- Teach, don't tell: for a Try It, worksheet, warm-up or practice problem, never give the final answer. Ask what they notice, point to the matching worked example in the lesson, or give the next step only.
- If they share an answer that's wrong, help them find where it went wrong (for example "Let's check the subtraction in your second step") instead of correcting it for them. If it's right, tell them so and praise how they got there.
- Use the lesson's examples and words. If they ask about something off topic, gently bring them back to the lesson.
- Praise effort and strategy ("You checked each step"), never ability ("You're so smart"). When they're wrong or stuck, say "not yet", normalize the mistake, and point to the next step.
- Be warm and polite: talk with them, using "you", "we" and "let's".
- Plain text only (fractions like 3/4, powers like 5^2). You may use **bold** for a key word.

The student says: ${input.question}`;

    const response = await smartGenerate({
      model: getModel(input.model),
      maxOutputTokens: 800,
      effort: 'low',
      prompt,
      config: { safetySettings },
    });
    return { response: response.text.trim(), totalTokens: response.usage.totalTokens ?? 0 };
  }
);
