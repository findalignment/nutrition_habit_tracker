import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getOrCreateUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

export default async function DashboardPage() {
  const user = await getOrCreateUser()

  if (!user) {
    redirect('/login')
  }

  if (!user.goalId) {
    redirect('/onboarding')
  }

  // Get today's check-ins
  const today = new Date().toISOString().split('T')[0]
  const todayCheckIns = await prisma.checkIn.findMany({
    where: {
      userId: user.id,
      date: today,
    },
    include: {
      aiResult: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  // Get recent check-ins (last 7 days)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const recentCheckIns = await prisma.checkIn.findMany({
    where: {
      userId: user.id,
      createdAt: { gte: sevenDaysAgo },
    },
    include: {
      aiResult: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  })

  // Calculate streak
  const streak = await calculateStreak(user.id)

  const isPro = user.subscriptionStatus === 'active' || user.subscriptionStatus === 'trial'

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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user.email.split('@')[0]}!
          </h1>
          <p className="text-gray-600">
            Goal: {user.goal?.name || 'Not set'}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <StatCard
            label="Today's Check-Ins"
            value={todayCheckIns.length}
            icon="📝"
          />
          <StatCard
            label="Current Streak"
            value={`${streak} days`}
            icon="🔥"
          />
          <StatCard
            label="Plan"
            value={isPro ? 'Pro' : 'Free'}
            icon={isPro ? '⭐' : '🆓'}
          />
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Today's Check-Ins
              </h2>
              <Link
                href="/checkin"
                className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
              >
                New Check-In
              </Link>
            </div>

            {todayCheckIns.length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                <p className="text-gray-600 mb-4">
                  No check-ins yet today. Start building your habit!
                </p>
                <Link
                  href="/checkin"
                  className="inline-block bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700"
                >
                  Create First Check-In
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {todayCheckIns.map((checkIn) => (
                  <Link
                    key={checkIn.id}
                    href={`/checkin/${checkIn.id}`}
                    className="block bg-white rounded-lg border border-gray-200 p-4 hover:border-primary-300 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900 capitalize">
                        {checkIn.mealType}
                      </span>
                      <span className="text-sm text-gray-500">
                        {new Date(checkIn.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    {checkIn.aiResult && (
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {checkIn.aiResult.feedbackShort}
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Recent Activity
            </h2>

            {recentCheckIns.length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                <p className="text-gray-600">No recent activity</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentCheckIns.map((checkIn) => (
                  <Link
                    key={checkIn.id}
                    href={`/checkin/${checkIn.id}`}
                    className="block bg-white rounded-lg border border-gray-200 p-3 hover:border-primary-300 transition-colors"
                  >
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-700 capitalize">
                        {checkIn.mealType}
                      </span>
                      <span className="text-gray-500">{checkIn.date}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {!isPro && (
          <div className="mt-8 bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg p-8 text-white">
            <h3 className="text-2xl font-bold mb-2">Upgrade to Pro</h3>
            <p className="mb-4 opacity-90">
              Get photo-based feedback, weekly summaries, and deeper insights
            </p>
            <Link
              href="/pricing"
              className="inline-block bg-white text-primary-600 px-6 py-3 rounded-lg font-medium hover:bg-gray-100"
            >
              See Pricing
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string
  value: string | number
  icon: string
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-2xl">{icon}</span>
        <span className="text-sm text-gray-600">{label}</span>
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
    </div>
  )
}

async function calculateStreak(userId: string): Promise<number> {
  const checkIns = await prisma.checkIn.findMany({
    where: { userId },
    orderBy: { date: 'desc' },
    select: { date: true },
    take: 365,
  })

  if (checkIns.length === 0) return 0

  let streak = 0
  let currentDate = new Date()
  currentDate.setHours(0, 0, 0, 0)

  for (const checkIn of checkIns) {
    const checkInDate = new Date(checkIn.date)
    const expectedDate = new Date(currentDate)
    expectedDate.setDate(expectedDate.getDate() - streak)

    if (checkInDate.toISOString().split('T')[0] === expectedDate.toISOString().split('T')[0]) {
      streak++
    } else {
      break
    }
  }

  return streak
}
