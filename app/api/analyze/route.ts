import { NextResponse } from "next/server"

const BASE_URL = "https://mock-saas-apis.vercel.app"

const TODAY = new Date("2025-11-20")
const INACTIVE_THRESHOLD_DAYS = 180

type UserRow = {
  email: string
  okta_enabled: boolean | null
  okta_last_login: string | null
  slack_last_active: string | null
  google_last_login: string | null
}

function isInactive(dateStr: string | null) {
  // If no date, treat as inactive (no known activity)
  if (!dateStr) return true

  const lastActive = new Date(dateStr)
  const diffDays =
    (TODAY.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24)

  return diffDays > INACTIVE_THRESHOLD_DAYS
}

async function fetchWithRetry(url: string, retries = 3) {
  let lastErr: unknown

  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, { cache: "no-store" })

      // retryable errors per take-home
      if (res.status === 503 || res.status === 401) {
        throw new Error(`Retryable error (${res.status})`)
      }

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`)
      }

      return await res.json()
    } catch (err) {
      lastErr = err
      if (i === retries - 1) break
      await new Promise((r) => setTimeout(r, 500 * (i + 1)))
    }
  }

  throw lastErr
}

export async function GET() {
  try {
    const okta = await fetchWithRetry(`${BASE_URL}/api/okta/users`)
    const slack = await fetchWithRetry(`${BASE_URL}/api/slack/activity`)
    const google = await fetchWithRetry(`${BASE_URL}/api/google/logins`)

    const usersMap = new Map<string, UserRow>()

    // Normalize Okta
    ;(okta?.data ?? []).forEach((u: any) => {
      usersMap.set(String(u.email).toLowerCase(), {
        email: String(u.email).toLowerCase(),
        okta_enabled: typeof u.enabled === "boolean" ? u.enabled : null,
        okta_last_login: u.last_login ?? null,
        slack_last_active: null,
        google_last_login: null,
      })
    })

    // Merge Slack
    ;(slack?.data ?? []).forEach((u: any) => {
      const email = String(u.email).toLowerCase()
      if (!usersMap.has(email)) {
        usersMap.set(email, {
          email,
          okta_enabled: null,
          okta_last_login: null,
          slack_last_active: u.last_active ?? null,
          google_last_login: null,
        })
      } else {
        usersMap.get(email)!.slack_last_active = u.last_active ?? null
      }
    })

    // Merge Google
    ;(google?.data ?? []).forEach((u: any) => {
      const email = String(u.email).toLowerCase()
      if (!usersMap.has(email)) {
        usersMap.set(email, {
          email,
          okta_enabled: null,
          okta_last_login: null,
          slack_last_active: null,
          google_last_login: u.last_login ?? null,
        })
      } else {
        usersMap.get(email)!.google_last_login = u.last_login ?? null
      }
    })

    const inactive_users: UserRow[] = []
    const orphans: UserRow[] = []
    const conflicts: UserRow[] = []

    usersMap.forEach((user) => {
      // Count system presence (exists in dataset)
      const systemsCount =
        (typeof user.okta_enabled === "boolean" ? 1 : 0) +
        (user.slack_last_active !== null ? 1 : 0) +
        (user.google_last_login !== null ? 1 : 0)

      const isOrphan = systemsCount === 1

      // Conflict = Okta disabled but active in Slack/Google
      const isConflict =
        user.okta_enabled === false &&
        (user.slack_last_active !== null || user.google_last_login !== null)

      const isUserInactive =
        isInactive(user.okta_last_login) &&
        isInactive(user.slack_last_active) &&
        isInactive(user.google_last_login)

      if (isOrphan) orphans.push(user)
      if (isConflict) conflicts.push(user)
      if (isUserInactive) inactive_users.push(user)
    })

    return NextResponse.json({
      summary: {
        inactive: inactive_users.length,
        orphans: orphans.length,
        conflicts: conflicts.length,
      },
      inactive_users,
      orphans,
      conflicts,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? String(error) }, { status: 500 })
  }
}