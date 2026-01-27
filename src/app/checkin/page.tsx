import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getOrCreateUser } from '@/lib/auth'
import CheckInForm from '@/components/CheckInForm'

export default async function CheckInPage() {
  const user = await getOrCreateUser()

  if (!user) {
    redirect('/login')
  }

  if (!user.goalId) {
    redirect('/onboarding')
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
              <Link href="/checkin" className="text-gray-700 hover:text-gray-900 font-medium">
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
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <Link
              href="/dashboard"
              className="text-primary-600 hover:text-primary-700 flex items-center gap-2 mb-4"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Dashboard
            </Link>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Create Check-In
            </h1>
            <p className="text-gray-600">
              Track your meal and get personalized feedback
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8">
            <CheckInForm />
          </div>
        </div>
      </main>
    </div>
  )
}
