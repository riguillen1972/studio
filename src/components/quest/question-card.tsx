"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

export interface QuestQuestion {
  id: string;
  skill_id: string;
  skill_name: string;
  kind: "multiple_choice" | "numeric";
  stem: string;
  choices: string[] | null;
}

/** One question: choice buttons or a number box. Calls onSubmit with the answer and seconds spent. */
export function QuestionCard({ question, onSubmit, disabled, submitLabel = "Check" }: {
  question: QuestQuestion;
  onSubmit: (response: string, seconds: number) => void;
  disabled?: boolean;
  submitLabel?: string;
}) {
  const [response, setResponse] = useState("");
  const shownAt = useRef(Date.now());

  useEffect(() => {
    setResponse("");
    shownAt.current = Date.now();
  }, [question.id]);

  const submit = () => {
    if (!response.trim() || disabled) return;
    onSubmit(response.trim(), Math.round((Date.now() - shownAt.current) / 1000));
  };

  return (
    <div className="space-y-4">
      <p className="text-lg leading-relaxed whitespace-pre-wrap">{question.stem}</p>
      {question.kind === "multiple_choice" && question.choices ? (
        <div className="grid gap-2 sm:grid-cols-2">
          {question.choices.map((choice) => (
            <button
              key={choice}
              type="button"
              disabled={disabled}
              onClick={() => setResponse(choice)}
              className={`rounded-lg border-2 p-3 text-left text-base transition-colors ${
                response === choice ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
              }`}
            >
              {choice}
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-1">
          <Input
            autoFocus
            inputMode="text"
            placeholder="Type your answer, e.g. 3/4, -2, or 1.5"
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
            disabled={disabled}
            className="max-w-xs text-lg"
          />
          <p className="text-xs text-muted-foreground">Fractions, decimals and negative numbers all work.</p>
        </div>
      )}
      <Button onClick={submit} disabled={!response.trim() || disabled} size="lg">
        {disabled ? <Loader2 className="h-4 w-4 animate-spin" /> : submitLabel}
      </Button>
    </div>
  );
}
