# QueuePass Admin Dashboard

Dark command-center web dashboard for temple administrators to manage queues, monitor real-time flow, and control gate access.

## 🚀 Quick Start

```bash
npm install
cp .env.example .env   # set VITE_API_URL and VITE_SOCKET_URL
npm run dev            # runs on http://localhost:3001
```

## 🎨 Design

**Aesthetic**: Dark command-center — deep charcoal (#0f0d0b) with warm amber (#c97b2a) accents. Feels like an operations war room.

**Fonts**: Playfair Display (display) + DM Sans (body)

## 📄 Pages

| Page | Route | Description |
|------|-------|-------------|
| Login | `/login` | OTP-based admin login |
| Dashboard | `/` | Live stats, charts, recent entries |
| Live Queues | `/queues` | Full queue control (advance, pause, close, QR) |
| Tokens | `/tokens` | All issued tokens with status filter |
| Entry Log | `/entries` | Gate scan history |
| Notifications | `/notify` | Broadcast SMS/WhatsApp to devotees |
| Settings | `/settings` | Gate operators, temple config |

## ⚡ Key Features

- **Real-time updates** via Socket.io — queue numbers update live
- **One-click queue control** — advance, pause, resume, close
- **Entrance QR generator** — downloadable PNG for gate displays
- **Live charts** — hourly token flow (AreaChart), queue comparison (BarChart)
- **Gate entry feed** — live stream of devotees entering/being rejected
- **Broadcast notifications** — send custom messages to all waiting devotees
- **Template messages** — pre-written alerts for common situations

## 🔧 Environment

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```
