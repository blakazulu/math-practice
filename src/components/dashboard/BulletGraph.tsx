interface Props {
  /** Actual value, 0–100 */
  value: number;
  /** Target, 0–100. Vertical tick. */
  target?: number;
  /** Optional band boundaries in ascending order (e.g. [40, 75]). Three bands: 0–40 poor, 40–75 fair, 75–100 good. */
  bands?: [number, number];
  width?: number;
  height?: number;
}

export function BulletGraph({
  value,
  target = 80,
  bands = [40, 75],
  width = 280,
  height = 18,
}: Props) {
  const clamp = (n: number) => Math.max(0, Math.min(100, n));
  const v = clamp(value);
  const t = clamp(target);
  const [b1, b2] = bands.map(clamp);

  // Coordinate system: 0..100 left-to-right within the SVG. We flip visually for RTL via scaleX(-1).
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 100 18"
      preserveAspectRatio="none"
      role="img"
      aria-label={`שליטה ${v} מתוך 100, יעד ${t}`}
      style={{ transform: "scaleX(-1)" }}
    >
      {/* Bands (sequential — light to medium to brand-50). NEVER red/green. */}
      <rect x="0" y="0" width={b1} height="18" fill="#F3F4F6" />
      <rect x={b1} y="0" width={b2 - b1} height="18" fill="#E5E7EB" />
      <rect x={b2} y="0" width={100 - b2} height="18" fill="#DCFCE7" />
      {/* Actual bar */}
      <rect x="0" y="5" width={v} height="8" fill="#22C55E" rx="2" />
      {/* Target tick */}
      <line x1={t} y1="1" x2={t} y2="17" stroke="#0F172A" strokeWidth="1.5" />
    </svg>
  );
}
