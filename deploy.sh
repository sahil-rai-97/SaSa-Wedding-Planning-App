#!/usr/bin/env bash
# ────────────────────────────────────────────────────────────────────────────
# deploy.sh — Build & deploy the Wedding Planner app to GCP Cloud Run
#
# Prerequisites:
#   1. Install the gcloud CLI:  https://cloud.google.com/sdk/docs/install
#   2. Run:  gcloud auth login
#   3. Run:  gcloud config set project YOUR_PROJECT_ID
#   4. Enable required APIs (script does this for you on first run)
#
# Usage:
#   ./deploy.sh                          # uses defaults
#   ./deploy.sh my-gcp-project us-east1  # override project & region
# ────────────────────────────────────────────────────────────────────────────
set -euo pipefail

PROJECT_ID="${1:-$(gcloud config get-value project 2>/dev/null)}"
REGION="${2:-us-central1}"
SERVICE_NAME="wedding-planner"
IMAGE="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

if [ -z "$PROJECT_ID" ]; then
  echo "ERROR: No GCP project set."
  echo "Run:  gcloud config set project YOUR_PROJECT_ID"
  echo " or:  ./deploy.sh YOUR_PROJECT_ID"
  exit 1
fi

echo "╔══════════════════════════════════════════════╗"
echo "║  Wedding Planner → Cloud Run Deploy          ║"
echo "╠══════════════════════════════════════════════╣"
echo "║  Project : ${PROJECT_ID}"
echo "║  Region  : ${REGION}"
echo "║  Service : ${SERVICE_NAME}"
echo "║  Image   : ${IMAGE}"
echo "╚══════════════════════════════════════════════╝"
echo ""

# 1. Enable required GCP APIs
echo "→ Enabling GCP APIs..."
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  containerregistry.googleapis.com \
  artifactregistry.googleapis.com \
  --project="${PROJECT_ID}" --quiet

# 2. Build the container image with Cloud Build (no local Docker needed)
echo ""
echo "→ Building container image with Cloud Build..."
gcloud builds submit \
  --tag "${IMAGE}" \
  --project="${PROJECT_ID}" \
  --quiet

# 3. Deploy to Cloud Run
echo ""
echo "→ Deploying to Cloud Run..."
gcloud run deploy "${SERVICE_NAME}" \
  --image "${IMAGE}" \
  --platform managed \
  --region "${REGION}" \
  --allow-unauthenticated \
  --port 8080 \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 3 \
  --project="${PROJECT_ID}" \
  --quiet

# 4. Print the URL
echo ""
echo "════════════════════════════════════════════════"
SERVICE_URL=$(gcloud run services describe "${SERVICE_NAME}" \
  --region "${REGION}" \
  --project="${PROJECT_ID}" \
  --format="value(status.url)")
echo "✓ Deployed successfully!"
echo ""
echo "  Your app is live at:"
echo "  ${SERVICE_URL}"
echo ""
echo "════════════════════════════════════════════════"
echo ""
echo "Next: set your environment variables in Cloud Run:"
echo "  gcloud run services update ${SERVICE_NAME} \\"
echo "    --region ${REGION} \\"
echo "    --update-env-vars NEXT_PUBLIC_FIREBASE_API_KEY=...,NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...,NEXT_PUBLIC_FIREBASE_PROJECT_ID=..."
echo ""
