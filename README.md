# SaaS Cleanup Dashboard

## Overview

This project analyzes user activity across Okta, Slack, and Google to identify:

- Inactive Users (no activity in 180+ days)
- Orphaned Accounts (exist in only one system)
- Conflicts (Okta disabled but active in Slack/Google)

The reference date for inactivity calculations is **November 20, 2025**, as specified in the assignment.

---

## Architecture

- Next.js (App Router)
- API Route: `/api/analyze`
- Retry logic for 401 / 503 errors
- Email normalization and dataset merging
- Deployed to Vercel

---

## How To Run Locally

```bash
npm install
npm run dev