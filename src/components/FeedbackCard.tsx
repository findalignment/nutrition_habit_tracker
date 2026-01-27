interface FeedbackCardProps {
  feedback: string
  oneAction: string
  confidence: 'low' | 'med' | 'high'
  flags?: {
    possibleED?: boolean
    medical?: boolean
    unsafe?: boolean
  }
}

export default function FeedbackCard({
  feedback,
  oneAction,
  confidence,
  flags,
}: FeedbackCardProps) {
  const showWarning = flags?.possibleED || flags?.medical || flags?.unsafe

  return (
    <div className="space-y-4">
      {showWarning && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-yellow-600 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div className="text-sm text-yellow-800">
              <p className="font-medium">Please note</p>
              <p className="mt-1">
                {flags?.possibleED &&
                  'If you\'re experiencing disordered eating patterns, please reach out to a healthcare professional.'}
                {flags?.medical &&
                  'This is general guidance only. Please consult your healthcare provider for medical advice.'}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Feedback</h3>
          <span className="text-xs text-gray-500">
            Confidence: {confidence === 'high' ? 'High' : confidence === 'med' ? 'Medium' : 'Low'}
          </span>
        </div>
        
        <p className="text-gray-700 leading-relaxed">{feedback}</p>
      </div>

      <div className="bg-primary-50 border border-primary-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <div className="bg-primary-600 rounded-full p-2 mt-0.5">
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <div>
            <h4 className="font-semibold text-primary-900 mb-1">
              One Action for Next Time
            </h4>
            <p className="text-primary-800">{oneAction}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
