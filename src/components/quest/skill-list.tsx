"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { STRAND_NAMES, STRAND_ORDER, type Strand } from "@/lib/quest/skills";

export interface SkillSummary {
  id: string; code: string; name: string; grade: number; section: number; strand: Strand; nad: string; advanced: boolean;
  status: string; score: number; practiced: boolean; ready: boolean;
}

const sectionLabel = (section: number) => (section <= 5 ? "Foundations" : `Grade ${section}`);

/** Score chip: grey until practiced, then amber → blue → green as the score rises; 100 is mastered. */
function ScoreChip({ skill }: { skill: SkillSummary }) {
  if (!skill.ready) return <span className="text-xs text-muted-foreground">Soon</span>;
  if (!skill.practiced && skill.score === 0) return <span className="text-xs text-muted-foreground">—</span>;
  const style = skill.score >= 100 ? "bg-green-600 text-white"
    : skill.score >= 80 ? "bg-green-500/20 text-green-700 dark:text-green-400"
    : skill.score >= 50 ? "bg-blue-500/15 text-blue-700 dark:text-blue-400"
    : "bg-amber-500/15 text-amber-700 dark:text-amber-400";
  return <span className={`min-w-9 rounded-md px-1.5 py-0.5 text-center text-xs font-semibold tabular-nums ${style}`}>{skill.score}</span>;
}

/**
 * Every skill for a grade, in lettered sections with numbered skills and a 0–100 score.
 * Students can pick any skill to practice on its own, including other grades.
 */
export function SkillList({ skills, grade, onPick }: { skills: SkillSummary[]; grade: number; onPick: (skill: SkillSummary) => void }) {
  const sections = [...new Set(skills.map((s) => s.section))].sort();
  const [section, setSection] = useState(sections.includes(grade) ? grade : sections[0]);
  const inSection = skills.filter((s) => s.section === section);
  const strands = STRAND_ORDER.filter((strand) => inSection.some((s) => s.strand === strand));
  const mastered = inSection.filter((s) => s.score >= 100).length;

  return (
    <Card>
      <CardHeader className="space-y-3">
        <div>
          <CardTitle>All skills</CardTitle>
          <CardDescription>
            Pick any skill to practice it on its own. Your score goes up to 100 as you get questions right, and the questions
            get harder as it rises. ★ skills are challenges.
          </CardDescription>
        </div>
        <div className="flex flex-wrap gap-2">
          {sections.map((s) => (
            <Button key={s} size="sm" variant={s === section ? "default" : "outline"} onClick={() => setSection(s)}>{sectionLabel(s)}</Button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">{sectionLabel(section)}: {mastered} of {inSection.length} skills mastered</p>
      </CardHeader>
      <CardContent className="grid gap-x-8 gap-y-6 md:grid-cols-2">
        {strands.map((strand) => {
          const list = inSection.filter((s) => s.strand === strand);
          const letter = list[0].code.split(".")[0];
          return (
            <section key={strand}>
              <h3 className="mb-2 text-sm font-semibold">{letter}. {STRAND_NAMES[strand]}</h3>
              <ol className="space-y-0.5">
                {list.map((s) => (
                  <li key={s.id}>
                    <button type="button" disabled={!s.ready} onClick={() => onPick(s)}
                      title={[s.nad && `NAD ${s.nad}`, s.advanced && "Challenge skill", !s.ready && "Questions coming soon"].filter(Boolean).join(" · ") || undefined}
                      className="flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-sm hover:bg-muted disabled:cursor-default disabled:opacity-60 disabled:hover:bg-transparent">
                      <span className="w-9 shrink-0 text-xs tabular-nums text-muted-foreground">{s.code}</span>
                      <span className="flex-1">{s.name}{s.advanced && <span className="ml-1 text-amber-500">★</span>}</span>
                      <ScoreChip skill={s} />
                    </button>
                  </li>
                ))}
              </ol>
            </section>
          );
        })}
      </CardContent>
    </Card>
  );
}
