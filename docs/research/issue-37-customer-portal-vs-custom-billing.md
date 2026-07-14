# Customer Portal vs Custom Billing UI — Research Note

**Issue**: [#37 — Stripe Customer Portal vs Custom Billing UI](https://github.com/ma-tf/135ify/issues/37)

**Context**: 135ify is a small SaaS (film-look image processing) with a Convex backend, React frontend, and no existing
billing code. We need to decide whether to use Stripe's hosted Customer Portal for subscription management, build a
custom billing UI, or combine hosted and custom pieces.

**Sources**: All Stripe information is from official docs at `docs.stripe.com`, fetched Jul 2025.

---

## Executive Summary

Stripe's hosted stack (Embeddable Pricing Table + Checkout + Customer Portal) covers product discovery, purchase, and
self-service subscription management with zero custom UI code for the billing workflow itself. The Customer Portal
requires an initial purchase through Checkout (or Payment Links, or manual Dashboard creation) — it is a management-only
tool, not a purchase flow. For 135ify, the recommended approach is: **Embeddable Pricing Table for plan discovery →
Stripe Checkout for purchase → Stripe Customer Portal for ongoing management**, with a thin Convex backend for webhook
handling, user↔customer mapping, and entitlement enforcement. This gives production-grade billing UX with ~1–2 days of
integration work versus ~2–3 weeks for a custom billing UI.

---

## 1. Stripe Customer Portal: Capabilities and Limitations

The Customer Portal is a **Stripe-hosted page** where customers manage their own accounts and subscriptions. It is not a
product discovery or purchase tool — it is strictly for post-purchase subscription management.

### What it provides

| Capability                          | Details                                             |
| ----------------------------------- | --------------------------------------------------- |
| **Update payment methods**          | Add, remove, set default payment method             |
| **View/pay/download invoices**      | Full invoice history with PDF downloads             |
| **Upgrade/downgrade subscriptions** | Switch between plans (max 10 configurable products) |
| **Update quantities**               | For seat-based or quantity-based pricing            |
| **Cancel subscriptions**            | Immediate or at end of billing period               |
| **Cancellation deflection**         | Collect reasons, offer retention coupons            |
| **Update billing info**             | Name, email, billing address, phone, tax IDs        |
| **Customer information**            | Shipping address, tax ID management                 |

Source: [Customer Management overview](https://docs.stripe.com/customer-management)

### How it works

1. Your backend creates a portal session via `POST /v1/billing_portal/sessions` (one API call)
2. Stripe returns a short-lived URL
3. You redirect the customer to that URL
4. The customer manages their account on the Stripe-hosted page
5. After they're done (or they click "Return"), they're redirected back to your `return_url`

Source: [Integrate the customer portal](https://docs.stripe.com/customer-management/integrate-customer-portal)

### Configuration

Configured in the Stripe Dashboard at
[Dashboard > Billing > Customer Portal](https://dashboard.stripe.com/settings/billing/portal):

- **Subscription management**: Toggle plan switching, quantity updates, proration behavior, promotion codes, downgrade
  scheduling
- **Cancellation**: Toggle cancellation, reason collection, retention coupons
- **Billing info**: Toggle which fields customers can edit (name, email, billing address, phone, shipping, tax ID)
- **Invoice history**: Toggle visibility
- **Branding**: Icon, logo, colors, font, shapes (via
  [Branding settings](https://dashboard.stripe.com/settings/branding))
- **Headline**: Custom introductory text
- **Terms of service**: Custom link

Source: [Configure the customer portal](https://docs.stripe.com/customer-management/configure-portal)

### Deep links

You can link directly to specific portal actions (update payment method, update subscription, cancel, view invoice)
using `flow_data` parameter when creating the session.

Source: [Create deep links to the customer portal](https://docs.stripe.com/customer-management/portal-deep-links)

### Key limitations

1. **No product discovery or initial purchase.** The portal does not show plans for browsing; it only manages existing
   subscriptions. An initial purchase through Checkout, Payment Links, or Dashboard manual creation must happen first.
2. **No iframe embedding.** The portal is a standalone page; you must redirect to it.
3. **Ephemeral sessions.** New portal sessions expire after 5 minutes if unused, or 1 hour of inactivity.
4. **Subscription update restrictions.** Customers cannot update subscriptions that:
   - Contain multiple products in a single Subscription
   - Use usage-based billing
   - Use `collection_method: send_invoice`
   - Are currently being modified by a subscription schedule
5. **Max 10 products** for plan switching configuration.
6. **Price constraints.** You cannot define multiple Prices with the same product and `recurring.interval` — if you need
   a regular price and a student price for the same product and interval, you must create separate Products.
7. **Payment method display.** If payment method management is enabled, the section shows even if the portal doesn't
   support the customer's default payment method.

Source: [Customer Portal limitations](https://docs.stripe.com/customer-management#limitations)

### Integration point summary

```
Your App                    Stripe
  │                           │
  ├─ POST /billing_portal/ ──►│  (create session with customer ID + return_url)
  │     sessions              │
  │◄── { url } ──────────────┤
  │                           │
  ├─ redirect user to url ───►│  (Customer Portal opens)
  │                           │
  │◄── redirect to return_url─┤  (user exits portal)
  │                           │
  │◄── webhook events ────────┤  (customer.subscription.updated,
  │                           │   customer.subscription.deleted,
  │                           │   customer.updated, etc.)
```

Source: [Integrate the customer portal](https://docs.stripe.com/customer-management/integrate-customer-portal)

---

## 2. Stripe Checkout

Checkout is a **Stripe-hosted purchase flow** for acquiring subscriptions. It works alongside the Customer Portal — not
instead of it.

### What Checkout provides vs Customer Portal

|                        | Checkout                                                            | Customer Portal                                          |
| ---------------------- | ------------------------------------------------------------------- | -------------------------------------------------------- |
| **Purpose**            | Acquire new subscriptions                                           | Manage existing subscriptions                            |
| **Product discovery**  | No (needs upstream pricing page or Pricing Table)                   | No                                                       |
| **Payment collection** | Yes (card, wallets, etc.)                                           | No (only updates payment method for _recurring_ charges) |
| **Upgrade/downgrade**  | No                                                                  | Yes                                                      |
| **Cancel**             | No                                                                  | Yes                                                      |
| **Invoice viewing**    | No                                                                  | Yes                                                      |
| **UI control**         | Three options: full page (hosted), embedded form, Elements (custom) | Hosted page only, branding customization                 |
| **Integration**        | Create Checkout Session → redirect                                  | Create Portal Session → redirect                         |

Source: [Stripe Checkout](https://docs.stripe.com/payments/checkout) and
[Build subscriptions](https://docs.stripe.com/billing/subscriptions/build-subscriptions)

### Three Checkout UI options

| Option                              | Hosting            | Complexity | Customization                               |
| ----------------------------------- | ------------------ | ---------- | ------------------------------------------- |
| **Full page** (recommended)         | Hosted or embedded | Low        | 15 configurable brand settings              |
| **Embedded form** (private preview) | Embedded           | Medium     | 70 configurable settings via Appearance API |
| **Elements**                        | Embedded, full CSS | High       | Full CSS via Appearance API                 |

Full page also includes: Tax support, adaptive pricing, link, dynamic payment methods, surcharging, split-tender, free
trials, discounts, promo codes, order summary with cross-sells/upsells.

Source: [Build a payments page](https://docs.stripe.com/payments/checkout)

### How Checkout and Customer Portal work together

The typical flow:

```
1. Product Discovery (your pricing page OR Stripe Pricing Table)
        │
        ▼
2. Stripe Checkout (purchase) → redirect back to your app
        │
        ▼
3. Your app: webhook receives customer.subscription.created + invoice.paid
   → provision access
        │
        ▼
4. Customer wants to manage → Your "Manage Subscription" button
   → POST /billing_portal/sessions → redirect to Stripe Customer Portal
```

Source: [Build subscriptions guide](https://docs.stripe.com/billing/subscriptions/build-subscriptions),
[Customer management overview](https://docs.stripe.com/customer-management)

### Embeddable Pricing Table (bonus: handles product discovery)

Stripe also offers a no-code `<stripe-pricing-table>` web component that handles product discovery and routes to
Checkout:

- Embed with a `<script>` tag + web component
- Dashboard-configured: pick which products/prices to show (max 4 products, 3 prices each, 3 billing intervals)
- Supports: flat-rate, per-seat, tiered pricing, free trials
- Supports: custom fields, customer email pass-through, existing customer sessions, per-product call-to-action
- **Limitations**: Max 4 products, no usage-based pricing, no Connect support, shared rate limit (50 rps)

Source: [Embeddable pricing table](https://docs.stripe.com/payments/checkout/pricing-table)

---

## 3. Custom Billing UI with Convex + React

### What it would involve

Building a custom billing UI means implementing all three phases yourself:

**A. Product discovery (pricing page)**

- Build a React pricing page showing plans (products/prices)
- Fetch product/pricing data from Stripe API (Convex action) or hardcode visible info
- No Stripe-hosted UI — all custom

**B. Purchase flow (checkout)**

- Create a Checkout Session via Convex action:
  ```
  POST /v1/checkout/sessions
    - mode: "subscription"
    - line_items: [{ price: priceId, quantity: 1 }]
    - success_url / cancel_url
    - customer: stripeCustomerId
  ```
- Redirect the user to the session URL
- Alternatively, use Stripe Elements for a fully embedded payment form (more work)

**C. Subscription management (account page)**

- Build a React account/settings page with:
  - Current plan display with status, renewal date
  - Upgrade/downgrade buttons
  - Cancel button with confirmation flow
  - Payment method display (last 4 digits, brand, expiry)
  - Invoice history with PDF links
  - Billing address management
- All mutations via Convex actions calling Stripe API:
  - `stripe.subscriptions.update(subscriptionId, { items: [{ id: itemId, price: newPriceId }] })`
  - `stripe.subscriptions.cancel(subscriptionId)`
  - `stripe.invoices.list({ customer: stripeCustomerId })`
  - `stripe.paymentMethods.retrieve(paymentMethodId)`
  - `stripe.invoices.create_preview(...)` for proration preview

### Required backend (Convex)

| Concern                            | Implementation                                                               |
| ---------------------------------- | ---------------------------------------------------------------------------- |
| **Stripe SDK**                     | `stripe` npm package, used only in Convex actions (server-side)              |
| **Webhook endpoint**               | Convex HTTP action at `POST /stripe-webhook`                                 |
| **Webhook signature verification** | `stripe.webhooks.constructEvent(body, signature, secret)`                    |
| **User↔Customer mapping**          | Store `stripeCustomerId` on user document or separate table                  |
| **Subscription state sync**        | Listen to `customer.subscription.*` + `invoice.*` webhooks; update Convex DB |
| **Entitlement enforcement**        | Query active subscriptions/entitlements before granting access               |
| **Security**                       | Secret key never leaves Convex backend; publishable key on frontend (safe)   |
| **Environment variables**          | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PUBLISHABLE_KEY`       |

Source: [Build subscriptions guide](https://docs.stripe.com/billing/subscriptions/build-subscriptions),
[Webhooks](https://docs.stripe.com/webhooks)

### Required Stripe APIs

| API                                           | Purpose                                                              | Called from   |
| --------------------------------------------- | -------------------------------------------------------------------- | ------------- |
| `POST /v1/checkout/sessions`                  | Create purchase flow                                                 | Convex action |
| `POST /v1/billing_portal/sessions`            | Create management portal session (if using Customer Portal)          | Convex action |
| `GET /v1/products` + `GET /v1/prices`         | Fetch plan data for pricing page                                     | Convex action |
| `POST /v1/subscriptions` / `PATCH` / `DELETE` | Manage subscriptions (if custom management)                          | Convex action |
| `GET /v1/subscriptions/:id`                   | Get subscription status                                              | Convex action |
| `GET /v1/invoices`                            | List invoices for billing history                                    | Convex action |
| `POST /v1/invoices/create_preview`            | Preview proration before plan change                                 | Convex action |
| `GET /v1/payment_methods/:id`                 | Display saved card info                                              | Convex action |
| `POST /v1/customers`                          | Create Stripe customer (alternatively, Customer Portal auto-creates) | Convex action |
| `GET /v1/entitlements/active_entitlements`    | Check what features a user has access to                             | Convex action |

Source: [Stripe API Reference](https://docs.stripe.com/api)

### What 135ify already has

**Nothing.** The codebase has zero Stripe, billing, subscription, checkout, payment, or pricing code. Specifically:

- `convex/schema.ts`: Tables are `users`, `images`, `aiGenerationJobs`. No billing/subscription tables.
- `convex/http.ts`: Only auth routes. No webhook endpoint.
- `convex/env.d.ts`: Generic env type, no Stripe-specific variables defined.
- `src/`: No pricing, billing, or subscription UI components found.
- No `stripe` npm package in dependencies.

However, there is a pre-existing research document at `docs/research/stripe-subscription-capabilities.md` that covers
the Stripe API surface in detail (Products, Prices, Subscriptions, Checkout, Customer Portal, Webhooks, Entitlements,
Tax). That document provides API-level implementation guidance — this note focuses on the architectural decision between
hosted and custom.

### Key considerations for custom billing UI

1. **Webhook handling is mandatory regardless.** Even if you use the Customer Portal for management, you still need
   webhooks to sync subscription state with your Convex database. The `customer.subscription.deleted` event (e.g., from
   a credit card expiring and retries failing) can arrive without any user interaction in your app.

2. **Subscription state sync is the hardest part.** You need to handle:
   - `incomplete` → `incomplete_expired` (first payment failed, 23-hour window)
   - `active` → `past_due` (payment retries)
   - `past_due` → `canceled`/`unpaid` (all retries exhausted)
   - `trialing` → `active` (trial ended, payment succeeded)
   - Proration preview and display for plan changes

3. **Security: no secrets on client.** The Stripe secret key never appears in frontend code. All Stripe API calls happen
   in Convex actions (server-side). The publishable key (`pk_...`) is the only key exposed to the browser.

4. **The Convex webhook endpoint is an HTTP action.** It must:
   - Verify the `stripe-signature` header
   - Parse the event type
   - Route to the appropriate mutation (sync subscription, provision access, etc.)
   - Return 200 quickly (webhooks have short timeouts)

---

## 4. Comparison Matrix

| Dimension                     | Stripe Customer Portal (hosted)                                                      | Custom Billing UI                  | Hybrid (hosted Portal + custom Pricing)            |
| ----------------------------- | ------------------------------------------------------------------------------------ | ---------------------------------- | -------------------------------------------------- |
| **Product discovery**         | ❌ Not included                                                                      | ✅ Full control                    | ✅ Custom React pricing page                       |
| **Initial purchase**          | ❌ Needs Checkout first                                                              | ✅ Custom flow + Checkout redirect | ✅ Custom flow + Checkout redirect                 |
| **Subscription management**   | ✅ Hosted, full-featured                                                             | ✅ Full control, more work         | ✅ Hosted via Customer Portal                      |
| **Invoice history**           | ✅ Built-in                                                                          | ❌ Must build                      | ✅ Built-in                                        |
| **Payment method management** | ✅ Built-in                                                                          | ❌ Must build                      | ✅ Built-in                                        |
| **Cancel + retention offers** | ✅ Built-in (reasons, coupons)                                                       | ❌ Must build                      | ✅ Built-in                                        |
| **Branding control**          | ⚠️ Logo, colors, font — limited                                                      | ✅ Full control                    | ⚠️ Limited on portal; full on pricing              |
| **UX consistency**            | ⚠️ Stripe-branded, looks external                                                    | ✅ Matches app design              | ⚠️ Hybrid look                                     |
| **Development effort**        | ~1–2 days                                                                            | ~2–3 weeks                         | ~3–5 days                                          |
| **Ongoing maintenance**       | ✅ Stripe handles UI updates                                                         | ❌ You maintain every screen       | ⚠️ Maintain pricing page only                      |
| **Internationalization**      | ✅ 40+ languages auto                                                                | ❌ Must implement                  | ⚠️ Manual for pricing, auto for portal             |
| **Tax ID collection**         | ✅ Built-in                                                                          | ❌ Must build                      | ✅ Built-in                                        |
| **Proration preview**         | ⚠️ Automatic, not configurable                                                       | ✅ Can display custom preview      | ⚠️ Automatic on portal, custom preview on pricing  |
| **Limitations**               | Max 10 products for switching; no multi-product subs; no usage-based subs; no iframe | None                               | Portal limits apply to management portion          |
| **Requires Stripe Checkout?** | Yes, for initial purchase                                                            | Yes, or Elements for embedded      | Yes, for initial purchase                          |
| **Mobile-responsive**         | ✅ Stripe handles                                                                    | ❌ Must implement                  | ⚠️ Portal handled; pricing page must be responsive |

---

## 5. Recommendation

**Use the hosted Stripe stack: Checkout + Customer Portal, with a custom pricing page if needed.**

### Recommended approach for 135ify

```
Phase 1 — Launch quickly:
  Stripe Pricing Table (embedded) → Stripe Checkout (hosted) → Stripe Customer Portal
  + Convex webhook handler + user↔customer mapping + entitlement checks

Phase 2 — Iterate:
  Replace Pricing Table with custom React pricing page if you want more control
  over plan display, or if you need more than 4 products
```

### Rationale

1. **Team size.** Solo/small team. Custom billing UI is a multi-week distraction from the product's core value
   (film-look image processing). The hosted stack gives production-grade billing UI in days.

2. **Convex is a good fit.** Webhook handling in Convex HTTP actions is well-documented and straightforward. The
   subscription state machine maps cleanly to Convex mutations. No additional infrastructure needed.

3. **The Customer Portal's limitations don't block 135ify's model.** Based on the existing research at
   `docs/research/stripe-subscription-capabilities.md`, the recommended architecture for 135ify is multiple independent
   single-product Subscriptions (one per product line: Storage tier, AI tier). Each subscription is a single-product
   subscription, avoiding the "multi-product subscription" limitation.

4. **You can always switch later.** If the hosted portal's UX or limitations become a problem, you can add a custom
   management page without removing the portal (they can coexist — the portal is just a URL you redirect to). The
   webhook infrastructure you build for the hosted stack is identical to what a custom UI would need.

5. **The Embeddable Pricing Table hits the sweet spot.** For a small SaaS with 2–3 plan tiers, it handles product
   discovery without writing any UI code. The 4-product limit is sufficient for a launch with Basic/Pro/Enterprise
   tiers. If you later need more products or custom logic (e.g., stacked subscriptions where users pick Storage tier
   - AI tier independently), you can build a custom React pricing page that creates multi-line-item Checkout Sessions.

### What the Convex backend must include regardless

Whether you choose hosted or custom, this is the minimum:

```
convex/
  stripe.ts          — actions: createCheckoutSession, createPortalSession, getProducts, getPrices
  stripeSync.ts      — mutations: syncSubscription, provisionAccess, revokeAccess
  http.ts             — HTTP action: stripe-webhook endpoint
  schema.ts           — add: stripeCustomerId to users table; subscriptionStatus to users table

Env vars:
  STRIPE_SECRET_KEY
  STRIPE_WEBHOOK_SECRET
  STRIPE_PUBLISHABLE_KEY
```

The difference between hosted and custom is **what you build in the frontend** — the backend is nearly identical in both
approaches.

### If you must go custom

If you decide against the Customer Portal, at minimum use **Stripe Checkout** (hosted full-page) for the purchase flow.
Do not build a custom payment form with Stripe Elements for a small SaaS — the hosted Checkout page handles 125+ payment
methods, tax calculation, discounts, and fraud detection with zero frontend code. You can always replace Checkout with
Elements later if you need full UI control.

For subscription management, plan for these screens:

- Account settings → current plan, renewal date, upgrade/downgrade, cancel
- Payment method → saved card display, update card
- Billing history → list of invoices with download links
- Change plan → plan comparison with proration preview
- Cancel → confirmation, reason collection, retention offer

Each screen requires ~1–2 days of work (design, implementation, edge cases, testing) — totaling ~2 weeks of dedicated
work, not including the webhook backend.

---

## References

- [Customer management overview](https://docs.stripe.com/customer-management) — Customer Portal features, limitations,
  payment methods
- [Integrate the customer portal](https://docs.stripe.com/customer-management/integrate-customer-portal) — API
  integration, webhook events, session creation
- [Configure the customer portal](https://docs.stripe.com/customer-management/configure-portal) — Dashboard settings,
  subscription management, branding
- [Stripe Checkout](https://docs.stripe.com/payments/checkout) — Payment UI options, customization, features
- [Embeddable pricing table](https://docs.stripe.com/payments/checkout/pricing-table) — No-code product discovery
  component
- [Build subscriptions](https://docs.stripe.com/billing/subscriptions/build-subscriptions) — End-to-end integration
  guide
- [Subscription webhooks](https://docs.stripe.com/billing/subscriptions/webhooks) — Events for subscription lifecycle
- [Convex HTTP Actions](https://docs.convex.dev/functions/http-actions) — Webhook endpoint implementation
- [Existing Stripe research in this repo](https://github.com/ma-tf/135ify/blob/main/docs/research/stripe-subscription-capabilities.md)
  — Detailed API-level research on Stripe Billing for 135ify
