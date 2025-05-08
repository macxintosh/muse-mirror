const Stripe = require('stripe');
const { getFirebaseAdmin } = require('../lib/firebase-admin');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, email } = req.body;
    if (!userId || !email) {
      return res.status(400).json({ error: 'Missing userId or email' });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const customer = await stripe.customers.create({
      email,
      metadata: { userId }
    });

    // Store the Stripe customer ID in Firestore
    const { db } = getFirebaseAdmin();
    await db.collection('users').doc(userId).set({
      stripeCustomerId: customer.id
    }, { merge: true });

    res.status(200).json({ stripeCustomerId: customer.id });
  } catch (error) {
    console.error('Error creating Stripe customer:', error);
    res.status(500).json({ error: 'Failed to create Stripe customer', message: error.message });
  }
} 