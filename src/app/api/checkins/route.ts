import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { createCheckInSchema } from '@/lib/validators'
import { z } from 'zod'

// Rate limit: 10 check-ins per day
const checkInCounts = new Map<string, { count: number; date: string }>()

function checkDailyLimit(userId: string): boolean {
  const today = new Date().toISOString().split('T')[0]
  const userLimit = checkInCounts.get(userId)

  if (!userLimit || userLimit.date !== today) {
    checkInCounts.set(userId, { count: 1, date: today })
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

    if (!checkDailyLimit(user.id)) {
      return NextResponse.json(
        { error: 'Daily limit reached. Max 10 check-ins per day.' },
        { status: 429 }
      )
    }

    const body = await req.json()
    const data = createCheckInSchema.parse(body)

    // Create check-in with answers and photos
    const checkIn = await prisma.checkIn.create({
      data: {
        userId: user.id,
        date: data.date,
        mealType: data.mealType,
        notes: data.notes,
        answers: {
          create: {
            drinksCalories: data.answers.drinksCalories,
            alcohol: data.answers.alcohol,
            snacks: data.answers.snacks,
            cookingTastes: data.answers.cookingTastes,
            supplements: data.answers.supplements,
            missedMeals: data.answers.missedMeals,
            hungerLevel: data.answers.hungerLevel,
            stressLevel: data.answers.stressLevel,
          },
        },
        photos: {
          create: data.photoUrls.map((url) => ({
            url,
            takenAt: new Date(),
          })),
        },
      },
      include: {
        answers: true,
        photos: true,
      },
    })

    return NextResponse.json({
      checkIn,
      message: 'Check-in created successfully',
    })
  } catch (error) {
    console.error('Create check-in error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid check-in data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create check-in' },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser()
    const { searchParams } = new URL(req.url)
    
    const limit = parseInt(searchParams.get('limit') || '30')
    const isPro = user.subscriptionStatus === 'active' || user.subscriptionStatus === 'trial'
    
    // Free users can only see last 3 days
    const daysLimit = isPro ? 30 : 3

    const checkIns = await prisma.checkIn.findMany({
      where: {
        userId: user.id,
        createdAt: {
          gte: new Date(Date.now() - daysLimit * 24 * 60 * 60 * 1000),
        },
      },
      include: {
        photos: true,
        answers: true,
        aiResult: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    return NextResponse.json({ checkIns })
  } catch (error) {
    console.error('Get check-ins error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch check-ins' },
      { status: 500 }
    )
  }
}
