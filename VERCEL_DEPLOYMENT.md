# Deploying to Vercel

You can deploy **BOTH** the Frontend and Backend to Vercel significantly easier using the `vercel.json` file I created.

## ⚠️ Warning: Timeout Limits ⚠️
Vercel has strict timeout limits for the backend:
*   **Hobby Plan**: 10 seconds
*   **Pro Plan**: 60 seconds

**Risk**: If your AI agent takes longer than this to search/scrape/analyze, the request will fail.

---

## Deployment Steps

### 1. Reset Root Directory
If you previously changed "Root Directory" to `frontend`, **change it back**.
*   Go to Vercel > Settings > Build & Development Settings.
*   **Root Directory**: Set this to `./` (or leave it empty/default).
    *   *Why?* The `vercel.json` file in the root now handles directing traffic to both folders.

### 2. Environment Variables
Add your secrets in Vercel API Keys:
1.  `OPENAI_API_KEY`: Your key starting with `sk-...`
2.  `NEXT_PUBLIC_API_URL`: Set this to `/api` (This makes the frontend talk to the Vercel backend).

### 3. Deploy
Just push your code to Bitbucket.
Vercel will detect `vercel.json` and deploy:
*   `frontend/` as a Next.js app.
*   `backend/` as Python Serverless Functions.

## Troubleshooting

### "Module not found"
If Vercel complains about missing python modules, ensure `backend/requirements.txt` exists (it does).

### "Task Timed Out"
If your Lead Generation or Analysis fails with a 504 Gateway Timeout:
1.  Upgrade to Vercel Pro ($20/mo).
2.  OR use the **GCP Deployment** method for the backend (see `GCP_DEPLOYMENT.md`).
