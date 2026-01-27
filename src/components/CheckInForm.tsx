'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import PhotoUploader from './PhotoUploader'
import type { CheckInAnswersInput } from '@/lib/validators'

export default function CheckInForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [photoUrls, setPhotoUrls] = useState<string[]>([])

  const [formData, setFormData] = useState({
    mealType: 'lunch' as const,
    notes: '',
    answers: {
      drinksCalories: undefined as 'yes' | 'no' | 'unsure' | undefined,
      alcohol: undefined as 'yes' | 'no' | undefined,
      snacks: undefined as 'yes' | 'no' | undefined,
      cookingTastes: undefined as 'yes' | 'no' | undefined,
      supplements: undefined as 'yes' | 'no' | undefined,
      missedMeals: undefined as 'yes' | 'no' | undefined,
      hungerLevel: undefined as number | undefined,
      stressLevel: undefined as number | undefined,
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Create check-in
      const response = await fetch('/api/checkins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: new Date().toISOString().split('T')[0],
          mealType: formData.mealType,
          notes: formData.notes,
          photoUrls,
          answers: formData.answers,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create check-in')
      }

      const { checkIn } = await response.json()

      // Trigger analysis
      const analyzeResponse = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checkInId: checkIn.id }),
      })

      if (!analyzeResponse.ok) {
        console.error('Analysis failed, but check-in was created')
      }

      // Redirect to result
      router.push(`/checkin/${checkIn.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 text-red-800 p-4 rounded-lg">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Meal Type
        </label>
        <select
          value={formData.mealType}
          onChange={(e) =>
            setFormData({
              ...formData,
              mealType: e.target.value as any,
            })
          }
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
        >
          <option value="breakfast">Breakfast</option>
          <option value="lunch">Lunch</option>
          <option value="dinner">Dinner</option>
          <option value="snack">Snack</option>
          <option value="full-day">Full Day</option>
        </select>
      </div>

      <PhotoUploader
        onPhotosUploaded={setPhotoUrls}
        maxPhotos={3}
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Notes (optional)
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) =>
            setFormData({ ...formData, notes: e.target.value })
          }
          placeholder="Any details about this meal..."
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <div className="space-y-4">
        <h3 className="font-medium text-gray-900">Quick Questions</h3>

        <div>
          <label className="block text-sm text-gray-700 mb-1">
            Did you have drinks with calories? (juice, soda, etc.)
          </label>
          <div className="flex gap-2">
            {(['yes', 'no', 'unsure'] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() =>
                  setFormData({
                    ...formData,
                    answers: {
                      ...formData.answers,
                      drinksCalories: option,
                    },
                  })
                }
                className={`px-4 py-2 rounded-lg border ${
                  formData.answers.drinksCalories === option
                    ? 'bg-primary-100 border-primary-500 text-primary-800'
                    : 'bg-white border-gray-300 text-gray-700'
                }`}
              >
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-700 mb-1">
            Any alcohol?
          </label>
          <div className="flex gap-2">
            {(['yes', 'no'] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() =>
                  setFormData({
                    ...formData,
                    answers: { ...formData.answers, alcohol: option },
                  })
                }
                className={`px-4 py-2 rounded-lg border ${
                  formData.answers.alcohol === option
                    ? 'bg-primary-100 border-primary-500 text-primary-800'
                    : 'bg-white border-gray-300 text-gray-700'
                }`}
              >
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-700 mb-1">
            Did you snack?
          </label>
          <div className="flex gap-2">
            {(['yes', 'no'] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() =>
                  setFormData({
                    ...formData,
                    answers: { ...formData.answers, snacks: option },
                  })
                }
                className={`px-4 py-2 rounded-lg border ${
                  formData.answers.snacks === option
                    ? 'bg-primary-100 border-primary-500 text-primary-800'
                    : 'bg-white border-gray-300 text-gray-700'
                }`}
              >
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-700 mb-2">
            Hunger level (1-5)
          </label>
          <input
            type="range"
            min="1"
            max="5"
            value={formData.answers.hungerLevel || 3}
            onChange={(e) =>
              setFormData({
                ...formData,
                answers: {
                  ...formData.answers,
                  hungerLevel: parseInt(e.target.value),
                },
              })
            }
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Not hungry</span>
            <span>Very hungry</span>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-primary-600 text-white py-3 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Creating check-in...' : 'Submit Check-In'}
      </button>
    </form>
  )
}
