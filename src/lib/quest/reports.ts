// Report numbers shared by the teacher's student detail, standards report and parent summaries,
// so every view shows the same scores.

import { SKILLS_BY_ID, TOPICS_BY_SECTION } from "./skills";
import { scoreOf } from "./mastery";

export interface MasteryLike { skill_id: string; p_known: number; attempts: number; mastered_at: string | null }

export type Band = "proficient" | "developing" | "needs_help";
export const bandOf = (score: number): Band => (score >= 80 ? "proficient" : score >= 50 ? "developing" : "needs_help");

export interface TopicScore {
  section: number; letter: string; title: string; nad: string;
  /** Average score over the topic's core skills the student has data on. */
  score: number;
  core_mastered: number; core_total: number; skills_with_data: number;
}

/** A student's score on each topic they have data on (grades 6–8 topics and Foundations). */
export function topicScores(mastery: MasteryLike[]): TopicScore[] {
  const byId = new Map(mastery.map((m) => [m.skill_id, m]));
  const result: TopicScore[] = [];
  for (const [section, topics] of Object.entries(TOPICS_BY_SECTION)) {
    for (const t of topics) {
      const core = t.skillIds.filter((id) => !SKILLS_BY_ID[id]?.advanced);
      const withData = core.filter((id) => byId.has(id));
      if (withData.length === 0) continue;
      const scores = withData.map((id) => { const m = byId.get(id)!; return scoreOf(m.p_known, m.attempts, m.mastered_at); });
      result.push({
        section: Number(section), letter: t.letter, title: t.title, nad: t.nad,
        score: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
        core_mastered: core.filter((id) => byId.get(id)?.mastered_at).length,
        core_total: core.length,
        skills_with_data: withData.length,
      });
    }
  }
  return result;
}

/** Strongest topics (score 80+) and the topics most worth working on (below 70), up to 3 each. */
export function strengthsAndFocus(topics: TopicScore[]) {
  return {
    strengths: topics.filter((t) => t.score >= 80).sort((a, b) => b.score - a.score).slice(0, 3),
    focus: topics.filter((t) => t.score < 70).sort((a, b) => a.score - b.score).slice(0, 3),
  };
}
