// api/create-checkout-session.js - This handles Stripe payment processing

const Stripe = require('stripe');
const { getFirebaseAdmin } = require('../lib/firebase-admin');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, email } = req.body;
    
    // Initialize Stripe
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    
    // Get the user document
    const { db } = getFirebaseAdmin();
    const userDoc = await db.collection('users').doc(userId).get();
    let userData = userDoc.data();
    let stripeCustomerId = userData?.stripeCustomerId;

    // If no Stripe customer ID, create one and save it
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email,
        metadata: { userId }
      });
      stripeCustomerId = customer.id;
      await db.collection('users').doc(userId).set({ stripeCustomerId }, { merge: true });
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: 'price_1RL9ryRLBoNQf97bpXdZfJvL', // Recurring subscription price ID
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${req.headers.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/`,
      customer: stripeCustomerId, // Always use the user's Stripe customer
      customer_email: email,
      metadata: {
        userId: userId,
        productType: 'lifetime',
        purchaseDate: new Date().toISOString()
      }
    });

    // Update user document to track checkout session
    await db.collection('users').doc(userId).set({
      lastCheckoutSession: session.id,
      checkoutStatus: 'pending',
      checkoutDate: new Date().toISOString()
    }, { merge: true });

    res.status(200).json({ id: session.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
}