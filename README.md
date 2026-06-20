# YouTube Transcript Plus

Minimal Next.js 15 app to paste a YouTube URL, fetch the transcript, and generate a basic summary.

## Features
- Next.js 15 App Router
- GitHub login with NextAuth
- API route for transcript fetching using `youtube-transcript-plus`
- Simple extractive summary for a quick overview
- Vercel-ready env setup

## Environment
Copy `.env.example` to `.env.local` and fill in:
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `GITHUB_ID`
- `GITHUB_SECRET`
