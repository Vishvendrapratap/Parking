# Firebase Authentication Setup Guide

This app uses OTP (One-Time Password) phone authentication. Here's how to set it up:

## Current Implementation

The app currently uses **backend-based OTP verification** which:

- Generates a 6-digit OTP stored in the database
- Logs OTP to console in development mode
- Supports any SMS provider for production

## Development Mode

In development, when you request an OTP:

1. Check the backend console for the OTP: `OTP for +91XXXXXXXXXX: 123456`
2. Enter this OTP in the app to verify

## Production Setup Options

### Option 1: Firebase Phone Authentication (Recommended)

**Step 1: Create Firebase Project**

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" and follow the setup wizard
3. Once created, go to Project Settings (gear icon)

**Step 2: Enable Phone Authentication**

1. Go to Authentication > Sign-in method
2. Click on "Phone" and enable it
3. Add test phone numbers (optional but recommended for development)

**Step 3: Get Web App Config (for Mobile)**

1. Go to Project Settings > General
2. Under "Your apps", click "Add app" > Web (</> icon)
3. Register your app and copy the config values
4. Update `mobile/src/config/firebase.js`:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123",
};
```

**Step 4: Get Service Account Key (for Backend)**

1. Go to Project Settings > Service Accounts
2. Click "Generate new private key"
3. Save the JSON file securely (NEVER commit to git!)
4. Set environment variable:

```bash
# Option A: As JSON string
FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"...","private_key":"..."}'

# Option B: As file path
FIREBASE_SERVICE_ACCOUNT_PATH="./config/firebase-service-account.json"
```

### Option 2: SMS Provider Integration (Twilio, MessageBird, etc.)

**Twilio Setup:**

1. Create account at [Twilio](https://www.twilio.com/)
2. Get your Account SID, Auth Token, and Phone Number
3. Add to backend `.env`:

```bash
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

4. Update `backend/controllers/authController.js` sendOTP function:

```javascript
const twilio = require("twilio");
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN,
);

// In sendOTP function:
await client.messages.create({
  body: `Your Parking App OTP is: ${otp}`,
  from: process.env.TWILIO_PHONE_NUMBER,
  to: phone,
});
```

### Option 3: AWS SNS

1. Set up AWS credentials
2. Add to backend `.env`:

```bash
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=ap-south-1
```

3. Update sendOTP to use AWS SNS

## Testing Phone Numbers

For development, you can add test phone numbers in Firebase:

1. Go to Authentication > Settings > Phone numbers for testing
2. Add numbers like `+91 1234567890` with a fixed OTP like `123456`

## Environment Variables Summary

### Backend (.env)

```bash
# Firebase (Option 1)
FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account",...}'
# OR
FIREBASE_SERVICE_ACCOUNT_PATH="./config/firebase-service-account.json"

# Twilio (Option 2)
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_PHONE_NUMBER=+1234567890
```

### Mobile (src/config/firebase.js)

Update the `firebaseConfig` object with your Firebase project details.

## Troubleshooting

**OTP not received:**

- Check backend console for the OTP in development
- Verify phone number format includes country code (+91)
- Check SMS provider logs if configured

**Firebase errors:**

- Ensure Phone Authentication is enabled in Firebase Console
- Check if the phone number format is correct
- Verify service account key is valid

**"Too many requests" error:**

- Firebase has rate limits on phone auth
- Wait a few minutes or use test phone numbers
