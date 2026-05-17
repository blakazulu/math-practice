import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { Logo } from "./Logo";

interface Props {
  backTo?: string;
  title?: string;
  rightSlot?: ReactNode;
}

export function PageHeader({ backTo, title, rightSlot }: Props) {
  return (
    <header className="flex items-center justify-between gap-3 mb-6">
      <div className="flex items-center gap-3 min-w-0">
        {backTo ? (
          <Link
            to={backTo}
            className="rounded-full p-2 hover:bg-hair focus-visible:ring-2 focus-visible:ring-brand-500"
            aria-label="חזרה"
          >
            <ChevronRight size={20} />
          </Link>
        ) : (
          <Logo />
        )}
        {title && <h1 className="text-lg font-bold truncate">{title}</h1>}
      </div>
      {rightSlot && <div className="flex items-center gap-2 shrink-0">{rightSlot}</div>}
    </header>
  );
}
