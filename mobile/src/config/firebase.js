// Firebase Configuration for Expo
// Note: Firebase Phone Auth in Expo requires additional setup
// For development, we'll use backend OTP verification
// For production, consider using:
// 1. Expo Development Build with @react-native-firebase
// 2. Firebase Phone Auth via web view
// 3. Third-party services like Twilio/MessageBird with backend

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, signInWithCustomToken } from "firebase/auth";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
};

// Initialize Firebase only if config is set
let app = null;
let auth = null;

const isFirebaseConfigured = () => {
  return firebaseConfig.apiKey !== "YOUR_API_KEY";
};

if (isFirebaseConfigured()) {
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }
  auth = getAuth(app);
}

export { app, auth, isFirebaseConfigured, signInWithCustomToken };

// Instructions to set up Firebase:
// 1. Go to https://console.firebase.google.com/
// 2. Create a new project or select existing one
// 3. Go to Project Settings > General
// 4. Under "Your apps", click "Add app" and select "Web" (</> icon)
// 5. Register your app and copy the configuration values above
// 6. For Phone Authentication:
//    - Go to Authentication > Sign-in method
//    - Enable "Phone" provider
//    - Add test phone numbers for development (Authentication > Settings > Phone numbers for testing)
