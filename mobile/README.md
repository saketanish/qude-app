# QueuePass Mobile App (React Native + Expo)

The devotee-facing mobile app for QueuePass. Lets users scan temple QR codes, join queues, track their position in real-time, and enter via QR at the gate.

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start Expo dev server
npx expo start

# Run on Android
npx expo start --android

# Run on iOS
npx expo start --ios
```

> **Requires**: Expo Go app on your phone, or Android Studio / Xcode for simulators.

---

## 📱 Screens

### Auth Flow
| Screen | Description |
|--------|-------------|
| `WelcomeScreen` | App intro with feature highlights |
| `PhoneScreen` | Enter phone number for OTP |
| `OTPScreen` | 6-digit OTP verification with auto-advance |

### Queue Flow
| Screen | Description |
|--------|-------------|
| `ScanQRScreen` | Camera QR scanner with animated scan line |
| `JoinQueueScreen` | Queue preview (wait time, capacity) + confirm join |
| `TokenScreen` | Live token with position counter, QR code, realtime socket updates |

### Profile
| Screen | Description |
|--------|-------------|
| `ProfileScreen` | User info, visit history, settings, logout |

---

## ⚡ Real-Time Features

The app connects via **Socket.io** to receive live updates:

```js
// Auto-updates queue position as admin advances
socket.on('queue:update', ({ currentServing }) => updatePosition(currentServing))

// Triggers success haptic + banner when it's your turn
socket.on('token:called', ({ tokenId }) => setTokenCalled())
```

---

## 🎨 Design System

Aesthetic: **Warm Saffron-Gold on Deep Charcoal** — spiritual, modern, high-trust

```js
// src/utils/constants.js
COLORS.primary      = '#D4760A'   // Saffron
COLORS.bg           = '#0E0A06'   // Deep charcoal
COLORS.textPrimary  = '#F5EDD8'   // Warm cream

FONTS.display = 'Philosopher_700Bold'  // Headers
FONTS.body    = 'Nunito_400Regular'    // Body text
```

---

## 📂 Project Structure

```
src/
├── navigation/
│   └── AppNavigator.js      # Auth + Tab + Stack navigator
├── screens/
│   ├── auth/
│   │   ├── WelcomeScreen.js
│   │   ├── PhoneScreen.js
│   │   └── OTPScreen.js
│   ├── queue/
│   │   ├── ScanQRScreen.js  # Camera + animated scan UI
│   │   ├── JoinQueueScreen.js
│   │   └── TokenScreen.js   # Core screen with live QR + position
│   └── profile/
│       └── ProfileScreen.js
├── services/
│   ├── api.js               # Axios with JWT interceptor
│   └── socket.service.js    # Socket.io client
├── store/
│   ├── authStore.js         # Zustand auth + session restore
│   └── queueStore.js        # Active token + live position
└── utils/
    ├── constants.js         # Colors, fonts, spacing
    └── storage.js           # Secure token storage
```

---

## 🔔 Notifications

The app receives notifications via SMS/WhatsApp (Twilio) from the backend:
- ✅ Token issued confirmation
- 🔔 10 people ahead alert
- 🎉 Called to gate now
- ⚠️ Token expired

Push notifications (via `expo-notifications`) can be added for foreground alerts.

---

## ⚙️ Environment

Create `.env` at root:

```env
EXPO_PUBLIC_API_URL=http://YOUR_BACKEND_IP:5000/api
EXPO_PUBLIC_SOCKET_URL=http://YOUR_BACKEND_IP:5000
```

> Use your machine's local IP (not `localhost`) when testing on physical device.

---

## 📦 Key Dependencies

| Package | Purpose |
|---------|---------|
| `expo-camera` | QR code scanning |
| `react-native-qrcode-svg` | Display token QR |
| `socket.io-client` | Real-time position updates |
| `expo-linear-gradient` | Saffron gradient UI |
| `expo-haptics` | Tactile feedback on key actions |
| `expo-secure-store` | Secure JWT storage |
| `zustand` | Lightweight state management |
| `@expo-google-fonts/philosopher` | Display font |
| `@expo-google-fonts/nunito` | Body font |
