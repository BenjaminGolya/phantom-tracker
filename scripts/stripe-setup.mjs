// One-off: create the Phantom Tracker Pro product, its two prices, and the
// production webhook endpoint. Run with:  node scripts/stripe-setup.mjs
// Requires STRIPE_SECRET_KEY in .env. Prints the values to put in env.

import "dotenv/config";
import Stripe from "stripe";
import { readFileSync, writeFileSync, existsSync } from "fs";

function upsertEnv(file, kv) {
  let lines = existsSync(file) ? readFileSync(file, "utf8").split(/\r?\n/) : [];
  for (const [k, v] of Object.entries(kv)) {
    lines = lines.filter((l) => !l.startsWith(`${k}=`));
    lines.push(`${k}=${v}`);
  }
  writeFileSync(file, lines.filter((l) => l !== "").join("\n") + "\n");
}

const key = process.env.STRIPE_SECRET_KEY;
if (!key) {
  console.error("✗ STRIPE_SECRET_KEY is not set in .env");
  process.exit(1);
}
const stripe = new Stripe(key);

// Always the public production URL (local NEXTAUTH_URL is localhost).
const APP_URL = "https://phantomtracker.io";
const CURRENCY = "eur";
const PRODUCT_NAME = "Phantom Tracker Pro";
const WEBHOOK_URL = `${APP_URL}/api/stripe/webhook`;

async function findOrCreateProduct() {
  const list = await stripe.products.list({ active: true, limit: 100 });
  const existing = list.data.find((p) => p.name === PRODUCT_NAME);
  if (existing) { console.log("• Reusing product " + existing.id); return existing; }
  console.log("→ Creating product…");
  return stripe.products.create({
    name: PRODUCT_NAME,
    description: "Unlimited habits, reminders, advanced stats, XP boost and data export.",
  });
}

async function findOrCreatePrice(productId, interval, amount, nickname) {
  const prices = await stripe.prices.list({ product: productId, active: true, limit: 100 });
  const existing = prices.data.find(
    (p) => p.recurring?.interval === interval && p.currency === CURRENCY && p.unit_amount === amount
  );
  if (existing) { console.log(`• Reusing ${interval} price ` + existing.id); return existing; }
  console.log(`→ Creating ${interval} price…`);
  return stripe.prices.create({
    product: productId, currency: CURRENCY, unit_amount: amount,
    recurring: { interval }, nickname,
  });
}

async function main() {
  const product = await findOrCreateProduct();
  const monthly = await findOrCreatePrice(product.id, "month", 200, "Pro Monthly");
  const yearly = await findOrCreatePrice(product.id, "year", 1500, "Pro Yearly");

  const hooks = await stripe.webhookEndpoints.list({ limit: 100 });
  let webhook = hooks.data.find((h) => h.url === WEBHOOK_URL);
  if (webhook) {
    console.log("• Reusing webhook " + webhook.id + " (secret unchanged — keep your existing STRIPE_WEBHOOK_SECRET)");
  } else {
    console.log("→ Creating webhook endpoint…");
    webhook = await stripe.webhookEndpoints.create({
      url: WEBHOOK_URL,
      enabled_events: [
        "checkout.session.completed",
        "customer.subscription.updated",
        "customer.subscription.deleted",
      ],
    });
  }

  // Persist to .env so secrets aren't printed to the terminal/chat.
  const env = {
    STRIPE_PRO_PRICE_ID: monthly.id,
    STRIPE_PRO_PRICE_ID_YEARLY: yearly.id,
  };
  if (webhook.secret) env.STRIPE_WEBHOOK_SECRET = webhook.secret; // only present on creation
  upsertEnv(".env", env);

  console.log("\n✓ Done. Created live resources and saved env vars to .env.\n");
  console.log("  Product:        " + product.id);
  console.log("  Monthly price:  " + monthly.id + "  (€2/mo)");
  console.log("  Yearly price:   " + yearly.id + "  (€15/yr)");
  console.log("  Webhook:        " + webhook.id + "  → " + `${APP_URL}/api/stripe/webhook`);
  console.log("  (Webhook signing secret saved to .env, not shown here.)");
}

main().catch((e) => {
  console.error("✗ Failed:", e.message);
  process.exit(1);
});
