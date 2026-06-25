import { useCallback, useEffect, useRef } from "react";

export function useDebounce<T extends (...args: never[]) => void>(
  callback: T,
  delay: number,
  options?: { leading?: boolean },
) {
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const callbackRef = useRef<T>(callback);
  const invokedRef = useRef(false);

  useEffect(() => {
    callbackRef.current = callback;
  });

  useEffect(() => () => clearTimeout(timer.current), []);

  const debounced = useCallback(
    (...args: Parameters<T>) => {
      if (options?.leading || !invokedRef.current) {
        invokedRef.current = true;
        callbackRef.current(...args);
      }

      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        if (!options?.leading) callbackRef.current(...args);
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
