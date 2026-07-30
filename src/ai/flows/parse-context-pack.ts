import { ai, getModel } from "../genkit";
import { z } from "zod";

export const ParseContextPackInput = z.object({
  rawContent: z.string(),
  type: z.enum(['lesson', 'homework', 'quiz', 'rubric']),
});

export const parseContextPack = ai.defineFlow(
  {
    name: "parseContextPack",
    inputSchema: ParseContextPackInput,
    outputSchema: z.object({
      content_parsed: z.string().describe("A structured, cleanly formatted markdown version of the core content."),
      rubric: z.string().optional().describe("If applicable, a grading rubric or core principles to look out for."),
      answer_key: z.string().optional().describe("If applicable, the answers or expected outcomes."),
    }),
  },
  async (input) => {
    let promptText = "";
    
    switch (input.type) {
      case "lesson":
        promptText = `You are a curriculum designer. Take the following raw lesson material and parse it into a clean, structured Markdown study guide. Extract the key learning objectives, vocabulary, and core concepts. If there is a rubric or grading scale mentioned, put it in the rubric field.`;
        break;
      case "homework":
        promptText = `You are a teacher. Parse the following homework assignment. Create a structured Markdown version of the assignment in 'content_parsed'. Then, generate an expected 'answer_key' or 'rubric' based on the questions asked.`;
        break;
      case "quiz":
        promptText = `You are an assessment expert. Parse this quiz content into a clean Markdown format. Generate a comprehensive 'answer_key' for the questions.`;
        break;
      case "rubric":
        promptText = `You are an expert grader. Parse this raw rubric or syllabus grading policy into a highly structured Markdown rubric that an AI tutor could easily use to grade student work.`;
        break;
    }

    promptText += `\n\nRaw Content:\n${input.rawContent}`;

    const { output } = await ai.generate({
      model: getModel('flash'),
      prompt: promptText,
      output: {
        schema: z.object({
          content_parsed: z.string(),
          rubric: z.string().optional(),
          answer_key: z.string().optional(),
        })
      }
    });

    return output;
  }
);
