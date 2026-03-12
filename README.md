# QueuePass — Full Project Folder Structure

## Overview
Complete monorepo structure for the QueuePass digital queue management system.

---

```
queuepass/
├── README.md
├── .gitignore
├── docker-compose.yml                  # Local dev: PostgreSQL + Redis
├── .env.example
│
├── 📁 backend/                         # Node.js + Express + Socket.io
│   ├── package.json
│   ├── .env.example
│   ├── Dockerfile
│   ├── src/
│   │   ├── index.js                    # Entry point
│   │   ├── app.js                      # Express app setup
│   │   ├── socket.js                   # Socket.io setup & events
│   │   │
│   │   ├── config/
│   │   │   ├── db.js                   # PostgreSQL connection (pg)
│   │   │   ├── redis.js                # Redis connection (ioredis)
│   │   │   └── env.js                  # Environment variables
│   │   │
│   │   ├── models/                     # DB schema & queries
│   │   │   ├── user.model.js           # Devotees / users
│   │   │   ├── temple.model.js         # Temple / venue info
│   │   │   ├── queue.model.js          # Queue definitions
│   │   │   ├── token.model.js          # Queue tokens (tickets)
│   │   │   └── entry.model.js          # Gate entry logs
│   │   │
│   │   ├── routes/
│   │   │   ├── index.js                # Route aggregator
│   │   │   ├── auth.routes.js          # OTP login / verify
│   │   │   ├── queue.routes.js         # Join / leave / status
│   │   │   ├── token.routes.js         # Token CRUD & QR
│   │   │   ├── gate.routes.js          # Gate scan & verify
│   │   │   ├── admin.routes.js         # Admin controls
│   │   │   └── notification.routes.js  # Manual trigger alerts
│   │   │
│   │   ├── controllers/
│   │   │   ├── auth.controller.js
│   │   │   ├── queue.controller.js
│   │   │   ├── token.controller.js
│   │   │   ├── gate.controller.js
│   │   │   ├── admin.controller.js
│   │   │   └── notification.controller.js
│   │   │
│   │   ├── services/
│   │   │   ├── queue.service.js        # Core queue logic (Redis)
│   │   │   ├── token.service.js        # Token generation & QR
│   │   │   ├── otp.service.js          # OTP generation & verify
│   │   │   ├── notification.service.js # SMS + WhatsApp (Twilio/MSG91)
│   │   │   └── gate.service.js         # Gate validation logic
│   │   │
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js      # JWT verify
│   │   │   ├── role.middleware.js      # Admin / gate / user roles
│   │   │   ├── rateLimit.middleware.js # Rate limiting
│   │   │   └── error.middleware.js     # Global error handler
│   │   │
│   │   └── utils/
│   │       ├── qrGenerator.js          # QR code generation utility
│   │       ├── tokenId.js              # Unique token ID generator
│   │       ├── timeSlot.js             # Time slot calculations
│   │       └── logger.js              # Winston logger
│   │
│   └── migrations/                     # SQL migration files
│       ├── 001_create_users.sql
│       ├── 002_create_temples.sql
│       ├── 003_create_queues.sql
│       ├── 004_create_tokens.sql
│       └── 005_create_entry_logs.sql
│
│
├── 📁 mobile/                          # React Native (Expo)
│   ├── package.json
│   ├── app.json                        # Expo config
│   ├── .env.example
│   ├── App.js                          # Root component
│   │
│   ├── src/
│   │   ├── navigation/
│   │   │   ├── AppNavigator.js         # Root navigator
│   │   │   ├── AuthNavigator.js        # Login / OTP screens
│   │   │   └── MainNavigator.js        # Tab + stack navigator
│   │   │
│   │   ├── screens/
│   │   │   ├── auth/
│   │   │   │   ├── WelcomeScreen.js    # Splash / onboarding
│   │   │   │   ├── PhoneScreen.js      # Enter phone number
│   │   │   │   └── OTPScreen.js        # OTP verification
│   │   │   │
│   │   │   ├── queue/
│   │   │   │   ├── ScanQRScreen.js     # Camera to scan temple QR
│   │   │   │   ├── JoinQueueScreen.js  # Confirm queue join
│   │   │   │   ├── TokenScreen.js      # My token + live position
│   │   │   │   └── HistoryScreen.js    # Past visits
│   │   │   │
│   │   │   └── profile/
│   │   │       └── ProfileScreen.js    # User profile & settings
│   │   │
│   │   ├── components/
│   │   │   ├── QRScanner.js            # Camera QR scanner
│   │   │   ├── QRDisplay.js            # Show user's token QR
│   │   │   ├── TokenCard.js            # Queue position card
│   │   │   ├── PositionTracker.js      # Live position with animation
│   │   │   ├── NotificationBanner.js   # In-app alert banner
│   │   │   └── Loader.js              # Loading spinner
│   │   │
│   │   ├── services/
│   │   │   ├── api.js                  # Axios base instance
│   │   │   ├── auth.service.js         # Login / OTP API calls
│   │   │   ├── queue.service.js        # Queue API calls
│   │   │   └── socket.service.js       # Socket.io client
│   │   │
│   │   ├── store/                      # Zustand state management
│   │   │   ├── authStore.js
│   │   │   ├── queueStore.js
│   │   │   └── notificationStore.js
│   │   │
│   │   ├── hooks/
│   │   │   ├── useQueue.js             # Queue polling + socket
│   │   │   ├── useNotification.js      # Push notification hook
│   │   │   └── useQRScanner.js         # Camera permissions + scan
│   │   │
│   │   └── utils/
│   │       ├── constants.js            # API URLs, app constants
│   │       ├── storage.js              # AsyncStorage wrapper
│   │       └── formatters.js           # Time, position formatting
│   │
│   └── assets/
│       ├── icons/
│       └── images/
│
│
├── 📁 admin-dashboard/                 # React + Tailwind (Vite)
│   ├── package.json
│   ├── vite.config.js
│   ├── .env.example
│   ├── index.html
│   │
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       │
│       ├── pages/
│       │   ├── Login.jsx               # Admin login
│       │   ├── Dashboard.jsx           # Overview stats
│       │   ├── Queues.jsx              # Manage queues
│       │   ├── QueueDetail.jsx         # Live queue monitor
│       │   ├── Tokens.jsx              # All tokens list
│       │   ├── EntryLogs.jsx           # Gate entry history
│       │   ├── Notifications.jsx       # Send alerts
│       │   └── Settings.jsx            # Temple settings, QR gen
│       │
│       ├── components/
│       │   ├── layout/
│       │   │   ├── Sidebar.jsx
│       │   │   ├── Header.jsx
│       │   │   └── Layout.jsx
│       │   │
│       │   ├── dashboard/
│       │   │   ├── StatsCard.jsx       # Total / active / completed
│       │   │   ├── LiveQueueChart.jsx  # Real-time queue graph
│       │   │   └── RecentEntries.jsx
│       │   │
│       │   ├── queue/
│       │   │   ├── QueueCard.jsx
│       │   │   ├── QueueControls.jsx   # Pause / Resume / Advance
│       │   │   ├── TokenTable.jsx      # Live token list
│       │   │   └── EntranceQRCode.jsx  # Temple entrance QR display
│       │   │
│       │   └── common/
│       │       ├── Button.jsx
│       │       ├── Modal.jsx
│       │       ├── Badge.jsx
│       │       └── Table.jsx
│       │
│       ├── services/
│       │   ├── api.js                  # Axios base
│       │   └── socket.js               # Socket.io admin events
│       │
│       └── store/                      # Zustand
│           ├── authStore.js
│           └── queueStore.js
│
│
└── 📁 gate-scanner/                    # React Web App (Tablet/Kiosk)
    ├── package.json
    ├── vite.config.js
    ├── .env.example
    ├── index.html
    │
    └── src/
        ├── main.jsx
        ├── App.jsx
        │
        ├── pages/
        │   ├── Login.jsx               # Gate operator login
        │   ├── Scanner.jsx             # Main QR scan screen
        │   └── EntryLog.jsx            # Today's entry log
        │
        ├── components/
        │   ├── QRScanner.jsx           # Webcam QR scanner
        │   ├── ResultDisplay.jsx       # ✅ Green / ❌ Red result
        │   ├── TokenInfo.jsx           # Devotee name, token number
        │   └── GateStatus.jsx          # Open / Closed indicator
        │
        ├── services/
        │   ├── api.js
        │   └── scanner.js              # QR decode logic (jsQR)
        │
        └── store/
            └── gateStore.js
```

---

## 🗄️ Database Schema (PostgreSQL)

```sql
-- Users (Devotees)
users: id, phone, name, created_at

-- Temples / Venues
temples: id, name, location, admin_id, settings (JSON), created_at

-- Queues (a temple can have multiple queues e.g. VIP, General)
queues: id, temple_id, name, status (active/paused/closed),
        current_serving, total_issued, slot_size, created_at

-- Tokens (one per devotee per visit)
tokens: id, queue_id, user_id, token_number, qr_code (unique string),
        status (waiting/called/entered/expired), issued_at, entered_at

-- Entry Logs (gate scan history)
entry_logs: id, token_id, gate_id, scanned_at, result (success/fail/expired)
```

---

## ⚡ Realtime Events (Socket.io)

| Event | Direction | Description |
|-------|-----------|-------------|
| `queue:update` | Server → All | Queue position changed |
| `token:called` | Server → User | "Your turn is near!" |
| `token:entered` | Server → Admin | Devotee entered gate |
| `gate:scan` | Gate → Server | QR scan request |
| `queue:pause` | Admin → Server | Pause queue |
| `queue:advance` | Admin → Server | Manually advance queue |

---

## 🔔 Notification Triggers

| Trigger | Channel | Message |
|---------|---------|---------|
| Token issued | SMS | "Your token #42 is confirmed. Est. wait: 25 mins" |
| 10 people ahead | WhatsApp | "🛕 Your turn is near! Please proceed to the gate." |
| Called to gate | SMS + WhatsApp | "✅ Token #42 — Please enter now!" |
| Token expired | SMS | "Your token has expired. Rejoin the queue." |

---

## 🚀 Getting Started (Dev)

```bash
# 1. Clone & install
git clone https://github.com/yourname/queuepass
cd queuepass

# 2. Start DB & Redis
docker-compose up -d

# 3. Backend
cd backend && npm install && npm run dev

# 4. Admin Dashboard
cd admin-dashboard && npm install && npm run dev

# 5. Gate Scanner
cd gate-scanner && npm install && npm run dev

# 6. Mobile App
cd mobile && npm install && npx expo start
```

---

## 📦 Key Dependencies

| Package | Used In | Purpose |
|---------|---------|---------|
| `express` | Backend | HTTP server |
| `socket.io` | Backend | Realtime events |
| `ioredis` | Backend | Redis queue state |
| `pg` | Backend | PostgreSQL client |
| `qrcode` | Backend | QR code generation |
| `twilio` | Backend | SMS + WhatsApp |
| `jsonwebtoken` | Backend | Auth tokens |
| `expo-camera` | Mobile | QR scanning |
| `zustand` | Mobile + Web | State management |
| `jsQR` | Gate Scanner | QR decode from webcam |
| `recharts` | Admin | Charts & graphs |
| `tailwindcss` | Admin + Gate | Styling |
