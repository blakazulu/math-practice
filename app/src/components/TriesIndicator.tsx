interface Props {
  used: 0 | 1 | 2 | 3;
}

export function TriesIndicator({ used }: Props) {
  const dots = [0, 1, 2];
  return (
    <div
      className="flex items-center gap-1.5"
      aria-label={`${3 - used} ניסיונות נותרו`}
    >
      {dots.map((i) => (
        <span
          key={i}
          className={`block w-2.5 h-2.5 rounded-full ${
            i < used ? "bg-danger-200" : "bg-brand-500"
          }`}
        />
      ))}
    </div>
  );
}
