// ============================================================
// Static question bank types
// ============================================================

export type OptionLetter = "א" | "ב" | "ג" | "ד";

export interface RawQuestion {
  id: string;
  number: number;
  question: string;
  options: Partial<Record<OptionLetter, string>>;
  correct_answer: string;
  correct_letter: OptionLetter | null;
  explanation: string;
  flags: string[];
}

export interface RawTopic {
  id: string;
  name_he: string;
  source_file: string;
  question_count: number;
  questions: RawQuestion[];
}

export interface RawCategory {
  id: string;
  name_he: string;
  topic_count: number;
  question_count: number;
  topics: RawTopic[];
}

export interface QuestionBank {
  version: 1;
  total_questions: number;
  categories: RawCategory[];
}

// ============================================================
// Composite IDs
// ============================================================

export type TopicId = string;
export type QuestionId = string;
export type UserId = string;

// ============================================================
// Image dependency
// ============================================================

export interface ImageDependencyEntry {
  q_id: QuestionId;
  q_num: number;
  category: string;
  topic: string;
  topic_id: string;
  file: string;
  flagged_already: boolean;
  matches: string[];
  image?: string;
  image_alt?: string;
}

export interface ImageDependencyIndex {
  total: number;
  questions: ImageDependencyEntry[];
}

/** Format of `docs/images/mapping.json` synced into `public/data/image_mapping.json`. */
export interface ImageMappingEntry {
  q_id: QuestionId;
  q_num: number;
  topic: string;
  file: string;
  question_excerpt: string;
  /** Path like "docs/images/<file>.png" — we'll resolve to /data/images/<basename> at render time. */
  image_file: string | null;
  source_q_num: number | null;
  note: string;
}

export interface ImageMapping {
  description?: string;
  images_dir?: string;
  total_questions?: number;
  questions_with_direct_images?: number;
  questions_with_inherited_images?: number;
  questions_without_images?: number;
  mapping: ImageMappingEntry[];
}

// ============================================================
// Per-user persisted state
// ============================================================

export interface QuestionProgress {
  attempts: 0 | 1 | 2 | 3;
  firstTryCorrect: boolean;
  mastered: boolean;
  lastSeen: number;
  inReviewQueue: boolean;
}

export interface TopicProgress {
  attempted: number;
  mastered: number;
  totalQuestions: number;
}

export interface ExamAnswerRecord {
  picked: OptionLetter | null;
  correct: boolean;
  flagged: boolean;
}

export interface ExamAttempt {
  examId: string;
  takenAt: number;
  durationSec: number;
  timerEnabled: boolean;
  score: number;
  total: number;
  answers: Record<QuestionId, ExamAnswerRecord>;
}

export interface UserStats {
  totalAnswered: number;
  starsEarned: number;
  currentStreakDays: number;
  longestStreakDays: number;
  lastActiveDate: string;
  todayCount: number;
}

export interface UserProgress {
  questions: Record<QuestionId, QuestionProgress>;
  topics: Record<TopicId, TopicProgress>;
  exams: ExamAttempt[];
  stats: UserStats;
  reviewQueue: QuestionId[];
}

export interface UserState {
  id: UserId;
  name: string;
  createdAt: number;
  progress: UserProgress;
}

export interface PersistRoot {
  version: 1;
  activeUserId: UserId | null;
  users: Record<UserId, UserState>;
}

// ============================================================
// Session (in-memory) state
// ============================================================

export interface PracticeSession {
  mode: "practice" | "review";
  topicId: TopicId | null;
  queue: QuestionId[];
  index: number;
  currentAttempts: 0 | 1 | 2 | 3;
  revealed: boolean;
  hintLevel: 0 | 1 | 2 | 3;
  results: {
    answered: number;
    firstTryCorrect: number;
    secondTryCorrect: number;
    thirdTryCorrect: number;
    failed: number;
  };
}

export interface ExamSession {
  mode: "exam";
  examId: TopicId;
  queue: QuestionId[];
  index: number;
  picks: Record<QuestionId, OptionLetter | null>;
  flagged: Record<QuestionId, boolean>;
  timerEnabled: boolean;
  startedAt: number;
  durationSec: number;
  remainingSec: number;
  ended: boolean;
}

export type Session = PracticeSession | ExamSession | null;

// ============================================================
// Defaults & helpers
// ============================================================

export const EMPTY_STATS: UserStats = {
  totalAnswered: 0,
  starsEarned: 0,
  currentStreakDays: 0,
  longestStreakDays: 0,
  lastActiveDate: "",
  todayCount: 0,
};

export function emptyProgress(): UserProgress {
  return {
    questions: {},
    topics: {},
    exams: [],
    stats: { ...EMPTY_STATS },
    reviewQueue: [],
  };
}

export function dirForCategoryId(categoryId: string): string {
  switch (categoryId) {
    case "math-knowledge":
      return "01_ידע_מתמטי";
    case "logic-reasoning":
      return "02_חשיבה_והגיון";
    case "sample-exams":
      return "03_מבחנים_לדוגמה";
    default:
      return categoryId;
  }
}

export function topicIdFor(categoryId: string, topicSlug: string): string {
  return `${dirForCategoryId(categoryId)}/${topicSlug}`;
}
