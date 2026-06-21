import { useEffect, useRef, useSyncExternalStore } from "react";
import { toast } from "sonner";

function useOnlineStatus() {
  return useSyncExternalStore(
    (callback) => {
      window.addEventListener("offline", callback);
      window.addEventListener("online", callback);
      return () => {
        window.removeEventListener("offline", callback);
        window.removeEventListener("online", callback);
      };
    },
    () => navigator.onLine,
  );
}

export function useOfflineToast() {
  const isOnline = useOnlineStatus();
  const isFirstLoad = useRef(true);

  useEffect(() => {
    if (isFirstLoad) {
      isFirstLoad.current = false;
      return;
    }
    if (!isOnline) {
      toast.error("You're offline. Changes will sync when reconnected.");
    } else {
      toast.success("Back online");
    }
  }, [isOnline]);
}
