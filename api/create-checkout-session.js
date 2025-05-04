import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const firebaseApp = initializeApp({ credential: applicationDefault() });
const db = getFirestore();

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { uid } = req.body;
  try {
    const customer = await stripe.customers.create({ metadata: { firebaseUID: uid } });

    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'],
      line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
      mode: 'subscription',
      success_url: 'https://musemirror.place?success=true',
      cancel_url: 'https://musemirror.place?canceled=true'
    });

    await db.collection('users').doc(uid).update({ stripeCustomerId: customer.id });
    res.status(200).json({ sessionId: session.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}