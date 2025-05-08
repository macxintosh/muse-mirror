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
      const updateData = {
        premium: isPremium,
        subscriptionStatus: status,
        subscriptionUpdated: new Date().toISOString(),
      };

      // If this is a new premium status, add additional fields
      if (isPremium) {
        updateData.premiumSince = new Date().toISOString();
        updateData.checkoutStatus = 'completed';
      }

      await usersRef.doc(doc.id).set(updateData, { merge: true });
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

      const updateData = {
        premium: true,
        paymentDate: new Date().toISOString(),
        stripeCustomerId: session.customer,
        subscriptionStatus: 'active',
        checkoutStatus: 'completed',
        premiumSince: new Date().toISOString()
      };

      await usersRef.doc(userIdCheckout).set(updateData, { merge: true });
      console.log(`✅ User ${userIdCheckout} upgraded to premium (checkout)`);
      break;
    }

    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object;
      const userId = paymentIntent.metadata?.userId;

      if (userId) {
        await usersRef.doc(userId).set({
          paymentStatus: 'succeeded',
          paymentDate: new Date().toISOString(),
          lastPaymentIntent: paymentIntent.id
        }, { merge: true });
        console.log(`✅ Payment succeeded for user ${userId}`);
      }
      break;
    }

    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object;
      const userId = paymentIntent.metadata?.userId;

      if (userId) {
        await usersRef.doc(userId).set({
          paymentStatus: 'failed',
          paymentError: paymentIntent.last_payment_error?.message || 'Unknown error',
          lastPaymentIntent: paymentIntent.id
        }, { merge: true });
        console.log(`❌ Payment failed for user ${userId}`);
      }
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