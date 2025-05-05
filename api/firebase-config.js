// api/firebase-config.js - Add this new file
const admin = require('firebase-admin');
const { getFirebaseAdmin } = require('../lib/firebase-admin');

module.exports = async function handler(req, res) {
  // Set CORS headers to allow access from your domain
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle OPTIONS method for preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Initialize Firebase Admin
    const { db } = getFirebaseAdmin();
    
    // Return a simple success message
    res.status(200).json({ 
      status: 'success', 
      message: 'Firebase connection established' 
    });
  } catch (error) {
    console.error('Firebase config error:', error);
    res.status(500).json({ 
      status: 'error', 
      message: error.message 
    });
  }
}