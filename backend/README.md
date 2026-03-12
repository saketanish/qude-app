# QueuePass Backend API

Node.js + Express + Socket.io backend for the QueuePass digital queue management system.

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Copy environment file
cp .env.example .env
# Edit .env with your values

# 3. Start PostgreSQL + Redis
docker-compose up -d

# 4. Run database migrations
npm run migrate

# 5. Start dev server
npm run dev
```

Server runs on: `http://localhost:5000`

---

## 📡 API Reference

### Base URL: `/api`

---

### 🔐 Auth

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/send-otp` | None | Send OTP to phone |
| POST | `/auth/verify-otp` | None | Verify OTP, get JWT |
| GET | `/auth/me` | Bearer | Get current user |

**Send OTP**
```json
POST /api/auth/send-otp
{ "phone": "9876543210" }
```

**Verify OTP**
```json
POST /api/auth/verify-otp
{ "phone": "9876543210", "otp": "123456", "name": "Rahul Kumar" }

Response:
{ "success": true, "token": "eyJ...", "user": { "id": "...", "role": "devotee" } }
```

---

### 🧍 Queue (Devotee)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/queues/:id/status` | None | Live queue status (public) |
| GET | `/queues/:id` | Bearer | Full queue details |
| POST | `/queues/:id/join` | Bearer | Join queue, get token |
| GET | `/queues/:id/my-token` | Bearer | My active token + position |
| DELETE | `/queues/:id/leave` | Bearer | Cancel and leave queue |

**Join Queue Response**
```json
{
  "success": true,
  "token": {
    "id": "uuid",
    "token_number": 42,
    "qr_code": "QP-xxxx-timestamp-hash",
    "qr_image_base64": "data:image/png;base64,...",
    "status": "waiting"
  },
  "position": 12,
  "waitMinutes": 60,
  "templeName": "Tirupati Balaji"
}
```

---

### 🚪 Gate Scanner

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/gate/scan` | Bearer (gate_operator) | Scan devotee QR |
| GET | `/gate/logs` | Bearer (gate_operator) | Recent entry logs |

**Scan QR**
```json
POST /api/gate/scan
{ "qrCode": "QP-xxxx-timestamp-hash" }

Response (allowed):
{ "result": "success", "allowed": true, "message": "✅ Entry Allowed",
  "token": { "tokenNumber": 42, "userName": "Rahul Kumar", "queueName": "General Darshan" } }

Response (not allowed):
{ "result": "not_called", "allowed": false, "message": "⏳ Not yet called — please wait" }
```

---

### 🏛️ Admin

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/admin/temples` | Bearer (admin) | Create temple |
| GET | `/admin/temples` | Bearer (admin) | My temples |
| POST | `/admin/queues` | Bearer (admin) | Create queue |
| GET | `/admin/queues/:templeId` | Bearer (admin) | Temple's queues |
| PATCH | `/admin/queues/:id/status` | Bearer (admin) | Pause/resume/close |
| POST | `/admin/queues/:id/advance` | Bearer (admin) | Advance queue |
| GET | `/admin/queues/:id/analytics` | Bearer (admin) | Daily analytics |
| POST | `/admin/gate-operators` | Bearer (admin) | Add gate operator |

**Create Queue**
```json
POST /api/admin/queues
{
  "templeId": "uuid",
  "name": "General Darshan",
  "slotSize": 10,
  "avgWaitMinutes": 5,
  "maxCapacity": 2000
}
```

**Update Queue Status**
```json
PATCH /api/admin/queues/:id/status
{ "status": "paused" }   // active | paused | closed
```

---

## ⚡ WebSocket Events

Connect to: `ws://localhost:5000`

### Client → Server (Join Rooms)
```js
socket.emit('join:queue', { queueId })     // Devotee tracks queue
socket.emit('join:token', { tokenId })     // Devotee tracks own token
socket.emit('join:temple', { templeId })   // Admin monitors temple
```

### Server → Client
```js
// Queue position changed
socket.on('queue:update', ({ queueId, currentServing, totalIssued }) => {})

// Queue paused/resumed
socket.on('queue:status_change', ({ queueId, status }) => {})

// Devotee's token has been called
socket.on('token:called', ({ tokenId, tokenNumber }) => {})

// Someone entered through the gate (admin view)
socket.on('token:entered', ({ tokenId, tokenNumber, userName, queueName }) => {})
```

---

## 🔔 SMS/WhatsApp Notifications

Triggered automatically at these points:

| Event | Channels |
|-------|---------|
| Token issued | SMS + WhatsApp |
| 10 people ahead | SMS + WhatsApp |
| Token called to gate | SMS + WhatsApp |
| Token expired | SMS |
| OTP login | SMS |

---

## 🗄️ Environment Variables

```env
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=queuepass
DB_USER=postgres
DB_PASSWORD=yourpassword

REDIS_HOST=localhost
REDIS_PORT=6379

JWT_SECRET=your_secret_here
JWT_EXPIRES_IN=30d

TWILIO_ACCOUNT_SID=ACxxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_PHONE_NUMBER=+1234567890
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

TOKEN_QR_SECRET=qr_secret
OTP_EXPIRY_MINUTES=10
FRONTEND_URL=http://localhost:3000
```

---

## 🏗️ Project Structure

```
src/
├── index.js          # Entry point (HTTP + Socket.io)
├── app.js            # Express setup
├── socket.js         # Socket.io events
├── config/
│   ├── db.js         # PostgreSQL pool
│   ├── redis.js      # Redis client
│   └── migrate.js    # Migration runner
├── controllers/      # Request handlers
├── services/         # Business logic
├── routes/           # API routes
├── middleware/       # Auth, error handling
└── utils/            # Logger, QR generator
```
