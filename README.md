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

## Architecture
- **Agents**: Strategic Research Agent, Discovery Agent.
- **Stack**: FastAPI (Python), Next.js (TypeScript), TailwindCSS.
- **Design**: Premium "Glassmorphism" UI.
