import { Link } from "react-router-dom";
import { Target, TrendingDown } from "lucide-react";
import { urlFromTopicId } from "@/data/types";
import type { TopicMastery } from "@/lib/dashboardStats";

interface Props {
  reviewSize: number;
  weakestTopic: TopicMastery | null;
}

export function ActionCards({ reviewSize, weakestTopic }: Props) {
  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {reviewSize > 0 ? (
        <Link
          to="/review"
          className="card p-5 flex items-center gap-4 hover:border-brand-500 focus-visible:ring-2 focus-visible:ring-brand-500"
        >
          <span className="w-12 h-12 rounded-xl grid place-items-center bg-warn-200 text-warn-700 shrink-0">
            <Target size={22} />
          </span>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-ink text-lg leading-tight">תור חזרה</div>
            <div className="text-base text-muted">{reviewSize} שאלות מחכות לתרגול חוזר</div>
          </div>
          <span className="shrink-0 text-brand-700 font-semibold">חזרה ←</span>
        </Link>
      ) : (
        <div className="card p-5 flex items-center gap-4 opacity-80">
          <span className="w-12 h-12 rounded-xl grid place-items-center bg-hair text-muted shrink-0">
            <Target size={22} />
          </span>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-ink text-lg leading-tight">תור חזרה</div>
            <div className="text-base text-muted">אין שאלות לחזרה. כל הכבוד.</div>
          </div>
        </div>
      )}

      {weakestTopic ? (
        <Link
          to={`/practice/${urlFromTopicId(weakestTopic.topicId)}`}
          className="card p-5 flex items-center gap-4 hover:border-brand-500 focus-visible:ring-2 focus-visible:ring-brand-500"
        >
          <span className="w-12 h-12 rounded-xl grid place-items-center bg-brand-100 text-brand-700 shrink-0">
            <TrendingDown size={22} />
          </span>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-ink text-lg leading-tight">נושא להתמקדות</div>
            <div className="text-base text-muted">
              {weakestTopic.topicName} · {weakestTopic.pct}% שליטה
            </div>
          </div>
          <span className="shrink-0 text-brand-700 font-semibold">תרגלי ←</span>
        </Link>
      ) : (
        <div className="card p-5 flex items-center gap-4 opacity-80">
          <span className="w-12 h-12 rounded-xl grid place-items-center bg-hair text-muted shrink-0">
            <TrendingDown size={22} />
          </span>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-ink text-lg leading-tight">נושא להתמקדות</div>
            <div className="text-base text-muted">תרגלי כמה שאלות כדי שנמליץ נושא להתמקד בו.</div>
          </div>
        </div>
      )}
    </section>
  );
}
