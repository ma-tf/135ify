import { Button } from "@components/ui/button";
import { api } from "@convex/_generated/api";
import { useAction } from "convex/react";
import { Loader2 } from "lucide-react";
import { useCallback, useState } from "react";

export function ManageSubscriptionButton() {
  const [managing, setManaging] = useState(false);
  const createPortalSession = useAction(api.stripe.createPortalSession);

  const handleClick = useCallback(() => {
    setManaging(true);
    void createPortalSession({})
      .then((result) => {
        if (result.url) {
          window.location.href = result.url;
        }
      })
      .finally(() => setManaging(false));
  }, [createPortalSession]);

  return (
    <Button className="w-full" disabled={managing} onClick={handleClick}>
      {managing ? (
        <>
          <Loader2 className="mr-2 size-4 animate-spin" />
          Redirecting...
        </>
      ) : (
        "Manage Subscription"
      )}
    </Button>
  );
}
