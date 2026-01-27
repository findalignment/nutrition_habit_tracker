import { NextRequest, NextResponse } from 'next/server'
import { requireUser, hasProSubscription } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { generateWeeklySummary } from '@/lib/llm'
import { z } from 'zod'

const schema = z.object({
  weekKey: z.string().regex(/^\d{4}-W\d{2}$/), // YYYY-WW format
})

function getWeekDates(weekKey: string): { start: Date; end: Date } {
  const [year, week] = weekKey.split('-W').map(Number)
  const firstDayOfYear = new Date(year, 0, 1)
  const daysToMonday = (8 - firstDayOfYear.getDay()) % 7
  const firstMonday = new Date(year, 0, 1 + daysToMonday)
  const weekStart = new Date(firstMonday.getTime() + (week - 1) * 7 * 24 * 60 * 60 * 1000)
  const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000)
  
  return { start: weekStart, end: weekEnd }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser()

    if (!hasProSubscription(user.subscriptionStatus)) {
      return NextResponse.json(
        { error: 'Weekly summaries require Pro subscription' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { weekKey } = schema.parse(body)

    // Check if summary already exists
    const existing = await prisma.weeklySummary.findUnique({
      where: {
        userId_weekKey: {
          userId: user.id,
          weekKey,
        },
      },
    })

    if (existing) {
      return NextResponse.json({
        summary: existing,
        message: 'Weekly summary already exists',
      })
    }

    // Get check-ins for the week
    const { start, end } = getWeekDates(weekKey)
    
    const checkIns = await prisma.checkIn.findMany({
      where: {
        userId: user.id,
        createdAt: {
          gte: start,
          lt: end,
        },
      },
      include: {
        aiResult: true,
      },
      orderBy: { createdAt: 'asc' },
    })

    if (checkIns.length === 0) {
      return NextResponse.json(
        { error: 'No check-ins found for this week' },
        { status: 404 }
      )
    }

    // Fetch user with goal
    const userWithGoal = await prisma.user.findUnique({
      where: { id: user.id },
      include: { goal: true },
    })

    if (!userWithGoal) {
      throw new Error('User not found')
    }

    // Generate summary
    const result = await generateWeeklySummary(checkIns, userWithGoal)

    // Store summary
    const summary = await prisma.weeklySummary.create({
      data: {
        userId: user.id,
        weekKey,
        summary: result.summary,
        pattern: result.pattern,
        nextWeekFocus: result.nextWeekFocus,
      },
    })

    return NextResponse.json({
      summary,
      message: 'Weekly summary generated successfully',
    })
  } catch (error) {
    console.error('Weekly summary error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid week key format. Use YYYY-WW.' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to generate weekly summary' },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser()
    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '12')

    const summaries = await prisma.weeklySummary.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    return NextResponse.json({ summaries })
  } catch (error) {
    console.error('Get summaries error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch summaries' },
      { status: 500 }
    )
  }
}
