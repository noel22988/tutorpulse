# TutorPulse 智教通

Intelligent tutor scheduling & fee management app.

## Setup

```bash
npm install
cp .env.local.example .env.local
# Edit .env.local and add your Anthropic API key
npm run dev
```

Open http://localhost:3000

## Deploy to Vercel

1. Push to GitHub
2. Import repo in Vercel dashboard
3. Add environment variable: `ANTHROPIC_API_KEY`
4. Deploy
