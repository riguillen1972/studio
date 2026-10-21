import { ai, smartGenerate, getModel, type SupportedModel } from "../genkit";
import { z } from "zod";

export const FeynmanModeInput = z.object({
  model: z.string().optional(), // set by the server from the student\'s plan
  concept: z.string(),
  userExplanation: z.string(),
  groundingContext: z.string().optional(),
});

export const feynmanMode = ai.defineFlow(
  {
    name: "feynmanMode",
    inputSchema: FeynmanModeInput,
    outputSchema: z.object({
      totalTokens: z.number().optional(),
      jargonFound: z.array(z.string()),
      feedback: z.string(),
      simpleExplanation: z.string()
    }),
  },
  async ({ concept, userExplanation, groundingContext, model }) => {
    let prompt = `
    You are the Feynman Teacher. The user is trying to explain "${concept}" to a 10-year-old.
    User's explanation: "${userExplanation}"
    
    1. Identify any complex jargon they used.
    2. Provide feedback on where their understanding is shaky.
    3. Provide the ideal simple explanation.
    `;

    if (groundingContext) {
      prompt += `\n\nEnsure your feedback aligns with this Context Pack:\n${groundingContext}`;
    }

    const { output, usage } = await smartGenerate({
      model: getModel(model as SupportedModel),
      prompt: prompt,
      output: {
        schema: z.object({
          jargonFound: z.array(z.string()),
          feedback: z.string(),
          simpleExplanation: z.string()
        })
      }
    });

    if (!output) throw new Error("Failed to generate Feynman Mode response.");
    return { ...output, totalTokens: usage.totalTokens ?? 0 };
  }
);
