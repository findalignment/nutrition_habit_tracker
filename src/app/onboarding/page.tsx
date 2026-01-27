'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Goal {
  id: string
  name: string
  description: string
}

export default function OnboardingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [goals, setGoals] = useState<Goal[]>([])
  const [formData, setFormData] = useState({
    goalId: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    preferences: {
      tone: 'supportive' as const,
      vegetarian: false,
      vegan: false,
      allergies: [] as string[],
      noCalorieEstimates: false,
    },
  })

  useEffect(() => {
    fetch('/api/onboarding')
      .then((res) => res.json())
      .then((data) => setGoals(data.goals || []))
      .catch((err) => console.error('Failed to load goals:', err))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.goalId) {
      alert('Please select a goal')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('Failed to complete onboarding')
      }

      router.push('/dashboard')
    } catch (error) {
      console.error('Onboarding error:', error)
      alert('Failed to complete onboarding. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Let's Get Started
            </h1>
            <p className="text-gray-600">
              Tell us a bit about your goals and preferences
            </p>
          </div>

          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-8 space-y-8">
            <div>
              <label className="block text-lg font-medium text-gray-900 mb-4">
                What's your main goal?
              </label>
              <div className="space-y-3">
                {goals.map((goal) => (
                  <label
                    key={goal.id}
                    className={`block p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      formData.goalId === goal.id
                        ? 'border-primary-600 bg-primary-50'
                        : 'border-gray-200 hover:border-primary-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="goal"
                      value={goal.id}
                      checked={formData.goalId === goal.id}
                      onChange={(e) =>
                        setFormData({ ...formData, goalId: e.target.value })
                      }
                      className="sr-only"
                    />
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            formData.goalId === goal.id
                              ? 'border-primary-600'
                              : 'border-gray-300'
                          }`}
                        >
                          {formData.goalId === goal.id && (
                            <div className="w-3 h-3 rounded-full bg-primary-600" />
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{goal.name}</div>
                        <div className="text-sm text-gray-600 mt-1">
                          {goal.description}
                        </div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-lg font-medium text-gray-900 mb-4">
                Feedback Tone
              </label>
              <select
                value={formData.preferences.tone}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    preferences: {
                      ...formData.preferences,
                      tone: e.target.value as any,
                    },
                  })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="supportive">Supportive & Encouraging</option>
                <option value="direct">Direct & Straightforward</option>
                <option value="scientific">Scientific & Data-Focused</option>
              </select>
            </div>

            <div>
              <label className="block text-lg font-medium text-gray-900 mb-4">
                Dietary Preferences
              </label>
              <div className="space-y-3">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={formData.preferences.vegetarian}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        preferences: {
                          ...formData.preferences,
                          vegetarian: e.target.checked,
                        },
                      })
                    }
                    className="w-5 h-5 text-primary-600 rounded"
                  />
                  <span className="text-gray-700">Vegetarian</span>
                </label>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={formData.preferences.vegan}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        preferences: {
                          ...formData.preferences,
                          vegan: e.target.checked,
                        },
                      })
                    }
                    className="w-5 h-5 text-primary-600 rounded"
                  />
                  <span className="text-gray-700">Vegan</span>
                </label>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={formData.preferences.noCalorieEstimates}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        preferences: {
                          ...formData.preferences,
                          noCalorieEstimates: e.target.checked,
                        },
                      })
                    }
                    className="w-5 h-5 text-primary-600 rounded"
                  />
                  <span className="text-gray-700">
                    Don't mention calorie estimates
                  </span>
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !formData.goalId}
              className="w-full bg-primary-600 text-white py-4 rounded-lg text-lg font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Setting up...' : 'Continue to Dashboard'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
