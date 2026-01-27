'use client'

import { useState, useEffect } from 'react'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { useUser } from '@clerk/nextjs'

export default function SettingsPage() {
  const { user } = useUser()
  const [loading, setLoading] = useState(false)
  const [subscriptionStatus, setSubscriptionStatus] = useState('free')

  useEffect(() => {
    // Fetch user settings
    // In production, you'd fetch this from your API
    setSubscriptionStatus('free')
  }, [])

  const handleManageSubscription = async () => {
    setLoading(true)
    
    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
      })

      const { url } = await response.json()
      
      if (url) {
        window.location.href = url
      }
    } catch (error) {
      console.error('Portal error:', error)
      alert('Failed to open billing portal. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return null
  }

  const isPro = subscriptionStatus === 'active' || subscriptionStatus === 'trial'

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
              <Link href="/settings" className="text-gray-700 hover:text-gray-900 font-medium">
                Settings
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Settings</h1>

          <div className="space-y-6">
            <section className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Account
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    Email
                  </label>
                  <div className="text-gray-900">
                    {user.emailAddresses[0]?.emailAddress}
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    Member Since
                  </label>
                  <div className="text-gray-900">
                    {new Date(user.createdAt || Date.now()).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </section>

            <section className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Subscription
              </h2>
              
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="font-medium text-gray-900">
                    Current Plan: {isPro ? 'Pro' : 'Free'}
                  </div>
                  <div className="text-sm text-gray-600">
                    {isPro
                      ? 'You have access to all Pro features'
                      : 'Upgrade to unlock all features'}
                  </div>
                </div>
                <span
                  className={`px-4 py-2 rounded-full text-sm font-medium ${
                    isPro
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {isPro ? 'Active' : 'Free'}
                </span>
              </div>

              {isPro ? (
                <button
                  onClick={handleManageSubscription}
                  disabled={loading}
                  className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 disabled:opacity-50"
                >
                  {loading ? 'Loading...' : 'Manage Subscription'}
                </button>
              ) : (
                <Link
                  href="/pricing"
                  className="block w-full bg-primary-600 text-white py-3 rounded-lg font-medium text-center hover:bg-primary-700"
                >
                  Upgrade to Pro
                </Link>
              )}
            </section>

            <section className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Preferences
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-2">
                    Feedback Tone
                  </label>
                  <select
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    defaultValue="supportive"
                  >
                    <option value="supportive">Supportive & Encouraging</option>
                    <option value="direct">Direct & Straightforward</option>
                    <option value="scientific">Scientific & Data-Focused</option>
                  </select>
                </div>

                <div>
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      className="w-5 h-5 text-primary-600 rounded"
                    />
                    <span className="text-gray-700">
                      Don't mention calorie estimates
                    </span>
                  </label>
                </div>

                <button className="w-full bg-primary-600 text-white py-3 rounded-lg font-medium hover:bg-primary-700">
                  Save Preferences
                </button>
              </div>
            </section>

            <section className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Data & Privacy
              </h2>
              
              <div className="space-y-3">
                <button className="w-full text-left px-4 py-3 bg-gray-50 rounded-lg hover:bg-gray-100 text-gray-700">
                  Download My Data
                </button>
                <button className="w-full text-left px-4 py-3 bg-red-50 rounded-lg hover:bg-red-100 text-red-700">
                  Delete Account
                </button>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}
