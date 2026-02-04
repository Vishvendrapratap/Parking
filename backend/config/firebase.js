const admin = require("firebase-admin");

// Initialize Firebase Admin SDK
// You need to download the service account key from Firebase Console:
// 1. Go to Firebase Console > Project Settings > Service Accounts
// 2. Click "Generate new private key"
// 3. Save the JSON file and either:
//    a. Set FIREBASE_SERVICE_ACCOUNT_KEY env variable with the JSON content
//    b. Or save the file and set FIREBASE_SERVICE_ACCOUNT_PATH env variable

let firebaseApp;

const initializeFirebase = () => {
  if (firebaseApp) {
    return firebaseApp;
  }

  try {
    // Option 1: Use service account from environment variable (recommended for production)
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      const serviceAccount = JSON.parse(
        process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
      );
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    }
    // Option 2: Use service account from file path
    else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
      const serviceAccount = require(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    }
    // Option 3: Use default credentials (for Google Cloud environments)
    else {
      firebaseApp = admin.initializeApp({
        credential: admin.credential.applicationDefault(),
      });
    }

    console.log("Firebase Admin SDK initialized successfully");
    return firebaseApp;
  } catch (error) {
    console.error("Error initializing Firebase Admin SDK:", error);
    // Continue without Firebase in development
    if (process.env.NODE_ENV === "development") {
      console.warn("Firebase not configured - phone auth will not work");
      return null;
    }
    throw error;
  }
};

// Verify Firebase ID token
const verifyFirebaseToken = async (idToken) => {
  if (!firebaseApp) {
    initializeFirebase();
  }

  if (!firebaseApp) {
    throw new Error("Firebase not initialized");
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    console.error("Error verifying Firebase token:", error);
    throw error;
  }
};

// Get user by phone number from Firebase
const getFirebaseUserByPhone = async (phoneNumber) => {
  if (!firebaseApp) {
    initializeFirebase();
  }

  if (!firebaseApp) {
    throw new Error("Firebase not initialized");
  }

  try {
    const userRecord = await admin.auth().getUserByPhoneNumber(phoneNumber);
    return userRecord;
  } catch (error) {
    if (error.code === "auth/user-not-found") {
      return null;
    }
    throw error;
  }
};

module.exports = {
  initializeFirebase,
  verifyFirebaseToken,
  getFirebaseUserByPhone,
  admin,
};
