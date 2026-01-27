import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { analyzeCheckIn } from '@/lib/llm'
import { z } from 'zod'

const schema = z.object({
  checkInId: z.string().min(1),
})

// Rate limit: 10 analyses per day per user
const analyzeCounts = new Map<string, { count: number; date: string }>()

function checkAnalyzeLimit(userId: string): boolean {
  const today = new Date().toISOString().split('T')[0]
  const userLimit = analyzeCounts.get(userId)

  if (!userLimit || userLimit.date !== today) {
    analyzeCounts.set(userId, { count: 1, date: today })
    return true
  }

  if (userLimit.count >= 10) {
    return false
  }

  userLimit.count++
  return true
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser()

    if (!checkAnalyzeLimit(user.id)) {
      return NextResponse.json(
        { error: 'Daily analysis limit reached. Max 10 analyses per day.' },
        { status: 429 }
      )
    }

    const body = await req.json()
    const { checkInId } = schema.parse(body)

    // Fetch check-in with all related data
    const checkIn = await prisma.checkIn.findFirst({
      where: {
        id: checkInId,
        userId: user.id,
      },
      include: {
        photos: true,
        answers: true,
      },
    })

    if (!checkIn) {
      return NextResponse.json(
        { error: 'Check-in not found' },
        { status: 404 }
      )
    }

    // Check if already analyzed
    const existing = await prisma.aIResult.findUnique({
      where: { checkInId },
    })

    if (existing) {
      return NextResponse.json({
        aiResult: existing,
        message: 'Analysis already exists',
      })
    }

    // Fetch user with goal
    const userWithGoal = await prisma.user.findUnique({
      where: { id: user.id },
      include: { goal: true },
    })

    if (!userWithGoal) {
      throw new Error('User not found')
    }

    // Run AI analysis
    const result = await analyzeCheckIn({
      checkIn,
      user: userWithGoal,
    })

    // Store result
    const aiResult = await prisma.aIResult.create({
      data: {
        checkInId,
        habitScore: result.habitScore,
        feedbackShort: result.feedbackShort,
        oneAction: result.oneAction,
        confidence: result.confidence,
        flags: result.flags || {},
        modelVersion: process.env.OPENAI_MODEL || 'gpt-4o',
      },
    })

    return NextResponse.json({
      aiResult,
      message: 'Analysis completed successfully',
    })
  } catch (error) {
    console.error('Analyze error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to analyze check-in' },
      { status: 500 }
    )
  }
}
