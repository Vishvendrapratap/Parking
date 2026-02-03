# Parking App - Environment Variables

# Backend Configuration

# =====================

# Server

NODE_ENV=development
PORT=5000

# MongoDB Connection

MONGODB_URI=mongodb://localhost:27017/parking-app

# JWT Configuration

JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRE=7d

# Cloudinary (for image uploads)

CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Twilio (for SMS OTP)

TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# Google Maps API

GOOGLE_MAPS_API_KEY=your-google-maps-api-key

# Frontend URLs (for CORS)

CLIENT_URL=http://localhost:5173
MOBILE_URL=exp://localhost:8081

# Web Frontend Configuration (Vite)

# =================================

# Create a .env file in the /web directory with:

# VITE_API_URL=http://localhost:5000/api

# VITE_SOCKET_URL=http://localhost:5000

# VITE_GOOGLE_MAPS_API_KEY=your-google-maps-api-key

# Mobile Configuration

# ====================

# Update the constants in /mobile/src/constants/config.js
