import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { getOrCreateUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import HabitScoreBadge from '@/components/HabitScoreBadge'
import FeedbackCard from '@/components/FeedbackCard'

export default async function CheckInDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const user = await getOrCreateUser()

  if (!user) {
    redirect('/login')
  }

  const checkIn = await prisma.checkIn.findFirst({
    where: {
      id: params.id,
      userId: user.id,
    },
    include: {
      photos: true,
      answers: true,
      aiResult: true,
    },
  })

  if (!checkIn) {
    redirect('/dashboard')
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

          <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 capitalize">
                  {checkIn.mealType}
                </h1>
                <p className="text-gray-600">
                  {checkIn.date} at{' '}
                  {new Date(checkIn.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>

            {checkIn.photos.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Photos</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {checkIn.photos.map((photo) => (
                    <Image
                      key={photo.id}
                      src={photo.url}
                      alt="Meal photo"
                      width={300}
                      height={300}
                      className="rounded-lg object-cover w-full h-48"
                    />
                  ))}
                </div>
              </div>
            )}

            {checkIn.notes && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Notes</h3>
                <p className="text-gray-700">{checkIn.notes}</p>
              </div>
            )}

            {checkIn.answers && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Answers</h3>
                <div className="grid grid-cols-2 gap-4">
                  {checkIn.answers.drinksCalories && (
                    <AnswerItem
                      label="Drinks with calories"
                      value={checkIn.answers.drinksCalories}
                    />
                  )}
                  {checkIn.answers.alcohol && (
                    <AnswerItem label="Alcohol" value={checkIn.answers.alcohol} />
                  )}
                  {checkIn.answers.snacks && (
                    <AnswerItem label="Snacks" value={checkIn.answers.snacks} />
                  )}
                  {checkIn.answers.hungerLevel && (
                    <AnswerItem
                      label="Hunger level"
                      value={`${checkIn.answers.hungerLevel}/5`}
                    />
                  )}
                  {checkIn.answers.stressLevel && (
                    <AnswerItem
                      label="Stress level"
                      value={`${checkIn.answers.stressLevel}/5`}
                    />
                  )}
                </div>
              </div>
            )}
          </div>

          {checkIn.aiResult ? (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-lg p-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Habit Score
                </h2>
                <HabitScoreBadge
                  score={checkIn.aiResult.habitScore as any}
                  showDetails
                />
              </div>

              <FeedbackCard
                feedback={checkIn.aiResult.feedbackShort}
                oneAction={checkIn.aiResult.oneAction}
                confidence={checkIn.aiResult.confidence as any}
                flags={checkIn.aiResult.flags as any}
              />
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <p className="text-gray-600 mb-4">Analysis in progress...</p>
              <button
                onClick={() => window.location.reload()}
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                Refresh Page
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

function AnswerItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <div className="text-sm text-gray-600 mb-1">{label}</div>
      <div className="text-gray-900 font-medium capitalize">{value}</div>
    </div>
  )
}
