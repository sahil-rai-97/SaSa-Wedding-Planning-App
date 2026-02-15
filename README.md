# Wedding Planner — Sahil & Saloni

Personal web application for managing wedding planning. Built with Next.js, Firebase, and Google Drive.

**Wedding Date:** April 26, 2026 at Old Mill Park Amphitheatre

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router), React, Tailwind CSS v4, shadcn/ui |
| Auth | Firebase Authentication (Email/Password with persistent sessions) |
| Database | Firebase Firestore *(planned)* |
| Storage | Google Drive API via Service Account |
| AI Chat | Gemini API *(planned)* |
| Functions | GCP Cloud Functions *(planned)* |

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
npm install
```

### Environment Variables

Copy the example file and fill in your credentials:

```bash
cp .env.local.example .env.local
```

Required variables:

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase project API key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase auth domain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase project ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase app ID |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Google Service Account email |
| `GOOGLE_SERVICE_ACCOUNT_KEY` | Google Service Account private key (PEM) |
| `GOOGLE_DRIVE_FOLDER_ID` | Google Drive "Wedding App" folder ID |
| `GEMINI_API_KEY` | Gemini API key |

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Build

```bash
npm run build
npm start
```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx          # Root layout with AuthProvider & TooltipProvider
│   ├── page.tsx            # Main entry — login gate → app shell
│   └── globals.css         # Tailwind + shadcn theme variables
├── components/
│   ├── auth/
│   │   └── LoginScreen.tsx # Email/password login form
│   ├── chat/
│   │   └── AIChatbox.tsx   # Floating AI chat widget (mock → Gemini)
│   ├── layout/
│   │   ├── AppShell.tsx    # Main app shell (sidebar + view + chat)
│   │   └── Sidebar.tsx     # Navigation sidebar with countdown
│   ├── ui/                 # shadcn/ui primitives
│   └── views/
│       ├── DashboardView.tsx  # Calendar + stats + upcoming events
│       ├── TasksView.tsx      # Kanban board + list view with filters
│       └── DriveView.tsx      # File grid/list view with search
├── context/
│   └── AuthContext.tsx     # Firebase Auth context provider
└── lib/
    ├── firebase.ts         # Lazy Firebase client init
    ├── driveService.ts     # Google Drive API server utilities
    ├── mockData.ts         # Mock data for tasks, files, events
    └── utils.ts            # cn() helper
```

## Current Status (Steps 1–4)

- **Step 1** — Project initialized with Next.js, Tailwind CSS, shadcn/ui, Firebase Auth
- **Step 2** — Layout built with collapsible sidebar and floating AI chatbox
- **Step 3** — Google Drive service utility (`driveService.ts`) with list, get, search, upload, delete, and text extraction
- **Step 4** — All UI views implemented with mock data:
  - Dashboard with interactive calendar, wedding countdown, task stats
  - Task manager with Kanban board and list view, owner filtering, detail dialog
  - Drive file manager with grid/list views, search, and sort
  - AI chatbox with mock responses (ready for Gemini integration)

### Next Steps (Pending Review)

- Connect Firebase Firestore for live task data
- Wire up Google Drive API for real file listing
- Integrate Gemini API for AI chatbox
- Email ingestion webhook (Cloudmailin → Cloud Function)
- Telegram bot webhook (telegraf → Cloud Function)
