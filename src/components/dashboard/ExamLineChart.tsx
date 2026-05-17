import type { ExamPoint } from "@/lib/dashboardStats";

interface Props {
  points: ExamPoint[];
}

export function ExamLineChart({ points }: Props) {
  if (points.length === 0) {
    return (
      <div className="card p-5 lg:p-6">
        <h3 className="text-xl font-bold text-ink mb-2">ציוני מבחנים</h3>
        <p className="text-base text-muted">עוד לא ניגשת למבחן לדוגמה. אחרי המבחן הראשון תראי כאן את הציון.</p>
      </div>
    );
  }
  const W = 320;
  const H = 140;
  const pad = 18;
  const t0 = points[0].takenAt;
  const tN = points[points.length - 1].takenAt;
  const span = Math.max(1, tN - t0);

  const xy = points.map((p) => {
    const x = pad + ((p.takenAt - t0) / span) * (W - 2 * pad);
    const y = H - pad - (p.scorePct / 100) * (H - 2 * pad);
    return { x, y, p };
  });
  const path = xy.map(({ x, y }, i) => `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");

  return (
    <div className="card p-5 lg:p-6">
      <div className="flex items-baseline justify-between mb-3">
        <h3 className="text-xl font-bold text-ink">ציוני מבחנים</h3>
        <span className="section-label">{points.length} נסיונות</span>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        className="block"
        role="img"
        aria-label={`גרף ציוני מבחנים. ${points.length} נקודות.`}
      >
        {/* Y gridlines at 50% and 100% */}
        <line x1={pad} y1={H - pad - ((50 / 100) * (H - 2 * pad))} x2={W - pad} y2={H - pad - ((50 / 100) * (H - 2 * pad))} stroke="#F3F4F6" />
        <line x1={pad} y1={pad} x2={W - pad} y2={pad} stroke="#F3F4F6" />
        <text x={pad} y={pad - 4} fontSize="12" fill="#6B7280">100%</text>
        <text x={pad} y={H - pad - ((50 / 100) * (H - 2 * pad)) - 4} fontSize="12" fill="#6B7280">50%</text>

        <path d={path} fill="none" stroke="#22C55E" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {xy.map(({ x, y, p }, i) => (
          <circle key={i} cx={x} cy={y} r="3.5" fill="#22C55E">
            <title>{`${p.scorePct}% · ${new Date(p.takenAt).toLocaleDateString("he-IL")}`}</title>
          </circle>
        ))}
      </svg>
    </div>
  );
}
