import { ai, geminiFlash } from "../genkit";
import { z } from "zod";

export const FeynmanModeInput = z.object({
  concept: z.string(),
  userExplanation: z.string(),
  groundingContext: z.string().optional(),
});

export const feynmanMode = ai.defineFlow(
  {
    name: "feynmanMode",
    inputSchema: FeynmanModeInput,
    outputSchema: z.object({
      jargonFound: z.array(z.string()),
      feedback: z.string(),
      simpleExplanation: z.string()
    }),
  },
  async ({ concept, userExplanation, groundingContext }) => {
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

    const { output } = await ai.generate({
      model: geminiFlash,
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
    return output;
  }
);
