export interface HabitScore {
  protein: number // 0-10
  plants: number // 0-10
  liquids: number // 0-10
  snacks: number // 0-10 (lower is better for most goals)
  training: number // 0-10 (appetite/hunger awareness)
}

export function calculateOverallScore(score: HabitScore): number {
  const total = score.protein + score.plants + score.liquids + (10 - score.snacks) + score.training
  return Math.round((total / 50) * 100)
}

export function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-600'
  if (score >= 60) return 'text-yellow-600'
  return 'text-orange-600'
}

export function getScoreBadge(score: number): { label: string; color: string } {
  if (score >= 80) return { label: 'Excellent', color: 'bg-green-100 text-green-800' }
  if (score >= 60) return { label: 'Good', color: 'bg-yellow-100 text-yellow-800' }
  if (score >= 40) return { label: 'Fair', color: 'bg-orange-100 text-orange-800' }
  return { label: 'Needs Work', color: 'bg-red-100 text-red-800' }
}
