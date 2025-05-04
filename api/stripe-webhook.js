// api/stripe-webhook.js - This handles Stripe webhook events

const Stripe = require('stripe');
const { buffer } = require('micro');
const { getFirebaseAdmin } = require('../lib/firebase-admin');

exports.config = {
  api: {
    bodyParser: false,
  },
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
  
  // Handle successful payment
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const userId = session.metadata.userId;
    
    // Update user in Firebase
    const { db } = getFirebaseAdmin();
    
    try {
      await db.collection('users').doc(userId).update({
        premium: true,
        paymentDate: new Date().toISOString(),
        stripeCustomerId: session.customer
      });
      
      console.log(`User ${userId} upgraded to premium`);
    } catch (error) {
      console.error('Error updating user subscription:', error);
    }
  }
  
  res.status(200).json({ received: true });
}