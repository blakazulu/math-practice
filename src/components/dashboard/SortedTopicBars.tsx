import { Link } from "react-router-dom";
import { urlFromTopicId } from "@/data/types";
import type { TopicMastery } from "@/lib/dashboardStats";

interface Props {
  rows: TopicMastery[];
}

export function SortedTopicBars({ rows }: Props) {
  const practiceRows = rows.filter((r) => r.categoryId !== "sample-exams");
  return (
    <div className="card p-5 lg:p-6">
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="text-2xl font-bold text-ink">חוזק לפי נושא</h2>
        <span className="section-label">ממוין מהחלש לחזק</span>
      </div>

      <ul className="space-y-2">
        {practiceRows.map((r) => {
          const to = `/practice/${urlFromTopicId(r.topicId)}`;
          return (
            <li key={r.topicId}>
              <Link
                to={to}
                className="block rounded-xl px-3 py-3 hover:bg-hair/60 focus-visible:ring-2 focus-visible:ring-brand-500 transition-colors"
              >
                <div className="flex items-center justify-between gap-3 mb-2">
                  <span className="text-base text-muted tabular-nums shrink-0">
                    {r.mastered}/{r.total} · {r.categoryName}
                  </span>
                  <span className="font-bold text-ink leading-tight text-right flex-1">
                    {r.topicName}
                  </span>
                </div>
                <div
                  className="relative h-3 bg-hair rounded-full overflow-hidden"
                  role="meter"
                  aria-valuenow={r.pct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${r.topicName}: ${r.pct} אחוזי שליטה`}
                >
                  <div
                    className="absolute inset-y-0 right-0 bg-brand-500 rounded-full transition-[width] duration-500"
                    style={{ width: `${r.pct}%` }}
                  />
                </div>
                <div className="mt-1 text-base text-brand-700 tabular-nums font-semibold text-start">
                  {r.pct}%
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
