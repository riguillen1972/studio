import { ai, smartGenerate, getModel, type SupportedModel } from "../genkit";
import { z } from "zod";

export const MentalModelInput = z.object({
  model: z.string().optional(), // set by the server from the student\'s plan
  topic: z.string(),
  groundingContext: z.string().optional(),
});

export const mentalModel = ai.defineFlow(
  {
    name: "mentalModel",
    inputSchema: MentalModelInput,
    outputSchema: z.object({
      totalTokens: z.number().optional(),
      mentalModelName: z.string(),
      description: z.string(),
      application: z.string()
    }),
  },
  async ({ topic, groundingContext, model }) => {
    let prompt = `
    You are the Mental Model Builder. The user is studying "${topic}".
    Provide a powerful, pre-existing mental model (e.g. First Principles, Inversion, Opportunity Cost) that best applies to this topic.
    Explain the model and how they can apply it to understand the topic deeply.
    `;

    if (groundingContext) {
      prompt += `\n\nEnsure your response aligns with this Context Pack:\n${groundingContext}`;
    }

    const { output, usage } = await smartGenerate({
      model: getModel(model as SupportedModel),
      prompt: prompt,
      output: {
        schema: z.object({
          mentalModelName: z.string(),
          description: z.string(),
          application: z.string()
        })
      }
    });

    if (!output) throw new Error("Failed to generate Mental Model response.");
    return { ...output, totalTokens: usage.totalTokens ?? 0 };
  }
);
