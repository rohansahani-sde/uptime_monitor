# upTime — Production-Grade SaaS Uptime Monitoring Platform

upTime is a production-ready, self-hosted, SaaS Uptime Monitoring platform modeled after industry-leading solutions like Better Stack and UptimeRobot. Built using the modern **MERN (MongoDB, Express, React, Node.js)** stack, it enables users to monitor websites and REST APIs in real-time, inspect latencies, receive email notifications on incidents, configure status pages, and administer subscription plans.

---

## 🚀 Key Features

* **Dual Monitoring Modes**: Seamlessly monitor static Websites and dynamic REST APIs (with custom HTTP headers, methods, and expected status codes).
* **High-Precision Checking Engine**: Cron-scheduled checkers that support custom timeouts, DNS failure protections, and up to 3 automatic retries before confirming outages.
* **Incident Lifecycle Management**: Outage detection engine that automatically flags slow/down services, tracks downtime duration, registers failure root causes, and sends recover alerts.
* **Instant Email Notifications**: Integrated SMTP mail service that dispatches emails to premium tier users immediately upon outages and recovery.
* **Interactive Frontend Dashboards**: Custom charts powered by **Recharts** displaying latency histories (1h, 6h, 12h, 24h ranges) and a 48-segment color-coded timeline (Uptime Bars) representing 24 hours of availability.
* **Public Status Pages**: Exposes a unique slug for each monitor allowing public visitors to verify system health metrics without authentication.
* **SaaS Tier Limits**: Supports Free, Premium, and Admin plan tiers enforcing monitor count limits (5 for Free, 50 for Premium, Unlimited for Admin) and checking intervals.
* **Razorpay Subscription Gateway**: Architecturally prepared billing routes with mock payment checkouts.
* **Full Administrator Panel**: Gives admin accounts platform-wide oversight including global analytics (lifetime checks, total users, system-wide active outages) and user account management (updating roles, switching subscription plans, or deleting accounts).

---

## 🛠️ Technology Stack

### Frontend
* **Core Framework**: React (Vite setup, Vanilla CSS for core styling design tokens)
* **Styling**: Tailwind CSS (Harmonious Indigo and dark-themed palette)
* **State & Fetching**: Axios, TanStack Query (React Query)
* **Visual Charts**: Recharts (for latency logs)
* **Notifications**: React Hot Toast
* **Animations**: Framer Motion, Tailwind custom CSS transitions
* **Routing**: React Router DOM (v6 nested routes with Protected & Admin Guards)

### Backend
* **Core API**: Node.js, Express.js (Modular MVC architecture)
* **Database**: MongoDB Atlas, Mongoose ODM
* **Authentication**: JWT Auth (with cookie-stored Session and Refresh tokens)
* **Scheduling Core**: Node Cron (for periodic checking queues)
* **Alerts**: Nodemailer (Gmail SMTP setup)
* **Security**: Helmet, CORS, Express-Rate-Limit, XSS-Clean

---

## 📁 Project Structure

```text
upTime/
├── backend/
│   ├── src/
│   │   ├── config/          # DB, Winston, environment variables validation
│   │   ├── models/          # User, Monitor, CheckHistory, Incident, Subscription schemas
│   │   ├── middleware/      # Auth, rate-limiter, error-handler, plan-gates
│   │   ├── services/        # Business logic: checks, alerts, weekly-reports
│   │   ├── controllers/     # API request handlers
│   │   ├── routes/          # REST endpoints mapping
│   │   └── engine/          # Outage detector, alert dispatcher, cron scheduler
│   ├── .env.example
│   ├── server.js            # Express API entry point
│   └── package.json
└── frontend/
    ├── src/
    │   ├── api/             # Centralized Axios setup & domain endpoints
    │   ├── components/      # UI components, Spinners, Dashboard Layouts
    │   ├── contexts/        # AuthContext for session management
    │   ├── hooks/           # Guards, routes, hooks
    │   ├── pages/           # Login, Signup, Overview, Monitor Details, Billing, Admin
    │   ├── App.jsx          # Route configurations
    │   ├── main.jsx         # App bootstrapping
    │   └── index.css        # Core custom Tailwind CSS styling tokens
    ├── tailwind.config.js
    ├── vite.config.js
    └── package.json
```

---

## ⚙️ Environment Configuration

Copy the configuration files and populate with your own credentials:

### 1. Backend Config (`backend/.env`)
Create a `.env` file in the `backend/` folder:
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# Database Connection
MONGODB_URI=mongodb://127.0.0.1:27017/uptime_monitor

# Authentication Secrets
JWT_SECRET=super_secret_session_key_for_jwt_tokens_uptime_saas_development
JWT_REFRESH_SECRET=super_secret_refresh_key_for_tokens_uptime_saas_development
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Google OAuth (Optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# Nodemailer SMTP Configuration (Optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_gmail_app_password
EMAIL_FROM=UptimeMonitor <your_gmail@gmail.com>

# Razorpay API Secrets (Optional)
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

### 2. Frontend Config (`frontend/.env`)
Create a `.env` file in the `frontend/` folder:
```env
# Google OAuth Client ID (matching your Google console client ID)
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

---

## 🏃 Local Run Guide

Prerequisites: Ensure you have **Node.js (v18+)** and a running instance of **MongoDB** (either MongoDB Community Server running locally at `mongodb://127.0.0.1:27017` or a MongoDB Atlas Cluster URL in `backend/.env`).

### Step 1: Install Dependencies
Open two terminals in the project root:

**In terminal 1 (Backend):**
```bash
cd backend
npm install
```

**In terminal 2 (Frontend):**
```bash
cd frontend
npm install
```

### Step 2: Start the Servers

**In terminal 1 (Backend - Development Server):**
```bash
npm run dev
```
*The API server will launch at [http://localhost:5000](http://localhost:5000)*

**In terminal 2 (Frontend - Development Server):**
```bash
npm run dev
```
*The Vite development server will spin up at [http://localhost:5173](http://localhost:5173)*

### Step 3: Access the Platform
* Visit `http://localhost:5173` to register your first user account.
* Revert to the console to observe check schedulers polling website endpoints.

---

## 🛡️ API Endpoints Summary

### Auth (`/api/auth`)
* `POST /signup` - Registers a new user.
* `POST /login` - Starts a JWT cookie session.
* `POST /google` - Handles client-side Google OAuth ticket validations.
* `POST /refresh` - Refreshes expired access tokens.
* `POST /logout` - Terminates active session.
* `GET /me` - Returns logged-in user profile.

### Monitors (`/api/monitors`)
* `GET /` - List all user monitors.
* `POST /` - Create a new monitor.
* `GET /:id` - Get details of a single monitor.
* `PUT /:id` - Edit monitor configurations.
* `DELETE /:id` - Erase monitor & history.
* `POST /:id/pause` - Pauses ping scheduler.
* `POST /:id/resume` - Resumes ping scheduler.
* `POST /:id/test` - Trigger immediate ping validation.

### Analytics (`/api/analytics`)
* `GET /:monitorId/response-time` - Fetch historical response times.
* `GET /:monitorId/uptime` - Fetch general uptime calculations (24h, 7d, 30d).
* `GET /:monitorId/bars` - Exposes 48 time-window blocks for 24h timeline.
* `GET /:monitorId/incidents` - Exposes paginated incident reports.

---

## 🔒 Verification & Quality Controls

* Run the frontend build validator to confirm build configurations:
  ```bash
  cd frontend
  npm run build
  ```
* All incoming payloads are schema-validated using Joi validators.
* Authentication middleware guards access to user assets, ensuring users can only read/edit their own monitors, checks, and subscriptions.
