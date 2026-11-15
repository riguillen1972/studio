// Server-only: facts about the student making an AI request, available to every AI call made
// while handling it (without passing them through each tool's input).

import { AsyncLocalStorage } from "node:async_hooks";

export interface RequestContext {
  /** The teacher's "Class instructions for the AI" for the student's class(es). */
  classInstructions?: string | null;
}

export const requestContext = new AsyncLocalStorage<RequestContext>();
