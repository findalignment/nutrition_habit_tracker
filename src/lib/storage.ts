import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { randomUUID } from 'crypto'

const s3Client = new S3Client({
  region: process.env.STORAGE_REGION || 'auto',
  endpoint: process.env.STORAGE_ENDPOINT,
  credentials: {
    accessKeyId: process.env.STORAGE_ACCESS_KEY_ID!,
    secretAccessKey: process.env.STORAGE_SECRET_ACCESS_KEY!,
  },
})

export async function generateUploadUrl(
  userId: string,
  fileType: string
): Promise<{ uploadUrl: string; fileKey: string; publicUrl: string }> {
  const fileExtension = fileType.split('/')[1] || 'jpg'
  const fileKey = `${userId}/${Date.now()}-${randomUUID()}.${fileExtension}`

  const command = new PutObjectCommand({
    Bucket: process.env.STORAGE_BUCKET!,
    Key: fileKey,
    ContentType: fileType,
  })

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 })
  const publicUrl = `${process.env.STORAGE_PUBLIC_URL}/${fileKey}`

  return {
    uploadUrl,
    fileKey,
    publicUrl,
  }
}

export function getPublicUrl(fileKey: string): string {
  return `${process.env.STORAGE_PUBLIC_URL}/${fileKey}`
}
