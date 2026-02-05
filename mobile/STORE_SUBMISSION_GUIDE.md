# 📱 App Store & Play Store Submission Guide

## 🎯 Overview

This guide walks you through publishing ParkEase to both the Apple App Store and Google Play Store using Expo EAS (Expo Application Services).

---

## 📋 Pre-Submission Checklist

### 1. Developer Accounts (Required)

- [ ] **Apple Developer Account**: $99/year - [developer.apple.com](https://developer.apple.com)
- [ ] **Google Play Console**: $25 one-time - [play.google.com/console](https://play.google.com/console)

### 2. App Configuration

Update these placeholders in `app.json`:

```json
{
  "ios": {
    "bundleIdentifier": "com.yourcompany.parkease", // Use your domain reversed
    "config": {
      "googleMapsApiKey": "YOUR_ACTUAL_IOS_API_KEY"
    }
  },
  "android": {
    "package": "com.yourcompany.parkease",
    "config": {
      "googleMaps": {
        "apiKey": "YOUR_ACTUAL_ANDROID_API_KEY"
      }
    }
  },
  "extra": {
    "eas": {
      "projectId": "YOUR_EAS_PROJECT_ID" // From expo.dev dashboard
    }
  },
  "owner": "your-expo-username"
}
```

### 3. Required Assets

Create these assets in `/mobile/assets/`:

| Asset               | Size      | Format                | Purpose               |
| ------------------- | --------- | --------------------- | --------------------- |
| `icon.png`          | 1024x1024 | PNG (no transparency) | App icon              |
| `adaptive-icon.png` | 1024x1024 | PNG                   | Android adaptive icon |
| `splash.png`        | 1284x2778 | PNG                   | Splash screen         |
| `favicon.png`       | 48x48     | PNG                   | Web favicon           |

**Icon Guidelines:**

- No transparency for iOS
- Adaptive icons should have important content in center 66%
- Use consistent branding colors

---

## 🔧 Setup EAS

### Step 1: Install EAS CLI

```bash
npm install -g eas-cli
```

### Step 2: Login to Expo

```bash
eas login
```

### Step 3: Configure Project

```bash
cd mobile
eas build:configure
```

This will generate your `projectId` in `app.json`.

### Step 4: Update `eas.json`

Replace placeholders in `eas.json`:

```json
{
  "submit": {
    "production": {
      "ios": {
        "appleId": "your@email.com",
        "ascAppId": "1234567890",
        "appleTeamId": "ABCD1234"
      }
    }
  }
}
```

---

## 🍎 iOS App Store Submission

### Step 1: Create App in App Store Connect

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Click **My Apps** → **+** → **New App**
3. Fill in:
   - Platform: iOS
   - Name: ParkEase
   - Primary Language: English
   - Bundle ID: Select your bundle identifier
   - SKU: parkease-001

### Step 2: Build iOS Production

```bash
cd mobile
eas build --platform ios --profile production
```

This will:

- Create provisioning profiles automatically
- Build and sign your app
- Upload to EAS servers

### Step 3: Submit to App Store

```bash
eas submit --platform ios --profile production
```

Or manually:

1. Download the `.ipa` from EAS dashboard
2. Use Transporter app (Mac) to upload
3. Select the build in App Store Connect

### Step 4: Complete App Store Listing

**Required Information:**

| Field              | Value                                                      |
| ------------------ | ---------------------------------------------------------- |
| App Name           | ParkEase                                                   |
| Subtitle           | Find & Book Parking Nearby                                 |
| Category           | Navigation / Lifestyle                                     |
| Keywords           | parking, car park, book parking, find parking, park nearby |
| Support URL        | Your website                                               |
| Privacy Policy URL | **Required** - See below                                   |

**Screenshots Required:**

- 6.7" (iPhone 15 Pro Max): 1290 x 2796 px
- 6.5" (iPhone 14 Plus): 1284 x 2778 px
- 5.5" (iPhone 8 Plus): 1242 x 2208 px
- iPad Pro 12.9": 2048 x 2732 px

**App Description (Example):**

```
ParkEase - Your Smart Parking Solution

Find and book parking spaces near you with ease!

🚗 KEY FEATURES:
• Search for parking by location, city, or landmark
• View real-time availability and pricing
• Book parking spots instantly
• In-app chat with parking space owners
• Manage all your bookings in one place

👤 FOR PARKING OWNERS:
• List your parking space and earn money
• Set your own prices and availability
• Manage bookings effortlessly
• Chat with customers directly

📍 LOCATION-BASED:
• Find parking near your destination
• View parking on interactive map
• Get directions to your booked spot

Download ParkEase today and never circle the block again!
```

### Step 5: App Review

Apple reviews typically take 24-48 hours. Common rejection reasons:

- Missing privacy policy
- Crashes or bugs
- Incomplete metadata
- Guideline violations

---

## 🤖 Google Play Store Submission

### Step 1: Create App in Play Console

1. Go to [Google Play Console](https://play.google.com/console)
2. Click **Create app**
3. Fill in:
   - App name: ParkEase
   - Default language: English
   - App or game: App
   - Free or paid: Free

### Step 2: Setup Service Account (for automated submission)

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a service account with "Service Account User" role
3. Grant access in Play Console under **Users and permissions**
4. Download JSON key and save as `mobile/play-store-service-account.json`
5. Add to `.gitignore`:
   ```
   play-store-service-account.json
   ```

### Step 3: Build Android Production

```bash
cd mobile
eas build --platform android --profile production
```

This creates an `.aab` (Android App Bundle) file.

### Step 4: Submit to Play Store

```bash
eas submit --platform android --profile production
```

Or manually:

1. Download the `.aab` from EAS dashboard
2. Go to Play Console → **Production** → **Create new release**
3. Upload the `.aab` file

### Step 5: Complete Store Listing

**Required Information:**

| Field             | Value                               |
| ----------------- | ----------------------------------- |
| App name          | ParkEase                            |
| Short description | Find and book parking spaces nearby |
| Full description  | Same as iOS                         |
| Category          | Maps & Navigation                   |

**Screenshots Required:**

- Phone: 16:9 or 9:16 ratio, min 1080px
- 7" tablet: Optional
- 10" tablet: Optional

**Feature Graphic:**

- Size: 1024 x 500 px
- Required for Play Store listing

### Step 6: Content Rating

Complete the content rating questionnaire:

1. Go to **Policy** → **App content** → **Content rating**
2. Answer questions about your app content
3. Your app will likely be rated "Everyone"

### Step 7: Data Safety

Complete the Data Safety form:

1. Go to **Policy** → **App content** → **Data safety**
2. Declare what data you collect:
   - Location (for finding parking)
   - Name, email, phone (for account)
   - Payment info (if applicable)
3. Explain data usage and security

---

## 📜 Privacy Policy (Required)

Create a privacy policy page. Here's a template:

```markdown
# ParkEase Privacy Policy

Last updated: [DATE]

## Information We Collect

### Personal Information

- Name and email address (for account creation)
- Phone number (for verification and communication)
- Location data (to find parking near you)

### Usage Information

- Booking history
- Search preferences
- Chat messages with parking owners

## How We Use Your Information

- To provide parking search and booking services
- To communicate about your bookings
- To improve our services
- To send important updates about your account

## Data Sharing

We do not sell your personal information. We share data only with:

- Parking space owners (to fulfill bookings)
- Payment processors (to process transactions)
- Service providers (to operate our app)

## Data Security

We implement industry-standard security measures to protect your data.

## Contact Us

[Your email]
[Your address]
```

Host this on your website and add the URL to both store listings.

---

## 🚀 Build Commands Summary

```bash
# Development build (for testing)
eas build --platform all --profile development

# Preview build (internal testing)
eas build --platform all --profile preview

# Production build (store submission)
eas build --platform ios --profile production
eas build --platform android --profile production

# Submit to stores
eas submit --platform ios --profile production
eas submit --platform android --profile production
```

---

## ⚙️ Production Environment

### Update API URL

Create/update `mobile/src/constants/config.js` for production:

```javascript
const ENV = {
  development: {
    API_URL: "http://YOUR_LOCAL_IP:5000/api",
    SOCKET_URL: "http://YOUR_LOCAL_IP:5000",
  },
  production: {
    API_URL: "https://your-production-api.com/api",
    SOCKET_URL: "https://your-production-api.com",
  },
};

const getEnvVars = () => {
  if (__DEV__) {
    return ENV.development;
  }
  return ENV.production;
};

export const { API_URL, SOCKET_URL } = getEnvVars();
```

### Backend Deployment Options

Deploy your Express backend to:

- **Railway** - Easy Node.js hosting
- **Render** - Free tier available
- **DigitalOcean App Platform**
- **AWS Elastic Beanstalk**
- **Heroku**

---

## 📊 Post-Launch Checklist

- [ ] Monitor crash reports (EAS Insights / Sentry)
- [ ] Respond to user reviews
- [ ] Track analytics (Firebase Analytics)
- [ ] Plan regular updates
- [ ] Monitor API performance

---

## 🆘 Common Issues

### Build Fails

```bash
# Clear cache and rebuild
eas build --platform all --profile production --clear-cache
```

### iOS Signing Issues

```bash
# Reset credentials
eas credentials --platform ios
```

### Android Keystore Issues

```bash
# View current credentials
eas credentials --platform android
```

---

## 📞 Support Resources

- [Expo EAS Documentation](https://docs.expo.dev/eas/)
- [App Store Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Google Play Policy Center](https://play.google.com/console/about/guides/)
