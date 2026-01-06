# Deploying to Google Cloud Platform (GCP)

This guide walks you through deploying the Lead Genius Agent to Google Cloud Run.

## Prerequisites

1.  **Google Cloud SDK**: Install the `gcloud` CLI. [Installation Guide](https://cloud.google.com/sdk/docs/install)
2.  **GCP Project**: Create a new project in the [Google Cloud Console](https://console.cloud.google.com/).
3.  **Billing Enabled**: Ensure billing is enabled for your project.

## Deployment Steps

### 1. Initialize Google Cloud

Open your terminal and run:

```bash
gcloud init
```
Follow the prompts to log in and select your project.

### 2. Enable Required APIs

Enable the Cloud Run and Container Registry/Artifact Registry APIs:

```bash
gcloud services enable run.googleapis.com containerregistry.googleapis.com cloudbuild.googleapis.com
```

### 3. Update the Deployment Script

Open `deploy_gcp.sh` and update the `PROJECT_ID` variable at the top:

```bash
PROJECT_ID="your-actual-project-id" 
```

### 4. Set OpenAI Key

Export your OpenAI API Key in your terminal session so the script can access it:

```bash
# Windows PowerShell
$env:OPENAI_API_KEY="sk-proj-..."

# Mac/Linux
export OPENAI_API_KEY="sk-proj-..."
```
> **Note:** Ensure you use a **VALID** API key. The one causing 401 errors will not work.

### 5. Run the Deployment Script

Execute the script from the root directory:

```bash
# Windows (Git Bash) or Mac/Linux
bash deploy_gcp.sh
```

## Troubleshooting

-   **Backend Error 500/Internal Server Error**: Check Cloud Run logs. It likely means the API Key is invalid or missing.
-   **Frontend API Connection Failed**: Ensure the `NEXT_PUBLIC_API_URL` environment variable was correctly passed to the frontend container (the script handles this automatically).
