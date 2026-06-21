# YTTP - YouTube Transcript Plus

Canonical site: https://youtubetranscriptplus.com/

YTTP - YouTube Transcript Plus is a minimal Next.js 15 app for pasting a YouTube URL, fetching the transcript, and generating a quick summary.

## Features

- Next.js 15 App Router
- GitHub login with NextAuth
- API route for transcript fetching using `youtube-transcript-plus`
- Simple extractive summary for a quick overview
- Vercel-ready environment setup

## Repository

This project is kept under one GitHub repository:

```text
https://github.com/obigeorgie/YoutubeTranscriptPlus.git
```

## Environment

Copy `.env.example` to `.env.local` and fill in:

- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `GITHUB_ID`
- `GITHUB_SECRET`

For production, set `NEXTAUTH_URL` to:

```text
https://youtubetranscriptplus.com
```

The GitHub OAuth callback URL should be:

```text
https://youtubetranscriptplus.com/api/auth/callback/github
```
