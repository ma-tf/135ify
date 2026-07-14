# Stripe subscription capabilities research

Research on Stripe Billing APIs for building a stackable subscription system with multiple independent products. All
information sourced from official `docs.stripe.com` and `docs.convex.dev`.

## Sources consulted

- [Products API](https://docs.stripe.com/api/products)
- [Prices API](https://docs.stripe.com/api/prices) and [Create a Price](https://docs.stripe.com/api/prices/create)
- [Subscriptions overview](https://docs.stripe.com/billing/subscriptions/overview)
- [Subscriptions API](https://docs.stripe.com/api/subscriptions)
- [Pricing models](https://docs.stripe.com/products-prices/pricing-models)
- [Tiered pricing](https://docs.stripe.com/subscriptions/pricing-models/tiered-pricing)
- [Multiple products/quantities](https://docs.stripe.com/billing/subscriptions/multiple-products)
- [Change subscription price](https://docs.stripe.com/billing/subscriptions/change-price)
- [Customer Portal](https://docs.stripe.com/customer-management)
- [Checkout](https://docs.stripe.com/payments/checkout)
- [Webhooks with subscriptions](https://docs.stripe.com/billing/subscriptions/webhooks)
- [Entitlements API](https://docs.stripe.com/billing/entitlements)
- [Metadata](https://docs.stripe.com/metadata)
- [Stripe Tax overview](https://docs.stripe.com/tax)
- [Tax for subscriptions](https://docs.stripe.com/tax/subscriptions)
- [Testing Billing](https://docs.stripe.com/billing/testing)
- [Convex HTTP Actions](https://docs.convex.dev/functions/http-actions)
- [Stripe CLI](https://docs.stripe.com/stripe-cli)

---

## 1. Products and Prices API

### Product model

A Product describes what you sell. Products can have multiple Prices. For a stackable subscription system:

- Create one Product for each subscription type (e.g., "Storage 50GB", "Storage 100GB", "AI Generation Basic", "AI
  Generation Pro")
- Products support metadata (50 key-value pairs, 40-char keys, 500-char values) — use for internal referencing
- Products have a `name` (customer-visible) and optional `description` shown at checkout and in the Customer Portal

### Price model

A Price defines how much and how often to charge. Key fields:

| Field                      | Description                                                                |
| -------------------------- | -------------------------------------------------------------------------- |
| `currency`                 | 3-letter ISO code (lowercase), e.g. `usd`                                  |
| `unit_amount`              | Amount in cents (e.g. 1000 = $10.00)                                       |
| `recurring.interval`       | `day`, `week`, `month`, or `year`                                          |
| `recurring.interval_count` | Multiplier on interval (e.g. `month` + `3` = quarterly)                    |
| `recurring.usage_type`     | `licensed` (per-seat/quantity) or `metered` (usage-based)                  |
| `billing_scheme`           | `per_unit` (flat per unit) or `tiered`                                     |
| `tiers_mode`               | `volume` (entire usage at tier rate) or `graduated` (each tier separately) |
| `metadata`                 | Key-value pairs for internal use                                           |
| `lookup_key`               | Unique string for programmatic price retrieval                             |
| `tax_behavior`             | `inclusive`, `exclusive`, or `unspecified`                                 |

### Tiered pricing (relevant for storage tiers and AI generation tiers)

Two modes supported:

**Volume-based** — All units billed at the tier corresponding to the total quantity:

- 1-50 images: $0/month per image
- 51-200 images: $0.10/month per image
- 201+ images: $0.08/month per image
- A customer with 60 images pays 60 x $0.10 = $6.00

**Graduated** — Each tier billed separately, then summed:

- 1-50 images: $0/month each
- 51-200 images: $0.10/month each
- 201+ images: $0.08/month each
- A customer with 60 images pays (50 x $0) + (10 x $0.10) = $1.00

Tiers can also include a `flat_amount` per tier (fixed fee + per-unit).

For 135ify's stackable model, **graduated tiered pricing** would be ideal — free first 10 images (current free tier),
then charge per additional image bracket.

---

## 2. Subscription lifecycle

### Multiple subscriptions model

A single Stripe Customer can have **multiple independent Subscriptions**. This is the foundation for a stackable model:

- Each Subscription has its own billing period, invoice, and charge
- Subscriptions can be for the same or different Products
- Up to 20 subscription items per Subscription

A Subscription can also contain **multiple items** (prices) billed on a single invoice — relevant if you want to group
complementary products (e.g., "Storage 50GB + AI Basic" as a bundle).

### Status lifecycle

| Status               | Description                                                            |
| -------------------- | ---------------------------------------------------------------------- |
| `trialing`           | In free trial; provision access now                                    |
| `active`             | In good standing; customer paying                                      |
| `incomplete`         | First payment pending (23-hour window)                                 |
| `incomplete_expired` | First payment failed and 23 hours passed; terminal                     |
| `past_due`           | Payment failed after being active; smart retries active                |
| `canceled`           | Canceled; terminal state, no updates possible                          |
| `unpaid`             | All retries exhausted; invoices still generate but no payment attempts |

### Creating subscriptions

```
POST /v1/subscriptions
  - customer: {{CUSTOMER_ID}}
  - items[0][price]: {{PRICE_ID}}
  - items[0][quantity]: 1
```

### Updating subscriptions

To change a price (upgrade/downgrade):

- Specify the existing `items[0][id]` (subscription item ID) + new `items[0][price]`
- If you omit the item ID, it **adds** a second price instead of replacing
- Prorations are calculated automatically; can be disabled via `proration_behavior: "none"`

### Canceling subscriptions

```
DELETE /v1/subscriptions/:id
```

Options:

- Immediate cancellation (default)
- Cancel at period end: `invoice_now: true, prorate: true`
- Schedule cancellation: use Subscription Schedules

### Stackable model considerations

For the 135ify model (free gallery + paid Storage + paid AI):

- Free users: no Stripe subscription, local limits enforced in app
- Paying users: one Subscription per product line, or all items in one Subscription with multiple items
- **Recommendation:** Multiple independent Subscriptions — each product has its own billing cycle, which matters if a
  user adds AI mid-cycle after buying Storage

---

## 3. Stripe Customer Portal

The Customer Portal is a **Stripe-hosted page** where customers manage subscriptions and billing.

### Capabilities

- Update payment methods
- View/pay/download invoices
- Upgrade/downgrade subscriptions (up to 10 products configurable)
- Cancel subscriptions (immediate or at period end)
- Cancellation deflection: offer coupons, collect reasons
- Branding customization (icon, logo, colors)
- Automatic localization (40+ languages)

### Limitations (relevant to stackable model)

- Customers **cannot update** subscriptions that have **multiple products** in a single Subscription
- Customers **cannot update** subscriptions with **usage-based billing**
- Customers **cannot update** subscriptions with `collection_method: send_invoice`

For the 135ify stackable model, this means:

- If each product is a separate Subscription (recommended), the Portal works well — each is a single-product
  subscription
- The Portal handles cancelation, payment method updates, and invoice viewing
- For plan changes (e.g., Storage 50GB → Storage 100GB), configure the product as one of the 10 allowed choices

### Integration

Create a portal session:

```
POST /v1/billing_portal/sessions
  - customer: {{CUSTOMER_ID}}
  - return_url: https://135ify.com/account
```

Returns a URL; redirect the user to it.

---

## 4. Stripe Checkout

Checkout is a **Stripe-hosted purchase flow** for acquiring subscriptions.

### Three UI options

| Option        | Hosting                    | Complexity | Best for            |
| ------------- | -------------------------- | ---------- | ------------------- |
| Full page     | Hosted or embedded         | Low        | MVP, quick launch   |
| Embedded form | Embedded (private preview) | Medium     | Custom-branded flow |
| Elements      | Embedded, full CSS         | Most       | Full custom design  |

### Creating a Checkout session

```
POST /v1/checkout/sessions
  - mode: "subscription"
  - line_items[0][price]: {{PRICE_ID}}
  - line_items[0][quantity]: 1
  - success_url: https://135ify.com/account?session_id={CHECKOUT_SESSION_ID}
  - cancel_url: https://135ify.com/pricing
  - subscription_data.metadata[userId]: {{CONVEX_USER_ID}}
```

Returns a URL; redirect the user to it. On completion, Stripe redirects to `success_url`.

### Embeddable pricing table

Stripe also offers an **embeddable pricing table** (JS embed) that lets users pick a plan in-product before going
through Checkout. This is relevant for the subscription purchase page — embed a table showing Storage tiers and AI
tiers, then pass the selected price to Checkout.

---

## 5. Webhook events for subscription lifecycle

Stripe sends webhook events for all subscription state changes. For Convex, these are received via an HTTP action at
`https://<deployment>.convex.site/stripe-webhook`.

### Essential events for a stackable system

**Lifecycle:**

- `customer.subscription.created` — new subscription; status may be `incomplete`
- `customer.subscription.updated` — any change (renewal, plan change, coupon)
- `customer.subscription.deleted` — canceled; revoke access
- `customer.subscription.trial_will_end` — 3 days before trial ends

**Payment:**

- `invoice.paid` — subscription is `active`; provision access
- `invoice.payment_failed` — payment failed; notify customer
- `invoice.payment_action_required` — requires 3D Secure authentication

**Entitlements (recommended over status tracking):**

- `entitlements.active_entitlement_summary.updated` — features changed; provision/de-provision

### Webhook handling in Convex

```typescript
// convex/http.ts
http.route({
  path: "/stripe-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const signature = request.headers.get("stripe-signature")!;
    const body = await request.text();
    const event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);

    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.deleted":
      case "customer.subscription.updated":
        await ctx.runMutation(internal.stripe.syncSubscription, { event });
        break;
      case "invoice.paid":
        await ctx.runMutation(internal.stripe.provisionAccess, { event });
        break;
    }

    return new Response(null, { status: 200 });
  }),
});
```

---

## 6. Entitlements API and metadata mapping

### Entitlements API (recommended)

Stripe Entitlements maps Stripe Products to application features. This is the cleanest approach for "what does this user
have access to?"

**Setup:**

1. Create Features: `POST /v1/entitlements/features` with a `lookup_key` (e.g., `storage-50gb`, `ai-generation`)
2. Attach Features to Products: `POST /v1/products/:id/features`
3. Subscribe customers to Products
4. Listen for `entitlements.active_entitlement_summary.updated` webhook

**Retrieving entitlements:**

```typescript
// At any time, for a given customer:
const entitlements = await stripe.entitlements.activeEntitlements.list({
  customer: stripeCustomerId,
});
// entitlements.data[].lookup_key => ["storage-50gb", "ai-generation"]
```

When a subscription is created/updated/canceled, the `entitlements.active_entitlement_summary.updated` event fires with
the full diff of `lookup_key`s added and removed.

### Metadata approach (alternative)

If not using Entitlements, store Convex data on Stripe objects via metadata:

- **Customer metadata**: `{ convexUserId: "abc123" }`
- **Subscription metadata**: `{ productType: "storage", tier: "50gb" }` — set via `subscription_data.metadata` when
  creating Checkout sessions
- **Product metadata**: `{ featureKey: "storage", maxImages: 50 }`

This is simpler but requires manual state tracking. The Subscription object itself carries the price ID and product, so
you can derive access from the active subscriptions without extra metadata.

### Recommendation for 135ify

Use **Entitlements** — it's purpose-built for this:

- Feature: `gallery-storage` → maps to storage tiers via Product attachment
- Feature: `ai-generation-platform-key` → maps to AI generation products
- Webhook-driven provisioning: when entitlements change, update user's Convex document with current limits
- No custom metadata mapping needed

---

## 7. Stripe Tax

Stripe Tax automates sales tax, VAT, and GST compliance.

### Key capabilities

- Automatic tax calculation based on customer location
- Product tax codes for correct categorization
- Threshold monitoring (alerts when you need to register)
- Registration management (file and remit taxes)
- Works with subscriptions, Checkout, and the Customer Portal
- Handles prorations and discounts correctly

### Integration for subscriptions

Enable automatic tax on subscription creation:

```
POST /v1/subscriptions
  - automatic_tax[enabled]: true
  - customer: {{CUSTOMER_ID}}
```

Tax is calculated at invoice finalization. If the customer's tax location is invalid, the invoice fails to finalize
(listen for `invoice.finalization_failed` with `automatic_tax.status: requires_location_inputs`).

### Pricing

Stripe Tax has its own pricing model (pay-as-you-go or subscription). This is a separate business decision from app
subscription pricing.

---

## 8. Sandbox and testing setup for Convex integration

### Stripe test mode

- Use Stripe test secret keys (`sk_test_...`)
- Test cards: `4242 4242 4242 4242` (success), `4000 0000 0000 0341` (decline), `4000 0027 6000 3184` (3D Secure)
- Test account numbers available for ACH, SEPA, etc.

### Test clocks

Test clocks simulate time passing in test mode — essential for testing subscription renewals, trial expirations, and
payment retries without waiting days:

```
POST /v1/test_helpers/test_clocks
  - frozen_time: 1735689600
```

Then create customers/subscriptions attached to the clock and advance time.

### Stripe CLI

The Stripe CLI is the primary tool for local development:

```bash
# Install
brew install stripe/stripe-cli/stripe  # macOS

# Login to Stripe
stripe login

# Forward webhooks to local Convex deployment
stripe listen --forward-to https://happy-animal-123.convex.site/stripe-webhook

# Trigger test events
stripe trigger customer.subscription.created
stripe trigger invoice.paid
```

### Convex HTTP action for webhooks

The webhook endpoint is a Convex HTTP action at `convex/http.ts`. During development:

1. Run `npx convex dev` (exposes `.convex.site` URL)
2. Run `stripe listen --forward-to <convex-site-url>/stripe-webhook`
3. The Stripe CLI prints a webhook signing secret — set as `STRIPE_WEBHOOK_SECRET` in Convex environment variables

### Recommended test flow

1. Create a Product + Price in test mode (Dashboard or API)
2. Create a Checkout session → complete with test card `4242...`
3. Verify webhook receives `customer.subscription.created` → `invoice.paid`
4. Verify Convex mutation provisions access correctly
5. Use test clock to advance 1 month → verify renewal invoice and webhook
6. Test cancellation → verify access revocation
7. Test payment failure with `4000...0341` card → verify `past_due` handling

### Convex environment variables

Store in Convex dashboard (Settings > Environment Variables):

- `STRIPE_SECRET_KEY` (test mode key for dev, live for production)
- `STRIPE_WEBHOOK_SECRET` (from Stripe CLI for dev, from Dashboard for production)
- `STRIPE_PUBLISHABLE_KEY` (used on frontend; non-sensitive)

### Stripe SDK in Convex actions

Convex actions run in Node.js and can use the `stripe` npm package:

```typescript
import Stripe from "stripe";

export const createCheckoutSession = action({
  args: { priceId: v.string(), userId: v.id("users") },
  handler: async (ctx, args) => {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: args.priceId, quantity: 1 }],
      success_url: `${process.env.SITE_URL}/account?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.SITE_URL}/pricing`,
      subscription_data: { metadata: { convexUserId: args.userId } },
    });
    return session.url;
  },
});
```

Note: do not add `stripe` to the project's dependencies — `stripe` is documented here for reference. The actual package
choice should be made when implementing.
