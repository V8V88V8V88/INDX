export const EASE_OUT = [0.22, 1, 0.36, 1] as const;

export function reveal(reduceMotion: boolean | null, delay = 0, from: { x?: number; y?: number } = { y: 20 }) {
  return {
    initial: reduceMotion ? false : ({ opacity: 0, ...from } as const),
    animate: { opacity: 1, x: 0, y: 0 },
    transition: reduceMotion ? { duration: 0 } : { duration: 0.6, ease: EASE_OUT, delay },
  };
}
