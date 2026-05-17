import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { Logo } from "./Logo";
import { riseIn, useMotionVariants } from "@/lib/motion";

interface Props {
  backTo?: string;
  title?: string;
  rightSlot?: ReactNode;
}

export function PageHeader({ backTo, title, rightSlot }: Props) {
  const v = useMotionVariants(riseIn);
  return (
    <header className="flex items-center justify-between gap-3 mb-6">
      <div className="flex items-center gap-3 min-w-0">
        {backTo ? (
          <Link
            to={backTo}
            className="rounded-full p-2 bg-white border border-brand-100 hover:bg-brand-50 hover:border-brand-200 focus-visible:ring-2 focus-visible:ring-brand-500 transition-colors"
            aria-label="חזרה"
          >
            <ChevronRight size={20} />
          </Link>
        ) : (
          <Logo />
        )}
        {title && (
          <motion.h1
            initial="hidden"
            animate="show"
            variants={v}
            className="text-lg font-bold truncate max-w-[55vw] sm:max-w-none"
          >
            {title}
          </motion.h1>
        )}
      </div>
      {rightSlot && (
        <div className="flex items-center gap-2 shrink-0 overflow-x-auto snap-x flex-nowrap max-w-[55vw] sm:max-w-none">
          {rightSlot}
        </div>
      )}
    </header>
  );
}
