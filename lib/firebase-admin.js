// lib/firebase-admin.js

const admin = require('firebase-admin');

// Initialize Firebase Admin
function getFirebaseAdmin() {
  if (!admin.apps.length) {
    // Using environment variables for sensitive credentials
    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    };

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`
    });
  }

  return {
    db: admin.firestore(),
    auth: admin.auth()
  };
}

module.exports = { getFirebaseAdmin };