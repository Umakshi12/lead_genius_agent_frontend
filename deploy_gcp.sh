#!/bin/bash

# Configuration
PROJECT_ID="your-project-id" # REPLACE WITH YOUR GCP PROJECT ID
REGION="us-central1"
BACKEND_SERVICE_NAME="lead-genius-backend"
FRONTEND_SERVICE_NAME="lead-genius-frontend"

# Colors for output
GREEN='\033[0;32m'
YC='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${YC}Starting Deployment to Google Cloud Platform...${NC}"

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null
then
    echo "gcloud could not be found. Please install Google Cloud SDK."
    exit 1
fi

# 1. Authenticate and Configure Project
echo -e "${YC}Step 1: Configuring Docker authentication...${NC}"
gcloud auth configure-docker

# 2. Deploy Backend
echo -e "${YC}Step 2: Deploying Backend Service...${NC}"
gcloud run deploy $BACKEND_SERVICE_NAME \
    --source ./backend \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --set-env-vars OPENAI_API_KEY=$OPENAI_API_KEY,OPENAI_MODEL=gpt-5-nano \
    --project $PROJECT_ID

# Get Backend URL
BACKEND_URL=$(gcloud run services describe $BACKEND_SERVICE_NAME --platform managed --region $REGION --format 'value(status.url)' --project $PROJECT_ID)
echo -e "${GREEN}Backend deployed at: $BACKEND_URL${NC}"

# 3. Deploy Frontend
echo -e "${YC}Step 3: Deploying Frontend Service...${NC}"
# Note: Next.js needs the API URL at build time for static generation, 
# or at runtime for client-side requests. We pass it as NEXT_PUBLIC_API_URL.
gcloud run deploy $FRONTEND_SERVICE_NAME \
    --source ./frontend \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --set-env-vars NEXT_PUBLIC_API_URL=$BACKEND_URL/api \
    --project $PROJECT_ID

# Get Frontend URL
FRONTEND_URL=$(gcloud run services describe $FRONTEND_SERVICE_NAME --platform managed --region $REGION --format 'value(status.url)' --project $PROJECT_ID)

echo -e "${GREEN}Deployment Complete!${NC}"
echo -e "Frontend: ${GREEN}$FRONTEND_URL${NC}"
echo -e "Backend:  ${GREEN}$BACKEND_URL${NC}"
