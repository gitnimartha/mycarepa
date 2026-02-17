// Usage: node create-price-variant.js <product> <amount_cents> <interval>
// Example: node create-price-variant.js starter 1900 month
// Creates a $19/month variant for Starter plan

import Stripe from 'stripe';
import 'dotenv/config';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const PRODUCTS = {
  starter: 'prod_TzbVhzoHHQrmOm',
  professional: 'prod_TzbV1Hq1sFFV5A',
  enterprise: 'prod_TzbVgUzY8se1aI',
};

async function createPriceVariant() {
  const [,, product, amountCents, interval] = process.argv;

  if (!product || !amountCents || !interval) {
    console.log('Usage: node create-price-variant.js <product> <amount_cents> <interval>');
    console.log('Example: node create-price-variant.js starter 1900 month');
    console.log('\nProducts: starter, professional, enterprise');
    console.log('Intervals: month, year');
    process.exit(1);
  }

  const productId = PRODUCTS[product.toLowerCase()];
  if (!productId) {
    console.error(`Invalid product: ${product}`);
    process.exit(1);
  }

  const price = await stripe.prices.create({
    product: productId,
    unit_amount: parseInt(amountCents),
    currency: 'usd',
    recurring: { interval },
    lookup_key: `${product}_${interval}ly_${amountCents}`,
  });

  console.log(`\nPrice variant created!`);
  console.log(`Amount: $${(parseInt(amountCents) / 100).toFixed(2)}/${interval}`);
  console.log(`Price ID: ${price.id}`);
  console.log(`Lookup Key: ${price.lookup_key}`);
}

createPriceVariant().catch(console.error);
