import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { updateCheckInSchema } from '@/lib/validators'
import { z } from 'zod'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireUser()
    const { id } = params

    const checkIn = await prisma.checkIn.findFirst({
      where: {
        id,
        userId: user.id,
      },
      include: {
        photos: true,
        answers: true,
        aiResult: true,
      },
    })

    if (!checkIn) {
      return NextResponse.json(
        { error: 'Check-in not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ checkIn })
  } catch (error) {
    console.error('Get check-in error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch check-in' },
      { status: 500 }
    )
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireUser()
    const { id } = params

    const checkIn = await prisma.checkIn.findFirst({
      where: {
        id,
        userId: user.id,
      },
    })

    if (!checkIn) {
      return NextResponse.json(
        { error: 'Check-in not found' },
        { status: 404 }
      )
    }

    const body = await req.json()
    const data = updateCheckInSchema.parse(body)

    const updated = await prisma.checkIn.update({
      where: { id },
      data: {
        notes: data.notes,
        answers: data.answers
          ? {
              update: {
                drinksCalories: data.answers.drinksCalories,
                alcohol: data.answers.alcohol,
                snacks: data.answers.snacks,
                cookingTastes: data.answers.cookingTastes,
                supplements: data.answers.supplements,
                missedMeals: data.answers.missedMeals,
                hungerLevel: data.answers.hungerLevel,
                stressLevel: data.answers.stressLevel,
              },
            }
          : undefined,
      },
      include: {
        photos: true,
        answers: true,
        aiResult: true,
      },
    })

    return NextResponse.json({
      checkIn: updated,
      message: 'Check-in updated successfully',
    })
  } catch (error) {
    console.error('Update check-in error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid update data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update check-in' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireUser()
    const { id } = params

    const checkIn = await prisma.checkIn.findFirst({
      where: {
        id,
        userId: user.id,
      },
    })

    if (!checkIn) {
      return NextResponse.json(
        { error: 'Check-in not found' },
        { status: 404 }
      )
    }

    await prisma.checkIn.delete({
      where: { id },
    })

    return NextResponse.json({
      message: 'Check-in deleted successfully',
    })
  } catch (error) {
    console.error('Delete check-in error:', error)
    return NextResponse.json(
      { error: 'Failed to delete check-in' },
      { status: 500 }
    )
  }
}
