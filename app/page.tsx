"use client"

import { useEffect, useState } from "react"

type Summary = {
  inactive: number
  orphans: number
  conflicts: number
}

export default function Home() {
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/analyze")
      .then((res) => res.json())
      .then((data) => {
        setSummary(data.summary)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        Loading...
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-white p-10">
      <h1 className="text-3xl font-bold mb-8">
        SaaS Cleanup Dashboard
      </h1>

      <div className="grid grid-cols-3 gap-6">
        <Card title="Inactive Users" value={summary?.inactive ?? 0} />
        <Card title="Orphans" value={summary?.orphans ?? 0} />
        <Card title="Conflicts" value={summary?.conflicts ?? 0} />
      </div>

      <button
        onClick={() => window.location.href = "/api/analyze"}
        className="mt-8 bg-blue-600 px-6 py-3 rounded-lg hover:bg-blue-700 transition"
      >
        Generate Report
      </button>
    </main>
  )
}

function Card({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
      <div className="text-sm text-neutral-400">{title}</div>
      <div className="mt-2 text-3xl font-semibold">{value}</div>
    </div>
  )
}