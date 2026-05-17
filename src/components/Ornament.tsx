type OrnamentName = "sprout-mark" | "compass" | "brain-wave" | "leaf-cluster";

interface Props {
  name: OrnamentName;
  size?: number;
  className?: string;
}

export function Ornament({ name, size = 24, className = "" }: Props) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    className,
  };

  if (name === "sprout-mark") {
    return (
      <svg {...common}>
        <path d="M12 21V11" />
        <path d="M12 11c-3-1-5-3-5-7 4 0 5 3 5 7z" fill="currentColor" fillOpacity="0.15" />
        <path d="M12 13c2-1 4-2 4-5-3 0-4 2-4 5z" fill="currentColor" fillOpacity="0.15" />
      </svg>
    );
  }
  if (name === "compass") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="9" />
        <path d="M15 9l-3 8-3-8 6 0z" fill="currentColor" fillOpacity="0.2" />
      </svg>
    );
  }
  if (name === "brain-wave") {
    return (
      <svg {...common}>
        <path d="M3 12c2-3 4-3 6 0s4 3 6 0 4-3 6 0" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="M12 22c-4-3-7-7-6-13 5-1 9 2 10 8" fill="currentColor" fillOpacity="0.12" />
      <path d="M12 22c4-3 7-7 6-13-5-1-9 2-10 8" fill="currentColor" fillOpacity="0.18" />
    </svg>
  );
}
