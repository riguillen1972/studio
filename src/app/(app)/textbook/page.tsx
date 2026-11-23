"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Library, CheckCircle2 } from "lucide-react";
import { useAppState } from "@/components/app-state-provider";
import { questFetch } from "@/components/quest/quest-api";
import { MentorAvatar } from "@/components/mentor/mentor-avatar";
import { useMentorChoice } from "@/hooks/use-mentor";
import { SKILLS_BY_ID } from "@/lib/quest/skills";
import { textbookUnits } from "@/lib/textbook";

const GRADES = [6, 7, 8];
const CHAPTER_COLORS = ["bg-orange-600", "bg-sky-600", "bg-rose-600", "bg-teal-600", "bg-amber-700", "bg-green-600", "bg-violet-600", "bg-blue-600", "bg-pink-600", "bg-emerald-700", "bg-indigo-600", "bg-cyan-700", "bg-fuchsia-700"];

/** The textbook's table of contents: one book per grade, a unit per NAD topic, chapters of up to 4 lessons. */
export default function TextbookPage() {
  const { role, gradeLevel, teachingMode } = useAppState();
  const { mentorId } = useMentorChoice();
  const studentGrade = Number(gradeLevel);
  const [grade, setGrade] = useState(GRADES.includes(studentGrade) ? studentGrade : 6);
  const [scores, setScores] = useState<Record<string, number>>({});
  const eligible = role === "teacher" || (role === "k12" && GRADES.includes(studentGrade));

  useEffect(() => { if (GRADES.includes(studentGrade)) setGrade(studentGrade); }, [studentGrade]);
  useEffect(() => {
    if (role !== "k12") return;
    questFetch<{ skills?: { id: string; score: number; practiced: boolean }[] }>(`/api/quest/me?tz=${new Date().getTimezoneOffset()}`)
      .then((r) => setScores(Object.fromEntries((r.skills ?? []).filter((s) => s.practiced).map((s) => [s.id, s.score]))))
      .catch(() => {});
  }, [role]);

  if (role && !eligible) {
    return <p className="text-muted-foreground">The math textbook is for students in grades 6–8 and their teachers.</p>;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          {mentorId && teachingMode === "mentor"
            ? <MentorAvatar mentorId={mentorId} size={64} />
            : <Library className="h-10 w-10 text-primary" />}
          <div>
            <h1 className="text-2xl font-bold font-headline tracking-tight sm:text-3xl">Math Textbook</h1>
            <p className="text-muted-foreground">Read a lesson, see worked examples, then practice it in Math Quest.</p>
          </div>
        </div>
        <div className="flex gap-1 rounded-lg border p-1">
          {GRADES.map((g) => (
            <button key={g} type="button" onClick={() => setGrade(g)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${grade === g ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
              Grade {g}
            </button>
          ))}
        </div>
      </header>

      <div className="space-y-5">
        {textbookUnits(grade).map((unit, i) => (
          <motion.section key={`${grade}-${unit.letter}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i, 8) * 0.04 }} className="overflow-hidden rounded-xl border bg-card shadow-sm">
            <div className={`px-4 py-3 text-white ${CHAPTER_COLORS[i % CHAPTER_COLORS.length]}`}>
              <p className="text-xs font-semibold uppercase tracking-wide opacity-80">Unit {unit.letter} · NAD {unit.nad}</p>
              <h2 className="font-semibold">{unit.title}</h2>
            </div>
            <div className="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-3">
              {unit.chapters.map((chapter) => (
                <div key={chapter.number} className="bg-card p-3">
                  <p className="mb-1 text-sm font-semibold">
                    Chapter {chapter.number}
                    {chapter.parts > 1 && <span className="font-normal text-muted-foreground"> · part {chapter.part} of {chapter.parts}</span>}
                  </p>
                  <ol>
                    {chapter.skillIds.map((id, n) => {
                      const s = SKILLS_BY_ID[id];
                      const score = scores[id];
                      return (
                        <li key={id}>
                          <Link href={`/textbook/${id}`} className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted">
                            <span className="w-9 shrink-0 text-xs font-semibold text-muted-foreground">{chapter.number}.{n + 1}</span>
                            <span className="flex-1">{s.name}{s.advanced && <span className="ml-1 text-amber-500" aria-label="Challenge">★</span>}</span>
                            {score === 100 ? <CheckCircle2 className="h-4 w-4 text-green-600" aria-label="Mastered" />
                              : score !== undefined ? <span className="text-xs tabular-nums text-muted-foreground">{score}</span> : null}
                          </Link>
                        </li>
                      );
                    })}
                  </ol>
                </div>
              ))}
            </div>
          </motion.section>
        ))}
      </div>
    </div>
  );
}
