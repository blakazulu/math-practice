import { useReducedMotion, type Variants } from "framer-motion";

export const pageEnter: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.04, delayChildren: 0.05 },
  },
};

export const riseIn: Variants = {
  hidden: { y: 8, opacity: 0 },
  show: { y: 0, opacity: 1, transition: { duration: 0.25, ease: "easeOut" } },
};

export const slideInRTL: Variants = {
  hidden: { x: 12, opacity: 0 },
  show: { x: 0, opacity: 1, transition: { duration: 0.28, ease: "easeOut" } },
};

export const springStamp: Variants = {
  hidden: { scale: 0, rotate: -15, opacity: 0 },
  show: {
    scale: 1,
    rotate: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 380, damping: 18 },
  },
};

export const cardHover = {
  whileHover: { y: -2 },
  whileTap: { scale: 0.98 },
  transition: { duration: 0.18 },
};

export function useMotionVariants(v: Variants): Variants {
  const reduced = useReducedMotion();
  if (!reduced) return v;
  return {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { duration: 0.15 } },
  };
}
