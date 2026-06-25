import { useCallback, useEffect, useRef } from "react";

export function useDebounce<T extends (...args: never[]) => void>(
  callback: T,
  delay: number,
  options?: { leading?: boolean },
) {
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const callbackRef = useRef<T>(callback);

  useEffect(() => {
    callbackRef.current = callback;
  });

  useEffect(() => () => clearTimeout(timer.current), []);

  const debounced = useCallback(
    (...args: Parameters<T>) => {
      if (options?.leading && !timer.current) {
        callbackRef.current(...args);
      }

      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        timer.current = undefined;
        callbackRef.current(...args);
      }, delay);
    },
    [delay, options],
  );

  const cancel = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = undefined;
  }, []);

  const flush = useCallback((...args: Parameters<T>) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = undefined;
    callbackRef.current(...args);
  }, []);

  return { debounced, cancel, flush };
}
