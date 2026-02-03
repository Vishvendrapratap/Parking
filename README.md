# 🅿️ Parking App

A full-stack community-based parking platform where people can list their home parking spaces and others can book them.

## Features

### For Parking Seekers

- 🔍 Search for available parking spots using maps
- 📍 Filter by location, price, amenities, and vehicle type
- 📅 Book parking spaces for hourly, daily, or monthly rates
- 💬 Chat directly with parking space owners
- ⭐ Leave reviews and ratings

### For Parking Space Owners

- 🏠 List your driveway, garage, or parking spot
- 💰 Set your own prices and availability
- 📊 Dashboard to track earnings and bookings
- 📱 Manage bookings and communicate with guests
- 🔔 Get notified of new booking requests

### Admin Features

- 👥 User management
- 📋 Listing moderation
- 📈 Platform analytics
- 🛡️ Content moderation

## Tech Stack

### Backend

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Real-time**: Socket.io for chat functionality
- **File Upload**: Cloudinary for image storage
- **SMS**: Twilio for OTP verification

### Mobile App (iOS & Android)

- **Framework**: React Native with Expo SDK 50
- **Navigation**: React Navigation v6
- **Maps**: react-native-maps with Google Maps
- **Chat**: React Native Gifted Chat
- **State Management**: React Context API

### Web App

- **Framework**: React 18 with Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router v6
- **Maps**: @react-google-maps/api
- **State**: React Context + Zustand
- **HTTP Client**: Axios
- **Notifications**: react-hot-toast

## Project Structure

```
Parking/
├── backend/                 # Node.js + Express API
│   ├── config/             # Database & cloud configs
│   ├── controllers/        # Route handlers
│   ├── middleware/         # Auth & validation
│   ├── models/            # Mongoose schemas
│   ├── routes/            # API routes
│   ├── socket/            # Socket.io handlers
│   ├── utils/             # Helper functions
│   └── server.js          # Entry point
│
├── mobile/                 # React Native + Expo
│   ├── src/
│   │   ├── api/           # Axios setup & services
│   │   ├── components/    # Reusable components
│   │   ├── contexts/      # Auth & Socket contexts
│   │   ├── hooks/         # Custom hooks
│   │   ├── navigation/    # Navigation config
│   │   └── screens/       # App screens
│   └── App.js             # Entry point
│
└── web/                    # React + Vite
    ├── src/
    │   ├── api/           # Axios setup & services
    │   ├── components/    # Reusable components
    │   ├── contexts/      # Auth & Socket contexts
    │   └── pages/         # Page components
    │       ├── admin/     # Admin dashboard pages
    │       └── owner/     # Owner dashboard pages
    └── index.html         # Entry point
```

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- Expo CLI (for mobile development)
- Google Maps API key

### Environment Variables

Create `.env` files based on the templates:

#### Backend (.env)

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/parking-app
JWT_SECRET=your-secret-key
JWT_EXPIRE=7d
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
GOOGLE_MAPS_API_KEY=your-maps-key
CLIENT_URL=http://localhost:5173
```

#### Web (.env)

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
VITE_GOOGLE_MAPS_API_KEY=your-maps-key
```

### Installation

1. **Clone the repository**

```bash
git clone <repository-url>
cd Parking
```

2. **Install Backend Dependencies**

```bash
cd backend
npm install
```

3. **Install Mobile Dependencies**

```bash
cd mobile
npm install
```

4. **Install Web Dependencies**

```bash
cd web
npm install
```

### Running the Application

1. **Start Backend Server**

```bash
cd backend
npm run dev
```

Server runs on http://localhost:5000

2. **Start Mobile App**

```bash
cd mobile
npx expo start
```

Scan QR code with Expo Go app

3. **Start Web App**

```bash
cd web
npm run dev
```

Open http://localhost:5173

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/send-otp` - Send OTP to phone
- `POST /api/auth/verify-otp` - Verify OTP

### Parking Spaces

- `GET /api/parking/search` - Search parking spaces
- `GET /api/parking/nearby` - Get nearby spaces
- `GET /api/parking/:id` - Get space details
- `POST /api/parking` - Create new listing (owner)
- `PUT /api/parking/:id` - Update listing (owner)
- `DELETE /api/parking/:id` - Delete listing (owner)

### Bookings

- `POST /api/bookings` - Create booking
- `GET /api/bookings` - Get user's bookings
- `GET /api/bookings/:id` - Get booking details
- `PUT /api/bookings/:id/status` - Update booking status
- `PUT /api/bookings/:id/cancel` - Cancel booking

### Chat

- `GET /api/chat/conversations` - Get conversations
- `GET /api/chat/messages/:id` - Get messages
- `POST /api/chat/messages` - Send message

## License

MIT License

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting a PR.
