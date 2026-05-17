import type { QuestionBank, UserState, TopicId } from "@/data/types";
import { topicIdFor } from "@/data/types";
import { todayLocal } from "./date";

export interface TopicMastery {
  topicId: TopicId;
  categoryId: string;
  categoryName: string;
  topicName: string;
  attempted: number;
  mastered: number;
  total: number;
  pct: number;
}

export interface DailyBucket {
  date: string;
  count: number;
}

export interface ExamPoint {
  examId: TopicId;
  takenAt: number;
  scorePct: number;
}

export interface ExamSlope {
  examId: TopicId;
  examName: string;
  first: ExamPoint;
  latest: ExamPoint;
}

function pct(num: number, denom: number): number {
  return denom > 0 ? Math.round((num / denom) * 100) : 0;
}

export function masteryByTopic(user: UserState, bank: QuestionBank): TopicMastery[] {
  const rows: TopicMastery[] = [];
  for (const cat of bank.categories) {
    for (const topic of cat.topics) {
      const id = topicIdFor(cat.id, topic.id);
      const prog = user.progress.topics[id];
      const mastered = prog?.mastered ?? 0;
      const attempted = prog?.attempted ?? 0;
      const total = topic.question_count;
      rows.push({
        topicId: id,
        categoryId: cat.id,
        categoryName: cat.name_he,
        topicName: topic.name_he,
        attempted,
        mastered,
        total,
        pct: pct(mastered, total),
      });
    }
  }
  rows.sort((a, b) => a.pct - b.pct);
  return rows;
}

export function overallMasteryPct(user: UserState, bank: QuestionBank): number {
  const rows = masteryByTopic(user, bank);
  const total = rows.reduce((n, r) => n + r.total, 0);
  const mastered = rows.reduce((n, r) => n + r.mastered, 0);
  return pct(mastered, total);
}

export function firstTryAccuracyPct(user: UserState): number | null {
  const total = user.progress.stats.totalAnswered;
  if (total === 0) return null;
  return pct(user.progress.stats.starsEarned, total);
}

function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

export function dailyHistogram(
  user: UserState,
  lookbackDays: number,
  today: string = todayLocal(),
): DailyBucket[] {
  const buckets: DailyBucket[] = [];
  for (let i = lookbackDays - 1; i >= 0; i--) {
    const date = addDays(today, -i);
    buckets.push({ date, count: user.progress.stats.dailyAnswered?.[date] ?? 0 });
  }
  return buckets;
}

export function todaySparkline(
  user: UserState,
  today: string = todayLocal(),
): number[] {
  return dailyHistogram(user, 7, today).map((b) => b.count);
}

export function masteryTrendSparkline(user: UserState, bank: QuestionBank): number[] {
  // Cheap proxy: current overall mastery as a single-point line.
  // Real trend would require persisting daily mastery snapshots — out of scope here.
  const m = overallMasteryPct(user, bank);
  return [Math.max(0, m - 5), m];
}

export function examTimeSeries(user: UserState): ExamPoint[] {
  return user.progress.exams
    .map((a) => ({
      examId: a.examId,
      takenAt: a.takenAt,
      scorePct: pct(a.score, a.total),
    }))
    .sort((a, b) => a.takenAt - b.takenAt);
}

export function examSlopes(user: UserState, bank: QuestionBank): ExamSlope[] {
  const grouped = new Map<string, ExamPoint[]>();
  for (const p of examTimeSeries(user)) {
    const arr = grouped.get(p.examId) ?? [];
    arr.push(p);
    grouped.set(p.examId, arr);
  }
  const nameByExamId = new Map<string, string>();
  for (const cat of bank.categories) {
    for (const t of cat.topics) {
      nameByExamId.set(topicIdFor(cat.id, t.id), t.name_he);
    }
  }
  const slopes: ExamSlope[] = [];
  for (const [examId, points] of grouped) {
    if (points.length < 2) continue;
    slopes.push({
      examId,
      examName: nameByExamId.get(examId) ?? examId,
      first: points[0],
      latest: points[points.length - 1],
    });
  }
  return slopes.sort((a, b) => a.examName.localeCompare(b.examName));
}

export function weakestTopicWithAttempts(
  user: UserState,
  bank: QuestionBank,
  minAttempts = 3,
): TopicMastery | null {
  const candidates = masteryByTopic(user, bank).filter(
    (r) => r.attempted >= minAttempts && r.categoryId !== "sample-exams",
  );
  if (candidates.length === 0) return null;
  return candidates.reduce((min, r) => (r.pct < min.pct ? r : min));
}
