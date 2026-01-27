import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth'
import { generateUploadUrl } from '@/lib/storage'
import { z } from 'zod'

const schema = z.object({
  fileType: z.string().regex(/^image\/(jpeg|jpg|png|webp)$/),
})

// Rate limit: 30 uploads per day per user
const uploadCounts = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(userId: string): boolean {
  const now = Date.now()
  const userLimit = uploadCounts.get(userId)

  if (!userLimit || now > userLimit.resetAt) {
    uploadCounts.set(userId, {
      count: 1,
      resetAt: now + 24 * 60 * 60 * 1000, // 24 hours
    })
    return true
  }

  if (userLimit.count >= 30) {
    return false
  }

  userLimit.count++
  return true
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser()

    if (!checkRateLimit(user.id)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Max 30 uploads per day.' },
        { status: 429 }
      )
    }

    const body = await req.json()
    const { fileType } = schema.parse(body)

    const { uploadUrl, publicUrl } = await generateUploadUrl(user.id, fileType)

    return NextResponse.json({
      uploadUrl,
      publicUrl,
    })
  } catch (error) {
    console.error('Upload URL error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid file type. Only images are allowed.' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to generate upload URL' },
      { status: 500 }
    )
  }
}
