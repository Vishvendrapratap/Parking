# Parking App - AI Coding Instructions

## Architecture Overview

This is a **full-stack community parking platform** with three interconnected applications:

- **Backend** (`/backend`): Express.js REST API with Socket.io real-time chat
- **Mobile** (`/mobile`): React Native + Expo SDK 54 app
- **Web** (`/web`): React 19 + Vite + Tailwind CSS app

### User Roles & Navigation Flow

The app supports three roles: `seeker` (book parking), `owner` (list parking), `admin` (moderate platform).

- Mobile: Role determines tab navigation (`SeekerTabs` vs `OwnerTabs` in [AppNavigator.js](mobile/src/navigation/AppNavigator.js))
- Web: Routes use `<ProtectedRoute requiredRole="admin">` pattern in [App.jsx](web/src/App.jsx)

## Development Commands

```bash
# Backend (requires .env from README.env.md)
cd backend && npm run dev          # nodemon hot-reload
cd backend && npm run seed         # seed database with test data

# Mobile (update LOCAL_IP in mobile/src/constants/config.js to your PC IP)
cd mobile && npx expo start        # Expo development server

# Web
cd web && npm run dev              # Vite dev server on :5173
```

## Critical Patterns

### API Layer Structure

Both frontends share identical API service patterns but different implementations:

- **Mobile** ([mobile/src/api/services.js](mobile/src/api/services.js)): Individual function exports
- **Web** ([web/src/api/services.js](web/src/api/services.js)): Object-grouped service exports (`authService`, `parkingService`, etc.)

Always match the existing pattern when adding endpoints.

### Authentication Flow

1. JWT stored in `expo-secure-store` (mobile) or localStorage (web)
2. Token sent as `Bearer` in Authorization header via axios interceptors
3. Backend middleware chain: `protect` → `authorize(roles)` in [middleware/auth.js](backend/middleware/auth.js)
4. Firebase optional for phone OTP (`firebaseUid` field on User model)

### Real-time Chat (Socket.io)

- Backend: [socket/socketHandler.js](backend/socket/socketHandler.js) - auth via JWT in handshake
- Events: `join_conversation`, `send_message`, `new_message`, `typing_start/stop`
- Socket instance attached to Express app: `app.get("io")` for emitting from controllers

### Geospatial Queries

MongoDB 2dsphere index on `location.coordinates` (GeoJSON format: `[longitude, latitude]`).
See [parkingController.js](backend/controllers/parkingController.js) `$near` queries with fallback when index missing.

## Data Models

Core models in [backend/models/](backend/models/):

- `User`: roles, `firebaseUid` (optional), GeoJSON location, nested `otp` for verification
- `ParkingSpace`: owner ref, GeoJSON location, `amenities` array, `availabilitySchedule` per day
- `Booking`: references User + ParkingSpace, status enum, pricing snapshot
- `ChatMessage/Conversation`: linked to optional `parkingSpace` context

## Code Conventions

- **Backend responses**: Always `{ success: boolean, data?, message?, error? }`
- **Mobile screens**: Located in `/screens` with auth screens in `/screens/auth`, owner screens in `/screens/owner`
- **Web pages**: Located in `/pages` with admin in `/pages/admin`, owner in `/pages/owner`
- **Icons**: Use FontAwesome via custom `Icon` component ([mobile/src/components/Icon.js](mobile/src/components/Icon.js))
- **Styling**: Mobile uses inline styles + `COLORS` from config; Web uses Tailwind utility classes

## Environment Configuration

Backend requires `.env` (see [README.env.md](README.env.md)):

- `MONGODB_URI`, `JWT_SECRET`, `JWT_EXPIRE`
- `CLOUDINARY_*` for image uploads
- `GOOGLE_MAPS_API_KEY` for geocoding

Mobile: Update `LOCAL_IP` in [mobile/src/constants/config.js](mobile/src/constants/config.js) for physical device testing.

## Common Tasks

**Adding a new API endpoint:**

1. Create/update controller in `backend/controllers/`
2. Add route in `backend/routes/` with appropriate middleware
3. Add service function in both `mobile/src/api/services.js` and `web/src/api/services.js`

**Adding a new screen (mobile):**

1. Create screen in `mobile/src/screens/`
2. Register in [AppNavigator.js](mobile/src/navigation/AppNavigator.js) within appropriate stack

**Adding image upload:**
Use `multer` + `multer-storage-cloudinary` middleware (see [config/cloudinary.js](backend/config/cloudinary.js)).
Frontend sends `multipart/form-data` with explicit Content-Type header.
