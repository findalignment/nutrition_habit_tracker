import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="text-2xl font-bold text-primary-600">Habit Coach</div>
          <div className="flex gap-4">
            <Link
              href="/pricing"
              className="text-gray-600 hover:text-gray-900"
            >
              Pricing
            </Link>
            <Link
              href="/login"
              className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700"
            >
              Sign In
            </Link>
          </div>
        </nav>
      </header>

      <main className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Build Better Nutrition Habits,
            <br />
            <span className="text-primary-600">One Meal at a Time</span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
            Get personalized AI-powered feedback on your meals. Track your progress,
            build sustainable habits, and achieve your nutrition goals.
          </p>

          <div className="flex gap-4 justify-center">
            <Link
              href="/login"
              className="bg-primary-600 text-white px-8 py-4 rounded-lg text-lg font-medium hover:bg-primary-700"
            >
              Get Started Free
            </Link>
            <Link
              href="/pricing"
              className="bg-white text-primary-600 border-2 border-primary-600 px-8 py-4 rounded-lg text-lg font-medium hover:bg-primary-50"
            >
              View Pricing
            </Link>
          </div>
        </div>

        <div className="mt-32 grid md:grid-cols-3 gap-12 max-w-5xl mx-auto">
          <Feature
            icon="📸"
            title="Photo-Based Tracking"
            description="Simply snap a photo of your meal and get instant feedback"
          />
          <Feature
            icon="🤖"
            title="AI-Powered Insights"
            description="Personalized feedback tailored to your goals and preferences"
          />
          <Feature
            icon="📊"
            title="Weekly Summaries"
            description="See patterns and get actionable focus areas for the week ahead"
          />
        </div>

        <div className="mt-32 bg-white rounded-2xl shadow-xl p-12 max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">
            How It Works
          </h2>
          <div className="space-y-8">
            <Step
              number={1}
              title="Choose Your Goal"
              description="Select from goals like reducing snacking, eating more plants, or building meal consistency"
            />
            <Step
              number={2}
              title="Check In Daily"
              description="Take a photo of your meal, answer quick questions, and submit"
            />
            <Step
              number={3}
              title="Get Feedback"
              description="Receive personalized coaching, habit scores, and one actionable tip"
            />
            <Step
              number={4}
              title="Build Momentum"
              description="Track your streak, see weekly patterns, and celebrate progress"
            />
          </div>
        </div>

        <div className="mt-32 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Ready to Build Better Habits?
          </h2>
          <Link
            href="/login"
            className="inline-block bg-primary-600 text-white px-8 py-4 rounded-lg text-lg font-medium hover:bg-primary-700"
          >
            Start Your Journey
          </Link>
        </div>
      </main>

      <footer className="container mx-auto px-4 py-12 mt-32 border-t">
        <div className="text-center text-gray-600">
          <p>&copy; 2026 Habit Coach. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

function Feature({
  icon,
  title,
  description,
}: {
  icon: string
  title: string
  description: string
}) {
  return (
    <div className="text-center">
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  )
}

function Step({
  number,
  title,
  description,
}: {
  number: number
  title: string
  description: string
}) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0 w-10 h-10 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold">
        {number}
      </div>
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
        <p className="text-gray-600">{description}</p>
      </div>
    </div>
  )
}
