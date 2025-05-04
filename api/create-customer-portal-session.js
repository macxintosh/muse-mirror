// api/create-customer-portal-session.js - Manage subscription

const Stripe = require('stripe');
const { getFirebaseAdmin } = require('../lib/firebase-admin');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId } = req.body;
    
    // Get user data from Firebase
    const { db } = getFirebaseAdmin();
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userData = userDoc.data();
    const stripeCustomerId = userData.stripeCustomerId;
    
    if (!stripeCustomerId) {
      return res.status(400).json({ error: 'No Stripe customer found for this user' });
    }
    
    // Initialize Stripe
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    
    // Create customer portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${req.headers.origin}/`,
    });
    
    res.status(200).json({ url: session.url });
  } catch (error) {
    console.error('Error creating customer portal session:', error);
    res.status(500).json({ error: 'Failed to create customer portal session' });
  }
}