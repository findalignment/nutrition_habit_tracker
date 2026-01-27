interface WeeklySummaryCardProps {
  weekKey: string
  summary: string
  pattern: string
  nextWeekFocus: string
  createdAt: Date
}

export default function WeeklySummaryCard({
  weekKey,
  summary,
  pattern,
  nextWeekFocus,
  createdAt,
}: WeeklySummaryCardProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Week {weekKey}</h3>
        <span className="text-sm text-gray-500">
          {new Date(createdAt).toLocaleDateString()}
        </span>
      </div>

      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2">Summary</h4>
        <p className="text-gray-600">{summary}</p>
      </div>

      <div className="bg-blue-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-1">
          Pattern Noticed
        </h4>
        <p className="text-blue-800">{pattern}</p>
      </div>

      <div className="bg-green-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-green-900 mb-1">
          Focus for Next Week
        </h4>
        <p className="text-green-800">{nextWeekFocus}</p>
      </div>
    </div>
  )
}
