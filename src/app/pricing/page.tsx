'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function PricingPage() {
  const [loading, setLoading] = useState(false)

  const handleCheckout = async () => {
    setLoading(true)
    
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
      })

      const { url } = await response.json()
      
      if (url) {
        window.location.href = url
      }
    } catch (error) {
      console.error('Checkout error:', error)
      alert('Failed to start checkout. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-primary-600">
            Habit Coach
          </Link>
          <div className="flex gap-4">
            <Link href="/" className="text-gray-600 hover:text-gray-900">
              Home
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
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-600">
            Start free, upgrade when you're ready
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          <PricingCard
            title="Free"
            price="$0"
            period="/month"
            features={[
              '1 check-in per day',
              'Text-only feedback',
              'Basic habit scores',
              'Last 3 days history',
              'Email support',
            ]}
            cta="Get Started"
            ctaLink="/login"
            highlighted={false}
          />

          <PricingCard
            title="Pro"
            price="$24"
            period="/month"
            features={[
              'Unlimited check-ins',
              'Photo-based AI feedback',
              'Advanced habit analytics',
              '30-day history',
              'Weekly summaries',
              'Pattern insights',
              'Priority support',
              'Cancel anytime',
            ]}
            cta={loading ? 'Loading...' : 'Upgrade to Pro'}
            onCtaClick={handleCheckout}
            highlighted={true}
          />
        </div>

        <div className="mt-20 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-6">
            <FAQ
              question="Can I cancel anytime?"
              answer="Yes! You can cancel your subscription at any time from your settings page. You'll continue to have Pro access until the end of your billing period."
            />
            <FAQ
              question="What happens to my data if I cancel?"
              answer="Your data is never deleted. If you cancel, you'll revert to the Free plan and only see the last 3 days of history. Upgrade again to access your full history."
            />
            <FAQ
              question="Is my payment information secure?"
              answer="Absolutely. We use Stripe for payment processing - we never see or store your credit card information."
            />
            <FAQ
              question="Can I switch between plans?"
              answer="Yes! You can upgrade from Free to Pro at any time. Downgrades take effect at the end of your billing period."
            />
          </div>
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

function PricingCard({
  title,
  price,
  period,
  features,
  cta,
  ctaLink,
  onCtaClick,
  highlighted,
}: {
  title: string
  price: string
  period: string
  features: string[]
  cta: string
  ctaLink?: string
  onCtaClick?: () => void
  highlighted: boolean
}) {
  return (
    <div
      className={`rounded-2xl p-8 ${
        highlighted
          ? 'bg-primary-600 text-white shadow-2xl scale-105'
          : 'bg-white text-gray-900 shadow-lg'
      }`}
    >
      <h3 className="text-2xl font-bold mb-2">{title}</h3>
      <div className="mb-6">
        <span className="text-5xl font-bold">{price}</span>
        <span className={highlighted ? 'text-primary-100' : 'text-gray-600'}>
          {period}
        </span>
      </div>

      <ul className="space-y-4 mb-8">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-3">
            <svg
              className={`w-6 h-6 flex-shrink-0 ${
                highlighted ? 'text-white' : 'text-primary-600'
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      {ctaLink ? (
        <Link
          href={ctaLink}
          className={`block w-full text-center py-4 rounded-lg font-medium ${
            highlighted
              ? 'bg-white text-primary-600 hover:bg-gray-100'
              : 'bg-primary-600 text-white hover:bg-primary-700'
          }`}
        >
          {cta}
        </Link>
      ) : (
        <button
          onClick={onCtaClick}
          className={`w-full py-4 rounded-lg font-medium ${
            highlighted
              ? 'bg-white text-primary-600 hover:bg-gray-100'
              : 'bg-primary-600 text-white hover:bg-primary-700'
          }`}
        >
          {cta}
        </button>
      )}
    </div>
  )
}

function FAQ({ question, answer }: { question: string; answer: string }) {
  return (
    <div className="bg-white rounded-lg p-6 shadow">
      <h3 className="font-semibold text-gray-900 mb-2">{question}</h3>
      <p className="text-gray-600">{answer}</p>
    </div>
  )
}
