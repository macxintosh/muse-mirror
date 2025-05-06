// api/stripe-webhook.js - Robust subscription webhook handling (updated and refined)

const Stripe = require('stripe');
const { buffer } = require('micro');
const { getFirebaseAdmin } = require('../lib/firebase-admin');

exports.config = {
  api: { bodyParser: false },
};

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  const buf = await buffer(req);
  const sig = req.headers['stripe-signature'];

  let event;

  try {
    event = stripe.webhooks.constructEvent(buf.toString(), sig, webhookSecret);
  } catch (err) {
    console.error(`Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const { db } = getFirebaseAdmin();
  const usersRef = db.collection('users');

  async function updatePremiumStatus(customerId, isPremium, status) {
    const snapshot = await usersRef.where('stripeCustomerId', '==', customerId).get();

    if (snapshot.empty) {
      console.error(`❌ No user found for customer ID: ${customerId}`);
      return;
    }

    snapshot.forEach(async (doc) => {
      await usersRef.doc(doc.id).update({
        premium: isPremium,
        subscriptionStatus: status,
        subscriptionUpdated: new Date().toISOString(),
      });

      console.log(`✅ User ${doc.id} premium status updated: ${isPremium}, status: ${status}`);
    });
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const userIdCheckout = session.metadata?.userId;

      if (!userIdCheckout) {
        console.error('❌ No userId in session metadata');
        break;
      }

      await usersRef.doc(userIdCheckout).update({
        premium: true,
        paymentDate: new Date().toISOString(),
        stripeCustomerId: session.customer,
        subscriptionStatus: 'active',
      });

      console.log(`✅ User ${userIdCheckout} upgraded to premium (checkout)`);
      break;
    }

    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const subscription = event.data.object;
      const isPremium = subscription.status === 'active';

      await updatePremiumStatus(
        subscription.customer,
        isPremium,
        subscription.status
      );

      break;
    }

    case 'customer.subscription.deleted': {
      const canceledSubscription = event.data.object;

      await updatePremiumStatus(
        canceledSubscription.customer,
        false,
        'canceled'
      );

      break;
    }

    case 'customer.updated': {
      const customer = event.data.object;
      console.log('Customer details updated:', customer.id);
      break;
    }

    default:
      console.warn(`Unhandled event type: ${event.type}`);
  }

  res.status(200).json({ received: true });
};