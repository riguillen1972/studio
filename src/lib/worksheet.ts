// Server-only: AI worksheet generation for teachers (Teacher Max).
// Uses Claude Haiku 5.5 (the model Max already includes) with structured outputs,
// so the worksheet always comes back in the exact shape the app renders.

import Anthropic from "@anthropic-ai/sdk";
import { jsonSchemaOutputFormat } from "@anthropic-ai/sdk/helpers/json-schema";
import type { Worksheet } from "@/lib/worksheet-format";

export const WORKSHEET_MODEL = "claude-haiku-5-5";

const worksheetFormat = jsonSchemaOutputFormat({
  type: "object",
  additionalProperties: false,
  required: ["title", "instructions", "questions"],
  properties: {
    title: { type: "string" },
    instructions: { type: "string", description: "Short directions for students" },
    questions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["prompt", "choices", "answer", "explanation"],
        properties: {
          prompt: { type: "string" },
          choices: { type: "array", items: { type: "string" }, description: "Answer options for multiple choice; empty otherwise" },
          answer: { type: "string" },
          explanation: { type: "string", description: "One or two sentences on how to get the answer, for the teacher" },
        },
      },
    },
  },
});

export interface WorksheetRequest {
  request: string;
  grade: string;
  questionCount: number;
  questionStyle: "mixed" | "multiple_choice" | "short_answer" | "word_problems";
}

const STYLES: Record<WorksheetRequest["questionStyle"], string> = {
  mixed: "a mix of multiple choice and short answer questions",
  multiple_choice: "multiple choice questions with 4 choices each",
  short_answer: "short answer questions",
  word_problems: "word problems set in situations students relate to",
};

let client: Anthropic | null = null;
const getClient = () => (client ??= new Anthropic());

export async function generateWorksheet(req: WorksheetRequest): Promise<{ worksheet: Worksheet; totalTokens: number }> {
  const gradeText = req.grade === "college" ? "college students" : `grade ${req.grade} students`;
  const message = await getClient().messages.parse({
    model: WORKSHEET_MODEL,
    max_tokens: 16000,
    output_config: { effort: "medium", format: worksheetFormat },
    system:
      "You write classroom worksheets for teachers. Every question must be accurate, clearly worded, " +
      "age-appropriate and answerable from what students at that level are expected to know. Double-check " +
      "every answer in the answer key. Keep content suitable for school. If the teacher's request is not " +
      "something a school worksheet should cover, write a worksheet on the closest appropriate topic instead.",
    messages: [{
      role: "user",
      content:
        `Write a worksheet for ${gradeText} with exactly ${req.questionCount} questions, using ${STYLES[req.questionStyle]}.\n\n` +
        `<teacher_request>\n${req.request}\n</teacher_request>`,
    }],
  });

  if (message.stop_reason === "refusal" || !message.parsed_output) {
    throw new Error("The AI couldn't create that worksheet. Try rewording your request.");
  }
  const usage = message.usage;
  const totalTokens = (usage.input_tokens ?? 0) + (usage.output_tokens ?? 0)
    + (usage.cache_creation_input_tokens ?? 0) + (usage.cache_read_input_tokens ?? 0);
  return { worksheet: message.parsed_output as Worksheet, totalTokens };
}
