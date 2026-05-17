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
      {dots.map((i) => {
        const consumed = i < used;
        return (
          <svg
            key={i}
            width="14"
            height="14"
            viewBox="0 0 24 24"
            className={`transition-all duration-300 ${
              consumed
                ? "text-faint rotate-[30deg] scale-90"
                : "text-brand-500 scale-100"
            }`}
            aria-hidden
          >
            <path
              d="M12 21V11c-3-1-5-3-5-7 4 0 5 3 5 7zm0-8c2-1 4-2 4-5-3 0-4 2-4 5z"
              fill="currentColor"
            />
          </svg>
        );
      })}
    </div>
  );
}
