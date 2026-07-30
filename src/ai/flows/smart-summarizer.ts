import { ai, geminiFlash } from "../genkit";
import { z } from "zod";

export const SmartSummarizerInput = z.object({
  content: z.string(),
  groundingContext: z.string().optional(),
});

export const smartSummarizer = ai.defineFlow(
  {
    name: "smartSummarizer",
    inputSchema: SmartSummarizerInput,
    outputSchema: z.object({
      summary: z.array(z.string()),
      keyTerms: z.array(z.string())
    }),
  },
  async ({ content, groundingContext }) => {
    let prompt = `
    You are the Smart Summarizer. Extract ONLY testable concepts from the following text.
    Format them as likely exam-style bullet points. Ignore fluff, anecdotes, or unnecessary details.
    
    Content:
    ${content}
    `;

    if (groundingContext) {
      prompt += `\n\nAdditionally, prioritize summarizing concepts that align with the following teacher-provided Context Pack:\n${groundingContext}`;
    }

    const { output } = await ai.generate({
      model: geminiFlash,
      prompt: prompt,
      output: {
        schema: z.object({
          summary: z.array(z.string()),
          keyTerms: z.array(z.string())
        })
      }
    });

    if (!output) throw new Error("Failed to generate smart summary.");
    return output;
  }
);
