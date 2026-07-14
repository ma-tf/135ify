import type { Doc } from "@convex/_generated/dataModel";
import type { FunctionReturnType } from "convex/server";

import { api } from "@convex/_generated/api";
import { useAction, useQuery_experimental as useQuery } from "convex/react";
import { useEffect, useEffectEvent, useState } from "react";

type Plan = FunctionReturnType<typeof api.stripe.getPlan>[number];

type PlansResult = { status: "pending" | "error"; data: [] } | { status: "success"; data: Plan[] };

export function useSubscriptions() {
  const subscriptions = useQuery({ query: api.subscriptions.byUser, args: {} });
  const entitlements = useQuery({ query: api.entitlements.byUser, args: {} });

  const [plansResult, setPlansResult] = useState<PlansResult>({
    status: "pending",
    data: [],
  });
  const getPlanAction = useAction(api.stripe.getPlan);

  const onFetchPlans = useEffectEvent(() => {
    void getPlanAction()
      .then((results) => setPlansResult({ status: "success", data: results as Plan[] }))
      .catch(() => setPlansResult({ status: "error", data: [] }));
  });

  useEffect(() => {
    onFetchPlans();
  }, []);

  const anyPending =
    subscriptions.status === "pending" ||
    entitlements.status === "pending" ||
    plansResult.status === "pending";

  if (anyPending) {
    return { status: "pending" as const, subscription: null, activePlans: [], plans: [] };
  }

  const anyError =
    subscriptions.status === "error" ||
    entitlements.status === "error" ||
    plansResult.status === "error";

  if (anyError) {
    return { status: "error" as const, subscription: null, activePlans: [], plans: [] };
  }

  const subscription =
    (subscriptions.data as Doc<"subscriptions">[]).find(
      (s) => s.status === "active" || s.status === "trialing",
    ) ?? null;

  const lookupKeys = entitlements.data?.lookupKeys ?? [];
  const activePlans = plansResult.data.filter((p) => lookupKeys.includes(p.key));

  return { status: "success" as const, subscription, activePlans, plans: plansResult.data };
}
