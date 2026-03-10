# GuardianPath - Family Safety & GPS Tracking

A comprehensive MERN stack application for family safety with real-time GPS tracking, geofencing, and SOS alerts.

## Features

- 🗺️ **Real-time GPS Tracking** - Track family members' locations in real-time
- 📍 **Geofencing** - Create safe zones and restricted areas with instant alerts
- 🆘 **SOS Alerts** - Emergency alerts with camera capture and sound notifications
- 📊 **Location History** - View detailed location history and routes
- 👨‍👩‍👧‍👦 **Family Management** - Manage multiple children from a single parent account
- 🔔 **Push Notifications** - Real-time notifications for geofence entries/exits
- 🛡️ **Admin Dashboard** - Comprehensive admin panel for user management

## Tech Stack

- **Frontend:** React 18, Vite, Tailwind CSS, React Leaflet
- **Backend:** Node.js, Express.js, Socket.io
- **Database:** MongoDB
- **Authentication:** JWT

## Local Development

### Prerequisites

- Node.js >= 18.0.0
- MongoDB

### Installation

1. Clone the repository:

```bash
git clone https://github.com/Shubhamkumar70/geofence.git
cd geofence
```

2. Install dependencies:

```bash
# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

3. Set up environment variables:

```bash
# Copy example env file
cp .env.example backend/.env

# Edit the .env file with your values
```

4. Seed the database (optional):

```bash
cd backend && node seeds/seedData.js
```

5. Start development servers:

```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd frontend && npm run dev
```

## Deployment on Render

### Option 1: Using render.yaml (Recommended)

1. Push your code to GitHub
2. Go to [Render Dashboard](https://dashboard.render.com)
3. Click "New" → "Blueprint"
4. Connect your GitHub repository
5. Render will automatically detect the `render.yaml` and configure the service
6. Add the following environment variables in Render:
   - `MONGODB_URI` - Your MongoDB connection string (use MongoDB Atlas)
   - `JWT_SECRET` - A secure random string for JWT signing

### Option 2: Manual Setup

1. Create a new "Web Service" on Render
2. Connect your GitHub repository
3. Configure:
   - **Build Command:** `npm install --prefix backend && npm install --prefix frontend && npm run build --prefix frontend`
   - **Start Command:** `npm start --prefix backend`
4. Add environment variables:
   - `NODE_ENV=production`
   - `PORT=5000`
   - `MONGODB_URI=your_mongodb_uri`
   - `JWT_SECRET=your_secret_key`
   - `JWT_EXPIRE=30d`

## Test Credentials

After running seed data:

| Role   | Email              | Password    |
| ------ | ------------------ | ----------- |
| Admin  | admin@example.com  | admin123    |
| Parent | parent@example.com | password123 |
| Child  | emma@example.com   | password123 |
| Child  | lucas@example.com  | password123 |

## API Endpoints

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/children` - Get all children
- `GET /api/locations/:childId/history` - Get location history
- `POST /api/geofences` - Create geofence
- `GET /api/alerts` - Get all alerts
- `POST /api/alerts/sos` - Trigger SOS alert

## License

MIT
