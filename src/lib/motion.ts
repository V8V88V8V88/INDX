export const EASE_OUT = [0.22, 1, 0.36, 1] as const;

export const FADE_DURATION = 0.4;

export function reveal(reduceMotion: boolean | null, delay = 0) {
  return {
    initial: reduceMotion ? false : ({ opacity: 0 } as const),
    animate: { opacity: 1 },
    transition: reduceMotion ? { duration: 0 } : { duration: FADE_DURATION, ease: EASE_OUT, delay },
  };
}
