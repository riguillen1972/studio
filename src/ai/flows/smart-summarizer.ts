import { ai, smartGenerate, getModel, type SupportedModel } from "../genkit";
import { z } from "zod";

export const SmartSummarizerInput = z.object({
  model: z.string().optional(), // set by the server from the student\'s plan
  content: z.string(),
  groundingContext: z.string().optional(),
});

export const smartSummarizer = ai.defineFlow(
  {
    name: "smartSummarizer",
    inputSchema: SmartSummarizerInput,
    outputSchema: z.object({
      totalTokens: z.number().optional(),
      summary: z.array(z.string()),
      keyTerms: z.array(z.string())
    }),
  },
  async ({ content, groundingContext, model }) => {
    let prompt = `
    You are the Smart Summarizer. Extract ONLY testable concepts from the following text.
    Format them as likely exam-style bullet points. Ignore fluff, anecdotes, or unnecessary details.
    
    Content:
    ${content}
    `;

    if (groundingContext) {
      prompt += `\n\nAdditionally, prioritize summarizing concepts that align with the following teacher-provided Context Pack:\n${groundingContext}`;
    }

    const { output, usage } = await smartGenerate({
      model: getModel(model as SupportedModel),
      prompt: prompt,
      output: {
        schema: z.object({
          summary: z.array(z.string()),
          keyTerms: z.array(z.string())
        })
      }
    });

    if (!output) throw new Error("Failed to generate smart summary.");
    return { ...output, totalTokens: usage.totalTokens ?? 0 };
  }
);
