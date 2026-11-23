"use client";

// The four Study Buddy mentors, cartoon kid tutors drawn as simple SVGs (round shapes, big eyes,
// bright colors) so they're crisp at any size and can change mood: happy, talking, thinking or cheering.

import { motion, useReducedMotion } from "framer-motion";
import { MENTORS_BY_ID, type MentorId } from "@/lib/mentors";

export type MentorMood = "happy" | "talking" | "thinking" | "cheering";

const INK = "#1F2937";

/** Eyes and mouth, shared by every mentor so they all emote the same way. */
function Face({ mood, cx = 60, eyeY = 60, mouthY = 78, eyeGap = 15, light = false }: {
  mood: MentorMood; cx?: number; eyeY?: number; mouthY?: number; eyeGap?: number; light?: boolean;
}) {
  const reduce = useReducedMotion();
  const ink = light ? "#ECFEFF" : INK;
  const eyes = mood === "cheering" ? (
    // Happy closed eyes: little upside-down arcs
    <g stroke={ink} strokeWidth={4} strokeLinecap="round" fill="none">
      <path d={`M${cx - eyeGap - 6} ${eyeY + 2} q6 -8 12 0`} />
      <path d={`M${cx + eyeGap - 6} ${eyeY + 2} q6 -8 12 0`} />
    </g>
  ) : (
    <motion.g
      style={{ originY: `${eyeY}px` }}
      animate={reduce ? undefined : { scaleY: [1, 1, 0.1, 1, 1] }}
      transition={{ duration: 4.5, times: [0, 0.9, 0.93, 0.96, 1], repeat: Infinity }}
    >
      {[-1, 1].map((side) => {
        const x = cx + side * eyeGap;
        const look = mood === "thinking" ? { dx: 2, dy: -3 } : { dx: 0, dy: 0 };
        return (
          <g key={side}>
            <ellipse cx={x} cy={eyeY} rx={7.5} ry={9} fill={light ? "#ECFEFF" : "#FFFFFF"} />
            <circle cx={x + look.dx} cy={eyeY + 1 + look.dy} r={4.6} fill={light ? "#0F766E" : INK} />
            <circle cx={x + look.dx + 1.6} cy={eyeY - 1 + look.dy} r={1.6} fill="#FFFFFF" />
          </g>
        );
      })}
    </motion.g>
  );

  let mouth;
  if (mood === "talking") {
    mouth = (
      <motion.ellipse
        cx={cx} cy={mouthY} rx={6} fill={light ? "#ECFEFF" : "#7F1D1D"}
        animate={reduce ? { ry: 3.5 } : { ry: [2, 5, 2.5, 4.5, 2] }}
        transition={{ duration: 0.9, repeat: Infinity }}
      />
    );
  } else if (mood === "thinking") {
    mouth = <path d={`M${cx - 6} ${mouthY} q4 -3 10 1`} stroke={ink} strokeWidth={3.5} strokeLinecap="round" fill="none" />;
  } else {
    // Smile; a bigger open smile when cheering
    mouth = mood === "cheering"
      ? <path d={`M${cx - 10} ${mouthY - 3} q10 14 20 0 z`} fill={light ? "#ECFEFF" : "#7F1D1D"} stroke={ink} strokeWidth={2} strokeLinejoin="round" />
      : <path d={`M${cx - 8} ${mouthY - 2} q8 8 16 0`} stroke={ink} strokeWidth={3.5} strokeLinecap="round" fill="none" />;
  }

  return (
    <g>
      {mood === "thinking" && (
        <path d={`M${cx + eyeGap - 7} ${eyeY - 14} q7 -5 13 0`} stroke={ink} strokeWidth={3} strokeLinecap="round" fill="none" />
      )}
      {eyes}
      {mouth}
    </g>
  );
}

/** Shoulders, neck, ears and head: the parts every mentor shares. */
function Person({ skin, shirt, collar, children, behind }: {
  skin: string; shirt: string; collar?: string; children: React.ReactNode; behind?: React.ReactNode;
}) {
  return (
    <g>
      {behind}
      {/* Shoulders and shirt */}
      <path d="M12 120 Q14 96 42 91 L78 91 Q106 96 108 120 Z" fill={shirt} />
      {collar && <path d="M44 91 Q60 104 76 91 Q60 98 44 91 Z" fill={collar} />}
      {/* Neck */}
      <rect x={52} y={78} width={16} height={16} rx={6} fill={skin} />
      {/* Ears */}
      <circle cx={26} cy={56} r={7} fill={skin} />
      <circle cx={94} cy={56} r={7} fill={skin} />
      {/* Head */}
      <circle cx={60} cy={52} r={34} fill={skin} />
      {/* Rosy cheeks */}
      <circle cx={38} cy={66} r={5} fill="#F472B6" opacity={0.35} />
      <circle cx={82} cy={66} r={5} fill="#F472B6" opacity={0.35} />
      {children}
    </g>
  );
}

function Maya({ mood }: { mood: MentorMood }) {
  const hair = "#2B1B12";
  return (
    <Person skin="#8D5524" shirt={MENTORS_BY_ID.maya.color} collar="#FED7AA"
      behind={<><circle cx={30} cy={26} r={15} fill={hair} /><circle cx={90} cy={26} r={15} fill={hair} /></>}>
      {/* Curly hair across the top */}
      <path d="M25 50 Q22 16 60 15 Q98 16 95 50 Q88 30 72 29 Q64 34 56 29 Q40 28 25 50 Z" fill={hair} />
      <circle cx={42} cy={22} r={7} fill={hair} />
      <circle cx={60} cy={17} r={8} fill={hair} />
      <circle cx={78} cy={22} r={7} fill={hair} />
      <Face mood={mood} eyeY={54} mouthY={71} />
    </Person>
  );
}

function Leo({ mood }: { mood: MentorMood }) {
  return (
    <Person skin="#F1C27D" shirt={MENTORS_BY_ID.leo.color} collar="#CCFBF1">
      {/* Swoopy hair */}
      <path d="M25 52 Q19 18 58 15 Q94 13 96 46 Q86 30 72 31 Q78 23 64 23 Q48 25 40 35 Q30 40 25 52 Z" fill="#6B4226" />
      <Face mood={mood} eyeY={55} mouthY={72} />
      {/* Glasses */}
      <g stroke="#1F2937" strokeWidth={2.5} fill="none">
        <rect x={34} y={45} width={22} height={19} rx={8} />
        <rect x={64} y={45} width={22} height={19} rx={8} />
        <path d="M56 53 Q60 50 64 53" />
      </g>
    </Person>
  );
}

function Sam({ mood }: { mood: MentorMood }) {
  const hoodie = MENTORS_BY_ID.sam.color;
  return (
    <Person skin="#C68642" shirt={hoodie}
      behind={<path d="M30 96 Q28 80 44 84 L76 84 Q92 80 90 96 Z" fill="#15803D" />}>
      {/* Short hair */}
      <path d="M26 48 Q25 17 60 17 Q95 17 94 48 Q90 31 80 28 L74 34 L68 27 L60 33 L52 27 L46 34 L40 28 Q30 31 26 48 Z" fill="#1C1917" />
      {/* Hoodie strings */}
      <line x1={52} y1={96} x2={51} y2={108} stroke="#F0FDF4" strokeWidth={2.5} strokeLinecap="round" />
      <line x1={68} y1={96} x2={69} y2={108} stroke="#F0FDF4" strokeWidth={2.5} strokeLinecap="round" />
      <Face mood={mood} eyeY={54} mouthY={71} />
    </Person>
  );
}

function Zoe({ mood }: { mood: MentorMood }) {
  const hair = "#C2410C";
  return (
    <Person skin="#FFDBAC" shirt={MENTORS_BY_ID.zoe.color} collar="#EDE9FE"
      behind={<ellipse cx={100} cy={46} rx={11} ry={22} fill={hair} transform="rotate(20 100 46)" />}>
      {/* Hair with side bangs, ponytail tie */}
      <path d="M25 54 Q20 17 60 16 Q100 17 95 50 Q84 26 62 28 Q50 38 34 36 Q28 44 25 54 Z" fill={hair} />
      <circle cx={92} cy={28} r={5} fill="#FACC15" />
      {/* Freckles */}
      <g fill="#B45309" opacity={0.55}>
        <circle cx={40} cy={63} r={1.3} /><circle cx={44} cy={66} r={1.3} /><circle cx={36} cy={66} r={1.3} />
        <circle cx={80} cy={63} r={1.3} /><circle cx={76} cy={66} r={1.3} /><circle cx={84} cy={66} r={1.3} />
      </g>
      <Face mood={mood} eyeY={54} mouthY={72} />
    </Person>
  );
}

const DRAWINGS: Record<MentorId, (p: { mood: MentorMood }) => React.ReactElement> = { maya: Maya, leo: Leo, sam: Sam, zoe: Zoe };

/** A mentor at the given size; it bobs gently and jumps when cheering. */
export function MentorAvatar({ mentorId, mood = "happy", size = 96, className }: {
  mentorId: MentorId; mood?: MentorMood; size?: number; className?: string;
}) {
  const reduce = useReducedMotion();
  const Drawing = DRAWINGS[mentorId] ?? Maya;
  const motionProps = reduce ? {} : mood === "cheering"
    ? { animate: { y: [0, -14, 0, -8, 0], rotate: [0, -6, 6, -3, 0] }, transition: { duration: 0.9 } }
    : { animate: { y: [0, -3, 0] }, transition: { duration: 3, repeat: Infinity, ease: "easeInOut" as const } };
  return (
    <motion.svg
      key={mood === "cheering" ? "cheer" : "idle"}
      viewBox="0 0 120 120" width={size} height={size} className={className}
      role="img" aria-label={`${MENTORS_BY_ID[mentorId]?.name ?? "Mentor"}, ${mood}`}
      {...motionProps}
    >
      <Drawing mood={mood} />
    </motion.svg>
  );
}
