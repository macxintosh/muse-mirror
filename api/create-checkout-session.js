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
    
    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Muse Mirror Lifetime',
              description: 'Unlimited access to Muse Mirror',
            },
            unit_amount: 500, // $5.00
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${req.headers.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/`,
      customer_email: email,
      metadata: {
        userId: userId,
        productType: 'lifetime',
        purchaseDate: new Date().toISOString()
      },
      payment_intent_data: {
        metadata: {
          userId: userId,
          productType: 'lifetime'
        }
      }
    });

    // Update user document to track checkout session
    const { db } = getFirebaseAdmin();
    await db.collection('users').doc(userId).update({
      lastCheckoutSession: session.id,
      checkoutStatus: 'pending',
      checkoutDate: new Date().toISOString()
    });

    res.status(200).json({ id: session.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
}