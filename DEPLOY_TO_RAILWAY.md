# Deploying LeadGenius to Railway

This project is a monorepo containing both the Frontend (Next.js) and Backend (FastAPI). To deploy on Railway, you will create two separate services from this same repository.

## 1. Deploying the Backend (FastAPI)

1.  **New Service**: In your Railway project, click **New** -> **GitHub Repo** and select this repository.
2.  **Settings**:
    *   Go to **Settings** -> **Root Directory** and set it to `/backend`.
    *   Railway should automatically detect `requirements.txt` and `Procfile`.
3.  **Variables**:
    *   Go to **Variables**.
    *   Add `OPENAI_API_KEY`: Your OpenAI API Key.
    *   (Optional) `PORT`: Railway sets this automatically, but our code is ready to listen on it.
4.  **Networking**:
    *   Go to **Settings** -> **Networking** -> **Public Networking**.
    *   Click **Generate Domain**. You will get a URL like `https://leadgenius-backend-production.up.railway.app`. Copy this.

## 2. Deploying the Frontend (Next.js)

1.  **New Service**: Click **New** -> **GitHub Repo** and select *the same repository again*.
2.  **Settings**:
    *   Go to **Settings** -> **Root Directory** and set it to `/frontend`.
    *   Railway should automatically detect it as a Next.js app.
3.  **Variables**:
    *   Go to **Variables**.
    *   Add `NEXT_PUBLIC_API_URL`: Paste the Backend URL you copied earlier, appending `/api`.
        *   Example: `https://leadgenius-backend-production.up.railway.app/api`
4.  **Deploy**: Railway will build and deploy the frontend.
5.  **Networking**: Generate a domain for the frontend to access your app.

## Notes
*   **Port**: The backend is configured to listen on `0.0.0.0` and the `$PORT` provided by Railway.
*   **CORS**: The backend creates a permissive CORS policy (`*`) by default, which is fine for this setup. For steeper security, update `backend/main.py` with your frontend domain.
