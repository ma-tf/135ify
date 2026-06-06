import { useCallback, useEffect, useRef } from "react";

export function useDebouncedCallback<T extends (...args: never[]) => void>(fn: T, delay: number) {
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const fnRef = useRef<T>(fn);
  fnRef.current = fn;

  useEffect(() => () => clearTimeout(timer.current), []);

  const debounced = useCallback(
    (...args: Parameters<T>) => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => fnRef.current(...args), delay);
    },
    [delay],
  );

  const flush = useCallback((...args: Parameters<T>) => {
    if (timer.current) clearTimeout(timer.current);
    fnRef.current(...args);
  }, []);

  return { debounced, flush };
}
