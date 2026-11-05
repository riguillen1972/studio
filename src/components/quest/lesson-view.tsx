"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Markdown } from "@/components/markdown";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useReadAloud } from "@/hooks/use-read-aloud";
import { checkAnswer } from "@/lib/quest/answers";
import type { LessonContent } from "@/lib/quest/lesson-types";
import { AlertTriangle, BookOpen, CheckCircle2, Heart, Lightbulb, Loader2, Pause, Play, Square, Volume2, XCircle } from "lucide-react";
import { questFetch } from "./quest-api";

interface LessonResponse { lesson: LessonContent | null; status: "approved" | "hidden" | null; missing: boolean }

/** Every part of a lesson the voice reads, in order; the index is used to highlight the part being read. */
function readingParts(l: LessonContent): { id: string; text: string }[] {
  return [
    { id: "why", text: `${l.title}. ${l.why}` },
    ...(l.vocabulary.length ? [{ id: "vocab", text: `Words to know. ${l.vocabulary.map((v) => `${v.term}: ${v.meaning}`).join(". ")}.` }] : []),
    ...l.explain.map((p, i) => ({ id: `explain-${i}`, text: p })),
    ...l.examples.map((e, i) => ({
      id: `example-${i}`,
      text: `Example ${i + 1}. ${e.problem} ${e.steps.map((s, j) => `Step ${j + 1}. ${s}`).join(" ")} Answer: ${e.answer}`,
    })),
    { id: "watch", text: `Watch out. ${l.watch_out}` },
    ...(l.faith ? [{ id: "faith", text: l.faith }] : []),
    { id: "check", text: `Your turn. ${l.check.question}` },
  ];
}

/**
 * A skill's lesson: why it matters, the key idea, worked examples revealed step by step, the
 * common mistake, and a quick check, with read-aloud. Writes the lesson first if there isn't one.
 */
export function LessonView({ skillId, onPractice, practiceLabel = "Start practicing", teacher = false }: {
  skillId: string; onPractice?: () => void; practiceLabel?: string; teacher?: boolean;
}) {
  const [data, setData] = useState<LessonResponse | null>(null);
  const [writing, setWriting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const voice = useReadAloud();
  const { stop } = voice;

  const write = useCallback(async () => {
    setWriting(true);
    setError(null);
    try {
      const r = await questFetch<{ lesson: LessonContent; status: "approved" | "hidden" }>(`/api/quest/lessons/${encodeURIComponent(skillId)}`, { method: "POST", body: "{}" });
      setData({ lesson: r.lesson, status: r.status, missing: false });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't write the lesson.");
    } finally {
      setWriting(false);
    }
  }, [skillId]);

  useEffect(() => {
    let cancelled = false;
    setData(null);
    setError(null);
    questFetch<LessonResponse>(`/api/quest/lessons/${encodeURIComponent(skillId)}`)
      .then((r) => {
        if (cancelled) return;
        setData(r);
        if (r.missing && !teacher) write();
      })
      .catch((e) => { if (!cancelled) setError(e instanceof Error ? e.message : "Couldn't load the lesson."); });
    return () => { cancelled = true; stop(); };
  }, [skillId, teacher, write, stop]);

  const practiceButton = onPractice && <Button size="lg" onClick={() => { stop(); onPractice(); }}>{practiceLabel}</Button>;

  if (writing) {
    return (
      <div className="space-y-4 py-8 text-center">
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Writing this lesson and checking its math. This takes about half a minute, only the first time.</p>
        {onPractice && <Button variant="outline" onClick={onPractice}>Skip to practice</Button>}
      </div>
    );
  }
  if (error) {
    return (
      <div className="space-y-3 py-6 text-center">
        <p className="text-sm text-muted-foreground">{error}</p>
        <div className="flex justify-center gap-2">
          <Button variant="outline" onClick={write}>Try again</Button>
          {practiceButton}
        </div>
      </div>
    );
  }
  if (!data) return <div className="flex h-40 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  if (!data.lesson) {
    return (
      <div className="space-y-3 py-6 text-center">
        <p className="text-sm text-muted-foreground">
          {data.status === "hidden" ? "Your teacher has hidden this lesson for now." : "There's no lesson for this skill yet."}
        </p>
        {teacher && data.missing && <Button onClick={write}>Write the lesson</Button>}
        {practiceButton}
      </div>
    );
  }
  return <Lesson lesson={data.lesson} voice={voice} practiceButton={practiceButton} />;
}

function Lesson({ lesson: l, voice, practiceButton }: {
  lesson: LessonContent; voice: ReturnType<typeof useReadAloud>; practiceButton?: React.ReactNode;
}) {
  const parts = readingParts(l);
  const reading = voice.section !== null ? parts[voice.section]?.id : null;
  const [shownSteps, setShownSteps] = useState<number[]>(l.examples.map(() => 1));

  // Reading an example aloud shows all its steps
  useEffect(() => {
    const m = reading?.match(/^example-(\d+)$/);
    if (m) setShownSteps((s) => s.map((n, i) => (i === Number(m[1]) ? l.examples[i].steps.length : n)));
  }, [reading, l.examples]);

  const playFrom = (id: string) => voice.play(parts.map((p) => p.text), Math.max(0, parts.findIndex((p) => p.id === id)));
  const box = (id: string, extra = "") =>
    `rounded-lg p-3 transition-colors ${extra} ${reading === id ? "bg-primary/10 ring-2 ring-primary/40" : ""}`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-primary"><BookOpen className="h-3.5 w-3.5" /> Lesson</p>
          <h3 className="text-xl font-semibold">{l.title}</h3>
        </div>
        {voice.supported && (
          <div className="flex items-center gap-2">
            {voice.speaking ? (
              <Button size="sm" variant="outline" onClick={voice.pause}><Pause className="mr-1.5 h-4 w-4" /> Pause</Button>
            ) : voice.paused ? (
              <Button size="sm" variant="outline" onClick={voice.resume}><Play className="mr-1.5 h-4 w-4" /> Resume</Button>
            ) : (
              <Button size="sm" variant="outline" onClick={() => playFrom("why")}><Volume2 className="mr-1.5 h-4 w-4" /> Read it to me</Button>
            )}
            {(voice.speaking || voice.paused) && (
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={voice.stop} title="Stop reading"><Square className="h-3.5 w-3.5" /></Button>
            )}
            <Select value={String(voice.rate)} onValueChange={(v) => voice.setRate(Number(v))}>
              <SelectTrigger className="h-8 w-[76px] text-xs" aria-label="Reading speed"><SelectValue /></SelectTrigger>
              <SelectContent>{[0.75, 0.9, 1, 1.15].map((r) => <SelectItem key={r} value={String(r)}>{r}×</SelectItem>)}</SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className={box("why")}><p className="text-muted-foreground">{l.why}</p></div>

      {l.vocabulary.length > 0 && (
        <div className={box("vocab", "border")}>
          <p className="mb-1 text-sm font-semibold">Words to know</p>
          <dl className="grid gap-x-4 gap-y-1 text-sm sm:grid-cols-2">
            {l.vocabulary.map((v) => <div key={v.term}><dt className="inline font-medium">{v.term}: </dt><dd className="inline text-muted-foreground">{v.meaning}</dd></div>)}
          </dl>
        </div>
      )}

      <div className="space-y-1">
        {l.explain.map((p, i) => <div key={i} className={box(`explain-${i}`, "py-1.5")}><Markdown>{p}</Markdown></div>)}
      </div>

      {l.examples.map((e, i) => (
        <div key={i} className={box(`example-${i}`, "border bg-muted/30")}>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Example {i + 1}</p>
          <p className="mb-2 whitespace-pre-wrap font-medium">{e.problem}</p>
          <ol className="space-y-1.5 text-sm">
            {e.steps.slice(0, shownSteps[i]).map((s, j) => (
              <li key={j} className="flex gap-2 animate-in fade-in duration-300">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">{j + 1}</span>
                <span><Markdown>{s}</Markdown></span>
              </li>
            ))}
          </ol>
          {shownSteps[i] < e.steps.length ? (
            <div className="mt-2 flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setShownSteps((s) => s.map((n, k) => (k === i ? n + 1 : n)))}>Next step</Button>
              <Button size="sm" variant="ghost" onClick={() => setShownSteps((s) => s.map((n, k) => (k === i ? e.steps.length : n)))}>Show all</Button>
            </div>
          ) : (
            <p className="mt-2 text-sm"><span className="font-semibold text-green-700 dark:text-green-400">Answer:</span> {e.answer}</p>
          )}
        </div>
      ))}

      <div className={box("watch", "flex gap-3 border border-amber-500/40 bg-amber-500/5")}>
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
        <div className="text-sm"><p className="font-semibold">Watch out</p><Markdown>{l.watch_out}</Markdown></div>
      </div>

      {l.faith && (
        <div className={box("faith", "flex gap-3 border border-sky-500/30 bg-sky-500/5")}>
          <Heart className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />
          <p className="text-sm italic">{l.faith}</p>
        </div>
      )}

      <div className={box("check", "border border-primary/30")}>
        <QuickCheck check={l.check} />
      </div>

      {practiceButton && <div className="flex justify-end">{practiceButton}</div>}
    </div>
  );
}

function QuickCheck({ check }: { check: LessonContent["check"] }) {
  const [value, setValue] = useState("");
  const [tries, setTries] = useState(0);
  const [result, setResult] = useState<"right" | "wrong" | null>(null);
  const [showHint, setShowHint] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;
    const right = checkAnswer({ kind: "numeric", choices: null, answer: check.answer }, value).correct;
    setResult(right ? "right" : "wrong");
    setTries((t) => t + 1);
    if (!right) setShowHint(true);
  };

  return (
    <div className="space-y-2 text-sm">
      <p className="font-semibold">Your turn</p>
      <p className="whitespace-pre-wrap">{check.question}</p>
      {result === "right" ? (
        <p className="flex items-center gap-2 font-medium text-green-700 dark:text-green-400"><CheckCircle2 className="h-4 w-4" /> Yes! {check.answer} is right. You&apos;re ready to practice.</p>
      ) : (
        <form onSubmit={submit} className="flex flex-wrap items-center gap-2">
          <Input value={value} onChange={(e) => { setValue(e.target.value); setResult(null); }} placeholder="Your answer" className="h-9 w-40" inputMode="decimal" aria-label="Your answer" />
          <Button type="submit" size="sm" disabled={!value.trim()}>Check</Button>
          {!showHint && <Button type="button" size="sm" variant="ghost" onClick={() => setShowHint(true)}><Lightbulb className="mr-1 h-3.5 w-3.5" /> Hint</Button>}
        </form>
      )}
      {result === "wrong" && (
        <p className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
          <XCircle className="h-4 w-4" /> {tries >= 2 ? `Not quite. The answer is ${check.answer}. Look back at the examples, then practice.` : "Not quite. Try again."}
        </p>
      )}
      {showHint && result !== "right" && <p className="text-muted-foreground"><span className="font-medium">Hint:</span> {check.hint}</p>}
    </div>
  );
}
