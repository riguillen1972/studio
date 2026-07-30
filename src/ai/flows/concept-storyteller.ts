import { ai, geminiFlash } from "../genkit";
import { z } from "zod";

export const ConceptStorytellerInput = z.object({
  concept: z.string(),
  groundingContext: z.string().optional(),
});

export const conceptStoryteller = ai.defineFlow(
  {
    name: "conceptStoryteller",
    inputSchema: ConceptStorytellerInput,
    outputSchema: z.object({
      story: z.string(),
      analogy: z.string()
    }),
  },
  async ({ concept, groundingContext }) => {
    let prompt = `
    You are the Concept Storyteller. Take the concept "${concept}" and turn it into an engaging, memorable story.
    Use vivid imagery and strong narrative structure to make the facts unforgettable.
    Also provide a simple, 1-sentence analogy.
    `;

    if (groundingContext) {
      prompt += `\n\nEnsure the story aligns with the following teacher-provided Context Pack:\n${groundingContext}`;
    }

    const { output } = await ai.generate({
      model: geminiFlash,
      prompt: prompt,
      output: {
        schema: z.object({
          story: z.string(),
          analogy: z.string()
        })
      }
    });

    if (!output) throw new Error("Failed to generate concept story.");
    return output;
  }
);
