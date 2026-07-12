import { httpRouter } from "convex/server";

import { internal } from "./_generated/api";
import { httpAction } from "./_generated/server";
import { auth } from "./auth";

const http = httpRouter();

auth.addHttpRoutes(http);

http.route({
  path: "/stripe-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const signature = request.headers.get("stripe-signature");
    if (!signature) return new Response("Missing stripe-signature", { status: 400 });

    const body = await request.text();
    await ctx.runMutation(internal.stripeWebhooks.saveRawEvent, { body, signature });
    return new Response(null, { status: 200 });
  }),
});

export default http;
