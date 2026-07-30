import { ai, geminiFlash } from "../genkit";
import { z } from "zod";

export const DebateModeInput = z.object({
  topic: z.string(),
  userArgument: z.string(),
  groundingContext: z.string().optional(),
});

export const debateMode = ai.defineFlow(
  {
    name: "debateMode",
    inputSchema: DebateModeInput,
    outputSchema: z.object({
      counterArgument: z.string(),
      feedback: z.string()
    }),
  },
  async ({ topic, userArgument, groundingContext }) => {
    let prompt = `
    You are in Debate Mode. The user is practicing their understanding of "${topic}" by debating you.
    User's Argument: "${userArgument}"
    
    1. Provide a strong, logical counter-argument to test their knowledge.
    2. Provide brief feedback on the strength of their argument.
    `;

    if (groundingContext) {
      prompt += `\n\nEnsure your counter-arguments are grounded in the following teacher-provided Context Pack:\n${groundingContext}`;
    }

    const { output } = await ai.generate({
      model: geminiFlash,
      prompt: prompt,
      output: {
        schema: z.object({
          counterArgument: z.string(),
          feedback: z.string()
        })
      }
    });

    if (!output) throw new Error("Failed to generate debate response.");
    return output;
  }
);
