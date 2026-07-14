#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import Stripe from "stripe";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, "..");

const DRY_RUN = process.argv.includes("--dry-run");

// ── Env ──────────────────────────────────────────────────────────

function parseEnv(filepath) {
  const vars = {};
  for (const line of readFileSync(filepath, "utf-8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    vars[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return vars;
}

const envPath = resolve(rootDir, ".env.local");
const envLocal = parseEnv(envPath);

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
if (!STRIPE_SECRET_KEY) {
  console.error("STRIPE_SECRET_KEY is required");
  process.exit(1);
}

const stripe = new Stripe(STRIPE_SECRET_KEY);

// ── Products ─────────────────────────────────────────────────────

const products = [
  {
    priceId: envLocal.VITE_STRIPE_STORAGE_PRICE_ID,
    name: "Storage",
    description: "More gallery space for your 135 scans.",
    features: [
      { name: "360 images (up from 36)" },
      { name: "25 MB per file (up from 10 MB)" },
      { name: "~9 GB total storage" },
    ],
  },
  {
    priceId: envLocal.VITE_STRIPE_AI_PRICE_ID,
    name: "AI Generation",
    description: "Platform-managed AI grain. No BYO key needed.",
    features: [
      { name: "OpenAI-powered film grain generation" },
      { name: "No separate API key required" },
      { name: "Managed monthly usage allowance" },
    ],
  },
].filter((p) => p.priceId);

if (products.length === 0) {
  console.error(
    "No price IDs found. Set VITE_STRIPE_STORAGE_PRICE_ID and/or VITE_STRIPE_AI_PRICE_ID in .env.local",
  );
  process.exit(0);
}

// ── Snapshot ─────────────────────────────────────────────────────

async function getSnapshot(priceId) {
  const price = await stripe.prices.retrieve(priceId);
  const productId = typeof price.product === "string" ? price.product : price.product.id;
  const product = await stripe.products.retrieve(productId);
  return {
    productId,
    priceId,
    name: product.name,
    description: product.description ?? "",
    features: (product.marketing_features ?? []).map((f) => f.name),
    priceNickname: price.nickname ?? "",
  };
}

function snapshotLines(s) {
  const lines = [
    `    Name:           ${s.name || "<none>"}`,
    `    Description:    ${s.description || "<none>"}`,
    `    Features:       ${s.features.length} feature${s.features.length === 1 ? "" : "s"}`,
  ];
  for (const f of s.features) lines.push(`             • ${f}`);
  lines.push(`    Price nickname: ${s.priceNickname || "<none>"}`);
  return lines;
}

function showDiff(label, before, after) {
  if (before !== after) {
    console.log(`    ${label.padEnd(18)} ${before || "<none>"} ⟶  ${after || "<none>"}`);
  } else {
    console.log(`    ${label.padEnd(18)} (unchanged: "${before || "<none>"}")`);
  }
}

function showFeatureDiff(beforeFeatures, afterFeatures) {
  const removed = beforeFeatures.filter((f) => !afterFeatures.includes(f));
  const added = afterFeatures.filter((f) => !beforeFeatures.includes(f));
  const held = beforeFeatures.filter((f) => afterFeatures.includes(f));

  if (beforeFeatures.length === afterFeatures.length && added.length === 0) {
    console.log(
      `    features         (unchanged: ${beforeFeatures.length} feature${beforeFeatures.length === 1 ? "" : "s"})`,
    );
    if (beforeFeatures.length > 0) {
      for (const f of held) console.log(`           • ${f}`);
    }
    return;
  }

  console.log(
    `    features         ${beforeFeatures.length} ⟶  ${afterFeatures.length} feature${afterFeatures.length === 1 ? "" : "s"}`,
  );
  for (const f of removed) console.log(`           ➖ ${f}`);
  for (const f of added) console.log(`           ➕ ${f}`);
}

function changedFieldCount(before, after) {
  let count = 0;
  if (before.name !== after.name) count++;
  if (before.description !== after.description) count++;
  if (JSON.stringify(before.features) !== JSON.stringify(after.features)) count++;
  if (before.priceNickname !== after.priceNickname) count++;
  return count;
}

// ── Sync ─────────────────────────────────────────────────────────

let totalSynced = 0;
let totalFailed = 0;

for (const product of products) {
  console.log(`\n🔄 Syncing: ${product.name}`);
  console.log(`  ${"─".repeat(56)}`);

  try {
    const before = await getSnapshot(product.priceId);
    console.log(`\n  📋 Before ──────────────────────`);
    for (const line of snapshotLines(before)) console.log(line);

    const afterExpected = {
      productId: before.productId,
      priceId: before.priceId,
      name: product.name,
      description: product.description,
      features: product.features.map((f) => f.name),
      priceNickname: product.name,
    };

    if (DRY_RUN) {
      console.log(`\n  🎯 Expected ────────────────────`);
      for (const line of snapshotLines(afterExpected)) console.log(line);
    } else {
      await stripe.prices.update(product.priceId, {
        nickname: product.name,
      });
      await stripe.products.update(before.productId, {
        name: product.name,
        description: product.description,
        marketing_features: product.features,
      });

      const after = await getSnapshot(product.priceId);
      console.log(`\n  ✅ After ───────────────────────`);
      for (const line of snapshotLines(after)) console.log(line);
    }

    const after = DRY_RUN ? afterExpected : await getSnapshot(product.priceId);

    const changes = changedFieldCount(before, after);
    if (changes > 0) {
      console.log(`\n  🔀 Changes ─────────────────────`);
      showDiff("name", before.name, after.name);
      showDiff("description", before.description, after.description);
      showFeatureDiff(before.features, after.features);
      showDiff("nickname", before.priceNickname, after.priceNickname);
      console.log(`\n  ✅ ${before.productId}  (${changes} change${changes === 1 ? "" : "s"})`);
    } else {
      console.log(`\n  ✅ ${before.productId}  (no changes needed)`);
    }

    totalSynced++;
  } catch (error) {
    console.error(`\n  ❌ Failed:    ${error.message}`);
    totalFailed++;
  }
}

console.log(`\n📊 Summary ────────────────────────`);
console.log(`  ${"─".repeat(40)}`);
if (totalFailed > 0) {
  console.log(`  ❌ ${totalSynced}/${products.length} synced, ${totalFailed} failed`);
  process.exit(1);
} else {
  console.log(
    `  ✅ ${totalSynced}/${products.length} product${totalSynced === 1 ? "" : "s"} synced`,
  );
}
