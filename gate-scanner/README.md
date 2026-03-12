# QueuePass Gate Scanner

Tablet/kiosk web app for gate operators at temple entrances. Runs on any tablet with a webcam — no app install required.

## 🚀 Quick Start

```bash
npm install
npm run dev    # http://localhost:3002
```

Open on a tablet browser in fullscreen mode (`F11` or kiosk mode) for best experience.

## 🎨 Design

**Aesthetic**: High-contrast industrial — near-black base with vivid green/red feedback. Optimised for harsh outdoor lighting and instant readability at a glance.

**Font**: Barlow Condensed (bold, wide, legible from distance)

**Key principle**: Zero ambiguity. Giant green ✓ = let them in. Giant red ✕ = stop.

## 📄 Screens

### Login
- Phone + OTP login (gate_operator or admin role required)
- Shows dev OTP in development mode for easy testing

### Scanner (Main Screen)
Split into two panels:

**Left — Camera View (full height)**
- Live webcam feed with animated scan frame
- Sweeping scan line + glowing corner brackets
- Torch/flashlight toggle for dark environments
- Processing spinner with blur overlay while verifying
- **Result overlay** — full-screen green/red/orange result

**Right — Session Stats (260px sidebar)**
- Live entry count, reject count, success rate bar
- Recent activity log with timestamps
- Session operator info + logout

**Bottom**
- Status bar: SCANNING / PROCESSING / STANDBY
- Manual QR entry for when camera fails

## ⚡ Result States

| Result | Color | Sound | Meaning |
|--------|-------|-------|---------|
| `success` | 🟢 Green | 2-tone chime | Allow entry |
| `not_called` | 🟠 Orange | None | Token valid but not yet called |
| `already_used` | 🟠 Orange | None | Already entered |
| `expired` | 🔴 Red | Buzz | Token expired |
| `invalid` | 🔴 Red | Buzz | Unknown QR |

## ⚙️ Config

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

## 🖥️ Kiosk Setup (Recommended)

For a dedicated tablet gate station:

```bash
# Build for production
npm run build

# Serve with any static server
npx serve dist -p 3002

# On the tablet — open Chrome and go to:
# chrome://flags → enable "Desktop PWA"
# Then add to homescreen for fullscreen kiosk mode
```

Or use **Chrome Kiosk Mode**:
```
chrome --kiosk http://localhost:3002
```
