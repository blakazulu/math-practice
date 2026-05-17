import type { TopicMastery } from "@/lib/dashboardStats";
import { BulletGraph } from "./BulletGraph";

interface Props {
  rows: TopicMastery[];
}

export function TopicBulletList({ rows }: Props) {
  return (
    <div className="card p-5 lg:p-6">
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="text-2xl font-bold text-ink">שליטה מול יעד</h2>
        <span className="section-label">יעד 80%</span>
      </div>
      <p className="text-base text-muted mb-4">
        הסרגל מציג מצב נוכחי. הקו האנכי הוא היעד שלך. הרקע מציין: לתרגול נוסף · בתהליך · שליטה.
      </p>

      <ul className="space-y-3">
        {rows
          .filter((r) => r.categoryId !== "sample-exams")
          .map((r) => (
            <li key={r.topicId} className="flex items-center gap-4">
              <div className="flex-1 min-w-0 text-right">
                <div className="font-bold text-ink truncate-none leading-tight">{r.topicName}</div>
                <div className="text-base text-muted tabular-nums">{r.pct}%</div>
              </div>
              <BulletGraph value={r.pct} target={80} />
            </li>
          ))}
      </ul>
    </div>
  );
}
