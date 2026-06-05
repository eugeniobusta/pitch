# Pitch

A mobile app for startup founders and investors to find each other. Founders upload a short pitch video; investors scroll a TikTok-style feed, discover startups that match their thesis, and request connections. Once connected, both parties can message in real time.

---

## What the app does

**For investors**
- Scroll a personalized feed of startup pitch videos, filtered by industry and funding stage
- View full startup profiles: traction metrics (MRR, ARR, growth rate), team size, fundraise details
- Send connection requests or direct messages (if the startup allows DMs)
- Accept/decline incoming connection requests from the Activity tab
- Search startups and investors by name or firm

**For startup founders**
- Upload a 60-second pitch video and fill in company details during onboarding
- Appear in investors' personalized feed once the video is live
- Receive and manage connection requests
- Chat with connected investors
- Toggle "allow direct messages" so investors can reach out without a connection first
- Track pitch views and connection count on the profile

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | [React Native](https://reactnative.dev) + [Expo](https://expo.dev) 54 |
| Routing | [Expo Router](https://expo.github.io/router) v6 (file-system routing) |
| Styling | [NativeWind](https://nativewind.dev) v4 (Tailwind CSS for RN) |
| State | [Zustand](https://zustand-demo.pmnd.rs) (auth, feed, UI) + [TanStack Query](https://tanstack.com/query) v5 (server state) |
| Backend / DB | [Supabase](https://supabase.com) — Postgres, Auth, Realtime, Storage |
| Video | [expo-video](https://docs.expo.dev/versions/latest/sdk/video/) |
| Animations | [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/) |
| Forms | [React Hook Form](https://react-hook-form.com) + [Zod](https://zod.dev) |
| Language | TypeScript 5.9 |

---

## Project structure

```
pitch/
├── app/
│   ├── _layout.tsx              # Root layout — auth init, session listener
│   ├── index.tsx                # Auth guard, redirects to tabs or auth
│   ├── (auth)/                  # Unauthenticated screens
│   │   ├── welcome.tsx
│   │   ├── sign-in.tsx
│   │   ├── sign-up.tsx
│   │   ├── forgot-password.tsx
│   │   └── onboarding/
│   │       ├── startup/         # Startup onboarding (3 steps)
│   │       └── investor/        # Investor onboarding (4 steps)
│   ├── (tabs)/                  # Main tab navigator
│   │   ├── feed.tsx             # Investor video feed
│   │   ├── search.tsx           # Search startups & investors
│   │   ├── messages.tsx         # Conversation list
│   │   ├── activity.tsx         # Notifications + connection requests
│   │   └── profile.tsx          # Own profile
│   ├── modals/
│   │   ├── startup-detail.tsx   # Full startup profile sheet
│   │   ├── investor-detail.tsx  # Full investor profile sheet
│   │   ├── conversation.tsx     # Chat screen (Realtime)
│   │   └── edit-profile.tsx     # Edit own profile + upload images
│   └── settings.tsx             # App settings, security info, notifications
├── src/
│   ├── components/ui/           # Button, Input, Avatar, Badge, Toast
│   ├── features/auth/hooks/     # useAuthInit, useSignOut
│   ├── lib/                     # supabase.ts, safeUrl.ts, haptics.ts, useTheme.ts
│   ├── store/                   # authStore, feedStore, themeStore, uiStore
│   └── types/database.ts        # TypeScript types for all DB tables
└── supabase/
    └── migrations/              # 13 migration files — full schema history
```

---

## Running locally

### Prerequisites

- **Node.js** 20+
- **Expo CLI**: `npm install -g expo-cli` (or use `npx expo`)
- **Expo Go** app on your phone, or an iOS/Android simulator
- A Supabase project (see below)

### 1. Clone and install

```bash
git clone https://github.com/eugeniobusta/pitch.git
cd pitch
npm install
```

### 2. Set up Supabase

Create a new project at [supabase.com](https://supabase.com), then apply the migrations:

```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

This applies all 13 migrations in `supabase/migrations/` and sets up:
- Tables: `profiles`, `startup_profiles`, `investor_profiles`, `connections`, `conversations`, `messages`, `notifications`, `pitch_views`, `analytics_events`
- Row-level security policies on every table
- Storage buckets: `pitch-videos`, `thumbnails`, `profile-photos`, `logos`, `covers`, `pitch-decks`
- Triggers: auto-create conversation on connection accept, notify recipient on new connection
- Personalized feed RPC: `get_personalized_feed`

### 3. Configure environment

Create a `.env` file in the project root:

```env
EXPO_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
```

Both values are in your Supabase project dashboard under **Project Settings → API**.

### 4. Start the dev server

```bash
npx expo start
```

Then:
- **iOS simulator**: press `i` in the terminal
- **Android emulator**: press `a`
- **Physical device**: scan the QR code with the Expo Go app

### 5. Create test accounts

Sign up twice — once as a **startup founder** and once as an **investor** — so you can test the full connection and messaging flow. Use different email addresses (e.g. `founder@test.com` and `investor@test.com`).

---

## Database schema overview

```
profiles           — base user row (account_type, full_name, push_token)
startup_profiles   — company details, pitch video URL, traction metrics
investor_profiles  — firm, investment range, target industries/stages
connections        — investor ↔ startup link (pending → accepted/rejected)
conversations      — one per accepted connection, or direct (no connection)
messages           — individual chat messages (Realtime-subscribed)
notifications      — connection requests, accepted connections, messages, views
pitch_views        — analytics: who viewed which pitch, watch duration
analytics_events   — general event log
```

All tables use Postgres row-level security. Users can only read and write their own data, with specific cross-user policies for feed visibility, connection flows, and messaging.

---

## Security highlights

- Row-level security enabled on every table
- Email addresses and push tokens are never returned in shared queries
- Connection status can only be changed by the receiving party (prevents self-acceptance)
- Storage uploads are scoped to the authenticated user's own folder
- URL fields validated on the client (`http://` / `https://` required) before saving
- `get_personalized_feed` RPC verifies the caller owns the investor ID passed in

---

## Supabase migrations

| File | Description |
|---|---|
| 001 | Extensions and enum types |
| 002 | Core tables |
| 003 | Functions and triggers |
| 004 | Indexes |
| 005 | Row-level security policies |
| 006 | Storage buckets and policies |
| 007 | Personalized feed RPC |
| 008 | Seed data |
| 009 | Trigger fixes |
| 010 | Seed users |
| 011 | Direct messaging support |
| 012 | Security hardening (RLS audit) |
| 013 | Notification prefs, self-loop constraint, conversations policy |
