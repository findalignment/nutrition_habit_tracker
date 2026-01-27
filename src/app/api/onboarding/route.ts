import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { onboardingSchema } from '@/lib/validators'
import { z } from 'zod'

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser()

    const body = await req.json()
    const data = onboardingSchema.parse(body)

    // Update user with onboarding data
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        goalId: data.goalId,
        timezone: data.timezone,
        preferences: data.preferences,
      },
      include: {
        goal: true,
      },
    })

    return NextResponse.json({
      user: updated,
      message: 'Onboarding completed successfully',
    })
  } catch (error) {
    console.error('Onboarding error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid onboarding data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to complete onboarding' },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser()

    // Get available goals
    const goals = await prisma.goal.findMany({
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({ goals })
  } catch (error) {
    console.error('Get goals error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch goals' },
      { status: 500 }
    )
  }
}
