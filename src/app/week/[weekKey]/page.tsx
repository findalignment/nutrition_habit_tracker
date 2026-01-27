import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getOrCreateUser, hasProSubscription } from '@/lib/auth'
import { prisma } from '@/lib/db'
import PaywallGate from '@/components/PaywallGate'
import WeeklySummaryCard from '@/components/WeeklySummaryCard'

export default async function WeeklyPage({
  params,
}: {
  params: { weekKey: string }
}) {
  const user = await getOrCreateUser()

  if (!user) {
    redirect('/login')
  }

  const isPro = hasProSubscription(user.subscriptionStatus)

  // Try to fetch existing summary
  let summary = await prisma.weeklySummary.findUnique({
    where: {
      userId_weekKey: {
        userId: user.id,
        weekKey: params.weekKey,
      },
    },
  })

  // If no summary exists and user is pro, generate one
  if (!summary && isPro) {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL}/api/weekly`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ weekKey: params.weekKey }),
        }
      )

      if (response.ok) {
        const data = await response.json()
        summary = data.summary
      }
    } catch (error) {
      console.error('Failed to generate summary:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="text-2xl font-bold text-primary-600">
              Habit Coach
            </Link>
            <nav className="flex items-center gap-6">
              <Link href="/dashboard" className="text-gray-700 hover:text-gray-900">
                Dashboard
              </Link>
              <Link href="/checkin" className="text-gray-700 hover:text-gray-900">
                Check In
              </Link>
              <Link href="/settings" className="text-gray-700 hover:text-gray-900">
                Settings
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/dashboard"
            className="text-primary-600 hover:text-primary-700 flex items-center gap-2 mb-6"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </Link>

          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Weekly Summary - Week {params.weekKey}
          </h1>

          <PaywallGate feature="Weekly Summaries" isPro={isPro}>
            {summary ? (
              <WeeklySummaryCard
                weekKey={summary.weekKey}
                summary={summary.summary}
                pattern={summary.pattern}
                nextWeekFocus={summary.nextWeekFocus}
                createdAt={summary.createdAt}
              />
            ) : (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <p className="text-gray-600 mb-4">
                  No summary available for this week yet.
                </p>
                <p className="text-sm text-gray-500">
                  Weekly summaries are generated automatically for weeks with check-ins.
                </p>
              </div>
            )}
          </PaywallGate>
        </div>
      </main>
    </div>
  )
}
