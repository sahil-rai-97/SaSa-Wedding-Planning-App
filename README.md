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

## Deploy to GCP Cloud Run

This deploys the app as a container on [Cloud Run](https://cloud.google.com/run) — serverless, scales to zero, HTTPS out of the box.

### Prerequisites

1. A GCP project with billing enabled
2. The [`gcloud` CLI](https://cloud.google.com/sdk/docs/install) installed and authenticated:

```bash
gcloud auth login
gcloud config set project YOUR_GCP_PROJECT_ID
```

### One-Command Deploy

```bash
./deploy.sh
```

Or specify a project and region explicitly:

```bash
./deploy.sh my-gcp-project us-east1
```

The script will:
- Enable the required GCP APIs (Cloud Run, Cloud Build, Container Registry)
- Build the Docker image remotely via Cloud Build (no local Docker needed)
- Deploy to Cloud Run with public access
- Print your live URL (e.g. `https://wedding-planner-abc123-uc.a.run.app`)

### Set Environment Variables

After the first deploy, add your Firebase credentials:

```bash
gcloud run services update wedding-planner \
  --region us-central1 \
  --update-env-vars \
    NEXT_PUBLIC_FIREBASE_API_KEY=AIza...,\
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com,\
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project,\
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com,\
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789,\
    NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
```

You can also set these in the [Cloud Run Console](https://console.cloud.google.com/run) under your service > **Edit & Deploy New Revision** > **Variables & Secrets**.

### Custom Domain (Optional)

To map a custom domain (e.g. `wedding.yourdomain.com`):

```bash
gcloud run domain-mappings create \
  --service wedding-planner \
  --domain wedding.yourdomain.com \
  --region us-central1
```

Then add the DNS records shown in the output to your domain registrar.

---

## CI/CD: Auto-Deploy via GitHub Actions

Every push to `main` automatically builds and deploys to **Firebase Hosting** using the `FirebaseExtended/action-hosting-deploy` action.

### One-Time Setup

1. **Enable Firebase Hosting** in the [Firebase Console](https://console.firebase.google.com/) > Hosting > Get started.

2. **Enable the web frameworks experiment** (needed for Next.js SSR support):

```bash
firebase experiments:enable webframeworks
```

3. **Update `.firebaserc`** — replace `YOUR_FIREBASE_PROJECT_ID` with your actual project ID.

4. **Create a Firebase Service Account key:**
   - Go to Firebase Console > Project settings > Service accounts
   - Click **Generate new private key**
   - Copy the entire JSON contents

5. **Add secrets to GitHub:** Go to your repo > Settings > Secrets and variables > Actions > **New repository secret**, and add each of these:

| Secret name | Value |
|---|---|
| `FIREBASE_SERVICE_ACCOUNT` | The full JSON key from step 4 |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Your Firebase API key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | e.g. `your-project.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Your Firebase project ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | e.g. `your-project.appspot.com` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Messaging sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase app ID |

That's it. From now on, every merge into `main` will trigger the workflow, build the project, and deploy it to your Firebase Hosting URL (e.g. `https://your-project.web.app`).

You can monitor deploy status in the **Actions** tab of your GitHub repo.

---

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
