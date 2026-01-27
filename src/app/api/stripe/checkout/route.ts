import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth'
import { createCheckoutSession } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser()

    const session = await createCheckoutSession(user.id, user.email)

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Checkout session error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
