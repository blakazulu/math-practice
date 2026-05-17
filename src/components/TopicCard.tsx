import { Link } from "react-router-dom";

interface Props {
  to: string;
  name: string;
  attempted: number;
  mastered: number;
  total: number;
}

export function TopicCard({ to, name, attempted, mastered, total }: Props) {
  const pct = total > 0 ? Math.round((mastered / total) * 100) : 0;
  return (
    <Link
      to={to}
      className="flex items-center gap-3 py-3 border-b border-hair last:border-b-0 focus-visible:ring-2 focus-visible:ring-brand-500 rounded"
    >
      <span className="flex-1 font-medium text-ink">{name}</span>
      <span className="text-sm text-faint tabular-nums">
        {attempted}/{total}
      </span>
      <span className="w-16 h-1.5 rounded-full bg-hair overflow-hidden">
        <span className="block h-full bg-brand-500" style={{ width: `${pct}%` }} />
      </span>
    </Link>
  );
}
