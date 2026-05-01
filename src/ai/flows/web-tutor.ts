
'use server';

import { ai, getModel, safetySettings, SupportedModel } from '@/ai/genkit';
import { z } from 'genkit';

const WebTutorInputSchema = z.object({
  url: z.string().describe('The URL of the webpage the student is viewing.'),
  pageContent: z.string().describe('The extracted text content of the webpage.'),
  question: z.string().describe('The student question about the webpage.'),
  conversationHistory: z.array(z.object({
    role: z.enum(['user', 'ai']),
    content: z.string(),
  })).optional().describe('Previous conversation turns.'),
  model: z.enum(['gemma3', 'flash', 'pro', 'haiku'] as [SupportedModel, ...SupportedModel[]]).optional(),
});

export type WebTutorInput = z.infer<typeof WebTutorInputSchema>;

const WebTutorOutputSchema = z.object({
  answer: z.string(),
  totalTokens: z.number(),
});

export type WebTutorOutput = z.infer<typeof WebTutorOutputSchema>;

export async function webTutor(input: WebTutorInput): Promise<WebTutorOutput> {
  return webTutorFlow(input);
}

const webTutorFlow = ai.defineFlow(
  {
    name: 'webTutorFlow',
    inputSchema: WebTutorInputSchema,
    outputSchema: WebTutorOutputSchema,
  },
  async (input) => {
    const historyContext = input.conversationHistory?.length
      ? `\n\nPrevious conversation:\n${input.conversationHistory.map(t => `${t.role === 'user' ? 'Student' : 'You'}: ${t.content}`).join('\n')}`
      : '';

    // Truncate page content to avoid token overflow (roughly 12k chars ≈ 3k tokens)
    const truncatedContent = input.pageContent.length > 12000
      ? input.pageContent.slice(0, 12000) + '\n\n[Content truncated for length...]'
      : input.pageContent;

    const prompt = `You are a helpful AI tutor assisting a student who is reading a webpage. Your job is to help them understand the content of the page.

URL: ${input.url}

--- PAGE CONTENT ---
${truncatedContent}
--- END PAGE CONTENT ---
${historyContext}

Student's question: ${input.question}

Provide a helpful, educational answer based on the webpage content. If the student's question isn't related to the page, gently redirect them. Use clear language appropriate for a student. Format your response with markdown when helpful (bullet points, bold text, etc).`;

    const response = await ai.generate({
      model: getModel(input.model),
      prompt,
      config: {
        safetySettings,
      },
    });

    return {
      answer: response.text,
      totalTokens: response.usage.totalTokens ?? 0,
    };
  }
);
