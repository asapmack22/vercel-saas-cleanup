# SaaS Cleanup Dashboard

## Overview

This project analyzes user data across Okta, Slack, and Google to identify:

- **Inactive Users** — No activity in any system for more than 180 days  
- **Orphaned Users** — Exist in only one system  
- **Conflicts** — Okta account disabled but still active in Slack or Google  

The app exposes a backend API for analysis and a simple dashboard UI to visualize the results.

---

## Tech Stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS
- Fetch with retry logic
- Server-side data normalization

---

## How It Works

1. Fetches data from:
   - `/api/okta/users`
   - `/api/slack/activity`
   - `/api/google/logins`

2. Normalizes users into a unified map keyed by email.

3. Applies classification rules:
   - System presence count
   - Conflict detection
   - Inactivity threshold (180 days)

4. Returns structured JSON:
   ```json
   {
     "summary": { ... },
     "inactive_users": [],
     "orphans": [],
     "conflicts": []
   }