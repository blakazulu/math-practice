import type { ExamSlope } from "@/lib/dashboardStats";

interface Props {
  slopes: ExamSlope[];
}

export function ExamSlopeChart({ slopes }: Props) {
  if (slopes.length === 0) {
    return (
      <div className="card p-5 lg:p-6">
        <h3 className="text-xl font-bold text-ink mb-2">שיפור במבחנים</h3>
        <p className="text-base text-muted">תגשי לאותו מבחן פעמיים כדי לראות כאן את השיפור.</p>
      </div>
    );
  }
  const W = 320;
  const H = Math.max(160, 26 * slopes.length + 40);
  const padTop = 20;
  const padBottom = 14;
  const leftX = 40;
  const rightX = W - 40;
  const innerH = H - padTop - padBottom;

  const y = (pct: number) => padTop + (1 - pct / 100) * innerH;

  return (
    <div className="card p-5 lg:p-6">
      <div className="flex items-baseline justify-between mb-3">
        <h3 className="text-xl font-bold text-ink">שיפור במבחנים</h3>
        <span className="section-label">ראשון מול אחרון</span>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        className="block"
        role="img"
        aria-label={`גרף שיפור במבחנים. ${slopes.length} מבחנים.`}
      >
        {/* axes */}
        <line x1={leftX} y1={padTop} x2={leftX} y2={H - padBottom} stroke="#E5E7EB" />
        <line x1={rightX} y1={padTop} x2={rightX} y2={H - padBottom} stroke="#E5E7EB" />
        <text x={leftX} y={padTop - 6} fontSize="12" fill="#6B7280" textAnchor="middle">ראשון</text>
        <text x={rightX} y={padTop - 6} fontSize="12" fill="#6B7280" textAnchor="middle">אחרון</text>

        {slopes.map((s) => {
          const yFirst = y(s.first.scorePct);
          const yLatest = y(s.latest.scorePct);
          const improved = s.latest.scorePct >= s.first.scorePct;
          const stroke = improved ? "#22C55E" : "#9CA3AF";
          return (
            <g key={s.examId}>
              <line x1={leftX} y1={yFirst} x2={rightX} y2={yLatest} stroke={stroke} strokeWidth="2" />
              <circle cx={leftX} cy={yFirst} r="3.5" fill={stroke} />
              <circle cx={rightX} cy={yLatest} r="3.5" fill={stroke} />
              <text x={leftX - 6} y={yFirst + 4} fontSize="12" fill="#0F172A" textAnchor="end">
                {s.first.scorePct}%
              </text>
              <text x={rightX + 6} y={yLatest + 4} fontSize="12" fill="#0F172A">
                {s.latest.scorePct}%
              </text>
              <text x={W / 2} y={(yFirst + yLatest) / 2 - 4} fontSize="12" fill="#0F172A" textAnchor="middle">
                {s.examName}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
