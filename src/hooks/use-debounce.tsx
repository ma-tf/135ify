import { useCallback, useEffect, useRef, useState } from "react";

export function useDebounce<T extends (...args: never[]) => void>(
  callback: T,
  delay: number,
  options?: { leading?: boolean },
) {
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const callbackRef = useRef<T>(callback);
  const invokedRef = useRef(false);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    callbackRef.current = callback;
  });

  useEffect(() => () => clearTimeout(timer.current), []);

  const debounced = useCallback(
    (...args: Parameters<T>) => {
      if (options?.leading || !invokedRef.current) {
        invokedRef.current = true;
        callbackRef.current(...args);
        setIsPending(false);
      }

      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        if (!options?.leading) callbackRef.current(...args);
        setIsPending(false);
      }, delay);

      setIsPending(true);
    },
    [delay, options],
  );

  const cancel = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = undefined;
    setIsPending(false);
  }, []);

  const flush = useCallback((...args: Parameters<T>) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = undefined;
    setIsPending(false);
    callbackRef.current(...args);
  }, []);

  return { debounced, cancel, flush, isPending };
}
