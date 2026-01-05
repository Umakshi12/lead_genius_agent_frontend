# Lead Genius Agent System

A production-ready, modular, multi-agent Lead Generation web application.

## Usage

### Prerequisites
- Python 3.11+
- Node.js 18+
- OpenAI API Key

### Setup

1. **Backend**
   ```bash
   cd backend
   python -m venv venv
   .\venv\Scripts\activate
   pip install -r requirements.txt
   # Rename .env.example to .env and add your key if needed (Code created .env already)
   uvicorn main:app --reload
   ```

2. **Frontend**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

3. **Docker**
   Alternatively, run `docker-compose up --build`.

---

## 🚀 Deploying to Replit

### Quick Deploy (Recommended)

1. **Import to Replit**
   - Go to [replit.com](https://replit.com) and click **"Create Repl"**
   - Select **"Import from GitHub"** and paste your repository URL
   - Or create a new Repl and drag/drop your files

2. **Add Secrets (Required)**
   - Click the **🔒 Secrets** (padlock) icon in the left sidebar
   - Add your environment variables:
     - `OPENAI_API_KEY` = your OpenAI API key

3. **Run the App**
   - Click the green **"Run"** button
   - Wait for dependencies to install and services to start
   - Your app will be available at the provided URL

4. **Deploy for Production (24/7 Access)**
   - Click **"Deploy"** in the top-right corner
   - Choose **"Autoscale"** for best performance
   - Configure machine size (smallest tier works for demos)
   - Click **"Deploy to production"**
   - Share the generated `.replit.app` URL with clients!

### Files Included for Replit

| File | Purpose |
|------|---------|
| `.replit` | Main configuration file |
| `replit.nix` | System dependencies (Python, Node.js) |
| `start.sh` | Startup script for both services |
| `.env.example` | Template for required secrets |

### Troubleshooting

- **App sleeping?** Use the Deploy feature for 24/7 uptime
- **API errors?** Check that `OPENAI_API_KEY` is set in Secrets
- **Build fails?** Try clicking "Stop" then "Run" again

---

## Architecture
- **Agents**: Strategic Research Agent, Discovery Agent, Lead Generation Agent
- **Stack**: FastAPI (Python), Next.js (TypeScript), TailwindCSS
- **Design**: Premium "Glassmorphism" UI
- **Features**: 
  - Auto-fetch company URL & industry from company name
  - AI-powered company analysis
  - Multi-channel lead generation

