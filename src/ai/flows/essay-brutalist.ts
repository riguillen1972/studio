import { ai, geminiFlash } from "../genkit";
import { z } from "zod";

export const EssayBrutalistInput = z.object({
  essayText: z.string(),
  groundingContext: z.string().optional(),
});

export const essayBrutalist = ai.defineFlow(
  {
    name: "essayBrutalist",
    inputSchema: EssayBrutalistInput,
    outputSchema: z.object({
      brutalFeedback: z.string(),
      fluffWordsFound: z.array(z.string()),
      restructuredParagraph: z.string()
    }),
  },
  async ({ essayText, groundingContext }) => {
    let prompt = `
    You are the Essay Brutalist. Your job is to tear down weak, fluffy essays and rebuild them stronger.
    Review the following essay draft:
    "${essayText}"
    
    1. Provide direct, harsh (but constructive) feedback on its logic and clarity.
    2. List the unnecessary "fluff" words you found.
    3. Rewrite their weakest paragraph to be punchy and direct.
    `;

    if (groundingContext) {
      prompt += `\n\nEnsure your feedback holds the essay to the standards of this Context Pack (e.g. rubric):\n${groundingContext}`;
    }

    const { output } = await ai.generate({
      model: geminiFlash,
      prompt: prompt,
      output: {
        schema: z.object({
          brutalFeedback: z.string(),
          fluffWordsFound: z.array(z.string()),
          restructuredParagraph: z.string()
        })
      }
    });

    if (!output) throw new Error("Failed to generate Essay Brutalist response.");
    return output;
  }
);
