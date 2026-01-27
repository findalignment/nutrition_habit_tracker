'use client'

import { useRouter } from 'next/navigation'

interface PaywallGateProps {
  feature: string
  children: React.ReactNode
  isPro: boolean
}

export default function PaywallGate({ feature, children, isPro }: PaywallGateProps) {
  const router = useRouter()

  if (isPro) {
    return <>{children}</>
  }

  return (
    <div className="relative">
      <div className="blur-sm pointer-events-none">{children}</div>
      
      <div className="absolute inset-0 flex items-center justify-center bg-white/80">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-primary-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Upgrade to Pro
          </h3>
          
          <p className="text-gray-600 mb-6">
            {feature} is available with a Pro subscription.
          </p>
          
          <button
            onClick={() => router.push('/pricing')}
            className="w-full bg-primary-600 text-white py-3 rounded-lg font-medium hover:bg-primary-700"
          >
            See Pricing
          </button>
        </div>
      </div>
    </div>
  )
}
