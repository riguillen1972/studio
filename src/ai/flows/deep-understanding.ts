import { ai, smartGenerate, getModel, type SupportedModel } from "../genkit";
import { z } from "zod";

export const DeepUnderstandingInput = z.object({
  model: z.string().optional(), // set by the server from the student\'s plan
  topic: z.string(),
  groundingContext: z.string().optional(),
});

export const deepUnderstanding = ai.defineFlow(
  {
    name: "deepUnderstanding",
    inputSchema: DeepUnderstandingInput,
    outputSchema: z.object({
      totalTokens: z.number().optional(),
      corePrinciple: z.string(),
      whyItMatters: z.string(),
      commonMisconceptions: z.array(z.string())
    }),
  },
  async ({ topic, groundingContext, model }) => {
    let prompt = `
    You are the Deep Understanding coach. Help the student move past memorization for "${topic}".
    Identify the core first principles, explain why this concept matters in the real world, and list common misconceptions students have.
    `;

    if (groundingContext) {
      prompt += `\n\nEnsure your response aligns with this Context Pack:\n${groundingContext}`;
    }

    const { output, usage } = await smartGenerate({
      model: getModel(model as SupportedModel),
      prompt: prompt,
      output: {
        schema: z.object({
          corePrinciple: z.string(),
          whyItMatters: z.string(),
          commonMisconceptions: z.array(z.string())
        })
      }
    });

    if (!output) throw new Error("Failed to generate Deep Understanding response.");
    return { ...output, totalTokens: usage.totalTokens ?? 0 };
  }
);
