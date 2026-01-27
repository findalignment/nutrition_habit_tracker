import type { HabitScore } from '@/lib/scoring'
import { calculateOverallScore, getScoreBadge } from '@/lib/scoring'

interface HabitScoreBadgeProps {
  score: HabitScore
  showDetails?: boolean
}

export default function HabitScoreBadge({ score, showDetails = false }: HabitScoreBadgeProps) {
  const overall = calculateOverallScore(score)
  const badge = getScoreBadge(overall)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="text-center">
          <div className="text-4xl font-bold text-gray-900">{overall}</div>
          <div className="text-sm text-gray-500">Overall Score</div>
        </div>
        <span className={`px-4 py-2 rounded-full text-sm font-medium ${badge.color}`}>
          {badge.label}
        </span>
      </div>

      {showDetails && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <ScoreItem label="Protein" value={score.protein} />
          <ScoreItem label="Plants" value={score.plants} />
          <ScoreItem label="Liquids" value={score.liquids} />
          <ScoreItem label="Snacks" value={10 - score.snacks} inverse />
          <ScoreItem label="Training" value={score.training} />
        </div>
      )}
    </div>
  )
}

function ScoreItem({ label, value, inverse = false }: { label: string; value: number; inverse?: boolean }) {
  const displayValue = inverse ? 10 - value : value
  const color = value >= 7 ? 'text-green-600' : value >= 5 ? 'text-yellow-600' : 'text-orange-600'

  return (
    <div className="text-center p-4 bg-gray-50 rounded-lg">
      <div className={`text-2xl font-bold ${color}`}>{displayValue}</div>
      <div className="text-xs text-gray-600 mt-1">{label}</div>
    </div>
  )
}
