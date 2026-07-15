#!/usr/bin/env node
import Stripe from "stripe";

const DRY_RUN = process.argv.includes("--dry-run");

// ── Env ──────────────────────────────────────────────────────────

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
if (!STRIPE_SECRET_KEY) {
  console.error("STRIPE_SECRET_KEY is required");
  process.exit(1);
}

const stripe = new Stripe(STRIPE_SECRET_KEY);

// ── Product definitions ──────────────────────────────────────────

const PRODUCTS = [
  {
    priceLookupKey: "storage_paid",
    name: "Storage",
    description: "More gallery space for your 135 scans.",
    features: [
      { name: "360 images (up from 36)" },
      { name: "15 MB per file (up from 5 MB)" },
      { name: "~5.4 GB total storage" },
    ],
    currency: "usd",
    unitAmount: 200,
    interval: "month",
    priceNickname: "Storage",
  },
  {
    priceLookupKey: "ai_generation_platform",
    name: "AI Generation",
    description: "Platform-managed AI grain. No BYO key needed.",
    features: [
      { name: "OpenAI-powered film grain generation" },
      { name: "No separate API key required" },
      { name: "Managed monthly usage allowance" },
    ],
    currency: "usd",
    unitAmount: 1000,
    interval: "month",
    priceNickname: "AI Generation",
  },
];

// ── Helpers ──────────────────────────────────────────────────────

function formatPrice(def) {
  const amount = def.unitAmount / 100;
  const display = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: def.currency,
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
  return `${display}/${def.interval}`;
}

// ── Ensure product + price ───────────────────────────────────────

async function ensureProduct(def) {
  // Step 1 — look up existing price by lookup_key (active only)
  const existing = (await stripe.prices.list({ lookup_keys: [def.priceLookupKey], limit: 10 }))
    .data[0];

  if (existing) {
    const productId = typeof existing.product === "string" ? existing.product : existing.product.id;

    if (!DRY_RUN) {
      await stripe.products.update(productId, {
        name: def.name,
        description: def.description,
        marketing_features: def.features,
      });
    }

    const match =
      existing.unit_amount === def.unitAmount &&
      existing.currency === def.currency &&
      existing.recurring?.interval === def.interval;

    if (match) {
      if (!DRY_RUN) {
        const updates = { nickname: def.priceNickname };
        if (!existing.active) updates.active = true;
        await stripe.prices.update(existing.id, updates);
      }
      const action = existing.active ? "updated" : "reactivated";
      return { action, priceId: existing.id, productId };
    }

    // Attributes don't match — Stripe prices are immutable for amount/currency/interval
    const actualAmount = (existing.unit_amount ?? 0) / 100;
    const actualFormatted = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: existing.currency,
      minimumFractionDigits: actualAmount % 1 === 0 ? 0 : 2,
    }).format(actualAmount);
    console.error(`  ⚠️  Mismatch for "${def.priceLookupKey}" (${existing.id}):`);
    console.error(
      `      Expected ${formatPrice(def)}, got ${actualFormatted}/${existing.recurring?.interval ?? "?"}`,
    );
    console.error(`      Delete the old price in the Stripe Dashboard, then re-run.`);
    return { action: "skipped (mismatch)", priceId: existing.id, productId, error: true };
  }

  // Step 2 — no existing price; create product + price
  if (DRY_RUN) return { action: "would-create", priceId: null, productId: null };

  let product;
  try {
    product = await stripe.products.create({
      name: def.name,
      description: def.description,
      marketing_features: def.features,
    });
  } catch (error) {
    throw new Error(`Product creation failed: ${error.message}`);
  }

  try {
    const price = await stripe.prices.create({
      product: product.id,
      lookup_key: def.priceLookupKey,
      unit_amount: def.unitAmount,
      currency: def.currency,
      recurring: { interval: def.interval },
      nickname: def.priceNickname,
    });
    return { action: "created", priceId: price.id, productId: product.id };
  } catch (error) {
    await stripe.products.del(product.id).catch(() => {});

    // lookup_key already exists on a deactivated price — reactivate it
    if (error.type === "StripeInvalidRequestError" && error.code === "duplicate_lookup_key") {
      const inactive = (
        await stripe.prices.list({
          lookup_keys: [def.priceLookupKey],
          active: false,
          limit: 10,
        })
      ).data[0];
      if (inactive) {
        const productId =
          typeof inactive.product === "string" ? inactive.product : inactive.product.id;
        if (!DRY_RUN) {
          await stripe.products.update(productId, {
            name: def.name,
            description: def.description,
            marketing_features: def.features,
          });
          await stripe.prices.update(inactive.id, {
            nickname: def.priceNickname,
            active: true,
          });
        }
        return { action: "reactivated", priceId: inactive.id, productId };
      }
    }
    throw error;
  }
}

// ── Main ─────────────────────────────────────────────────────────

console.log(`\n🌱  Seeding Stripe products and prices${DRY_RUN ? " (dry-run)" : ""}`);
console.log(`  ${"─".repeat(56)}`);

const results = [];
let errors = 0;

for (const def of PRODUCTS) {
  console.log(`\n📦  ${def.name}`);
  console.log(`      Lookup key:   ${def.priceLookupKey}`);
  console.log(`      Price:        ${formatPrice(def)}`);

  try {
    const r = await ensureProduct(def);
    const icon = r.error ? "⚠️" : r.action === "would-create" ? "  " : "✅";
    console.log(`  ${icon}  ${r.action}: ${r.priceId ?? "(new)"}`);
    results.push({ ...r, name: def.name, lookupKey: def.priceLookupKey });
    if (r.error) errors++;
  } catch (error) {
    console.error(`  ❌  ${error.message}`);
    errors++;
    results.push({
      action: "failed",
      priceId: null,
      error: true,
      name: def.name,
      lookupKey: def.priceLookupKey,
    });
  }
}

// ── Summary ─────────────────────────────────────────────────────

console.log(`\n📊  Summary ────────────────────────`);
console.log(`  ${"─".repeat(56)}`);

for (const r of results) {
  if (!r) continue;
  const icon = r.error ? "⚠️" : r.priceId ? "✅" : "  ";
  console.log(`  ${icon}  ${r.name} — ${r.priceId ?? "(new)"}`);
}

if (errors > 0) process.exit(1);
