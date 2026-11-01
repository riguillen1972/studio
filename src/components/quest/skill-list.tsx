"use client";

import { useMemo, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2 } from "lucide-react";
import { TOPICS_BY_SECTION, type Strand } from "@/lib/quest/skills";

export interface SkillSummary {
  id: string; code: string; name: string; grade: number; section: number; strand: Strand; nad: string; advanced: boolean;
  status: string; score: number; practiced: boolean; ready: boolean;
}

const sectionLabel = (section: number) => (section <= 5 ? "Foundations" : `Grade ${section}`);

// Topic header colors (white text) and the matching code color, cycled by topic letter
const TOPIC_COLORS = [
  { header: "bg-orange-600", code: "text-orange-700 dark:text-orange-400" },
  { header: "bg-sky-600", code: "text-sky-700 dark:text-sky-400" },
  { header: "bg-rose-600", code: "text-rose-700 dark:text-rose-400" },
  { header: "bg-teal-600", code: "text-teal-700 dark:text-teal-400" },
  { header: "bg-amber-700", code: "text-amber-700 dark:text-amber-400" },
  { header: "bg-green-600", code: "text-green-700 dark:text-green-400" },
  { header: "bg-violet-600", code: "text-violet-700 dark:text-violet-400" },
  { header: "bg-blue-600", code: "text-blue-700 dark:text-blue-400" },
  { header: "bg-pink-600", code: "text-pink-700 dark:text-pink-400" },
  { header: "bg-emerald-700", code: "text-emerald-700 dark:text-emerald-400" },
  { header: "bg-indigo-600", code: "text-indigo-700 dark:text-indigo-400" },
  { header: "bg-cyan-700", code: "text-cyan-700 dark:text-cyan-400" },
  { header: "bg-fuchsia-700", code: "text-fuchsia-700 dark:text-fuchsia-400" },
];

/** Progress mark: nothing until practiced, then a ring that fills with the score, and a check at 100. */
function ProgressMark({ skill }: { skill: SkillSummary }) {
  if (skill.score >= 100) return <CheckCircle2 className="h-[18px] w-[18px] text-green-600" aria-label="Mastered" />;
  if (!skill.practiced) return <span className="block h-[18px] w-[18px]" />;
  const color = skill.score >= 80 ? "stroke-green-500" : skill.score >= 50 ? "stroke-sky-500" : "stroke-amber-500";
  const c = 2 * Math.PI * 7;
  return (
    <svg viewBox="0 0 18 18" className="h-[18px] w-[18px] -rotate-90" aria-label={`Score ${skill.score}`}>
      <circle cx="9" cy="9" r="7" fill="none" strokeWidth="3" className="stroke-muted" />
      <circle cx="9" cy="9" r="7" fill="none" strokeWidth="3" strokeLinecap="round" className={color}
        strokeDasharray={`${(skill.score / 100) * c} ${c}`} />
    </svg>
  );
}

/**
 * Every skill for a grade as colored topic cards (one per NAD lesson), with numbered skills and
 * a progress mark. Students can pick any skill to practice on its own, in any grade.
 */
export function SkillList({ skills, grade, onPick }: { skills: SkillSummary[]; grade: number; onPick: (skill: SkillSummary) => void }) {
  const sections = Object.keys(TOPICS_BY_SECTION).map(Number).sort();
  const [section, setSection] = useState(sections.includes(grade) ? grade : sections[0]);
  const byId = useMemo(() => new Map(skills.map((s) => [s.id, s])), [skills]);
  const topics = TOPICS_BY_SECTION[section] ?? [];
  const inSection = skills.filter((s) => s.section === section);
  const mastered = inSection.filter((s) => s.score >= 100).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
        <div>
          <h2 className="text-xl font-semibold">Math skills</h2>
          <p className="text-xs text-muted-foreground">
            Pick any skill to practice. Your score climbs to 100 as you answer correctly, and questions get harder as it rises.
            {" "}{mastered} of {inSection.length} mastered in {sectionLabel(section)}.
          </p>
        </div>
        <Select value={String(section)} onValueChange={(v) => setSection(Number(v))}>
          <SelectTrigger className="w-[160px] font-medium text-primary"><SelectValue /></SelectTrigger>
          <SelectContent>
            {sections.map((s) => <SelectItem key={s} value={String(s)}>{sectionLabel(s)}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
        {topics.map((topic, i) => {
          const color = TOPIC_COLORS[i % TOPIC_COLORS.length];
          return (
            <section key={topic.letter} className="mb-4 break-inside-avoid overflow-hidden rounded-lg border bg-card shadow-sm">
              <h3 className={`px-3 py-2 text-sm font-semibold text-white ${color.header}`}>{topic.letter}. {topic.title}</h3>
              <ol className="p-1.5">
                {topic.skillIds.map((id) => {
                  const s = byId.get(id);
                  if (!s) return null;
                  return (
                    <li key={id}>
                      <button type="button" disabled={!s.ready} onClick={() => onPick(s)}
                        title={[s.practiced && `Score ${s.score}`, s.nad && `NAD ${s.nad}`, s.advanced && "Challenge skill", !s.ready && "Questions coming soon"].filter(Boolean).join(" · ") || undefined}
                        className="flex w-full items-start gap-2 rounded-md px-1.5 py-1.5 text-left text-sm hover:bg-muted disabled:cursor-default disabled:hover:bg-transparent">
                        <span className="mt-px shrink-0"><ProgressMark skill={s} /></span>
                        <span className={`flex-1 ${s.ready ? "" : "text-muted-foreground"}`}>
                          <span className={`mr-1 font-semibold ${s.ready ? color.code : ""}`}>{s.code}</span>
                          {s.name}
                          {s.advanced && <span className="ml-1 text-amber-500" aria-label="Challenge">★</span>}
                          {!s.ready && <span className="ml-1 text-xs">(soon)</span>}
                        </span>
                        {s.practiced && s.score < 100 && <span className="mt-px text-xs tabular-nums text-muted-foreground">{s.score}</span>}
                      </button>
                    </li>
                  );
                })}
              </ol>
            </section>
          );
        })}
      </div>
    </div>
  );
}
