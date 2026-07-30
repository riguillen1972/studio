import { ai, geminiFlash } from "../genkit";
import { z } from "zod";

export const CuriosityInput = z.object({
  topic: z.string(),
  depth: z.number().int().min(1).max(3).describe("Depth of the rabbit hole (1-3)"),
});

export const curiosityRabbitHole = ai.defineFlow(
  {
    name: "curiosityRabbitHole",
    inputSchema: CuriosityInput,
    outputSchema: z.object({
      fascinatingFact: z.string(),
      deepDive: z.string(),
      nextRabbitHole: z.string()
    }),
  },
  async ({ topic, depth }) => {
    let prompt = `
    You are the Curiosity Rabbit Hole guide. The user wants to go down a rabbit hole about "${topic}" at depth level ${depth}.
    
    Level 1: Interesting surface-level facts.
    Level 2: Weird, obscure history or science behind it.
    Level 3: Mind-bending, existential, or highly complex aspects of the topic.
    
    Return a fascinating fact, a short deep dive paragraph, and a suggestion for the next related rabbit hole to explore.
    `;

    const { output } = await ai.generate({
      model: geminiFlash,
      prompt: prompt,
      output: {
        schema: z.object({
          fascinatingFact: z.string(),
          deepDive: z.string(),
          nextRabbitHole: z.string()
        })
      }
    });

    if (!output) throw new Error("Failed to generate curiosity response.");
    return output;
  }
);
