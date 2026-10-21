import { ai, smartGenerate, getModel, type SupportedModel } from "../genkit";
import { z } from "zod";

export const MakeItClickInput = z.object({
  model: z.string().optional(), // set by the server from the student\'s plan
  concept: z.string(),
  userStruggle: z.string(),
  groundingContext: z.string().optional(),
});

export const makeItClick = ai.defineFlow(
  {
    name: "makeItClick",
    inputSchema: MakeItClickInput,
    outputSchema: z.object({
      totalTokens: z.number().optional(),
      ahaMoment: z.string(),
      visualization: z.string()
    }),
  },
  async ({ concept, userStruggle, groundingContext, model }) => {
    let prompt = `
    The user is struggling to understand "${concept}".
    Their specific struggle: "${userStruggle}"
    
    Provide an "Aha!" moment explanation that directly addresses their struggle. Avoid jargon.
    Then, describe a simple mental visualization or physical experiment they can do to prove it to themselves.
    `;

    if (groundingContext) {
      prompt += `\n\nEnsure your explanation aligns with this Context Pack:\n${groundingContext}`;
    }

    const { output, usage } = await smartGenerate({
      model: getModel(model as SupportedModel),
      prompt: prompt,
      output: {
        schema: z.object({
          ahaMoment: z.string(),
          visualization: z.string()
        })
      }
    });

    if (!output) throw new Error("Failed to generate Make It Click response.");
    return { ...output, totalTokens: usage.totalTokens ?? 0 };
  }
);
