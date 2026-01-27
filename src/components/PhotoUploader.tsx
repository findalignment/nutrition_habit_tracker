'use client'

import { useState } from 'react'
import Image from 'next/image'

interface PhotoUploaderProps {
  onPhotosUploaded: (urls: string[]) => void
  maxPhotos?: number
}

export default function PhotoUploader({
  onPhotosUploaded,
  maxPhotos = 3,
}: PhotoUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    if (uploadedUrls.length + files.length > maxPhotos) {
      setError(`Maximum ${maxPhotos} photos allowed`)
      return
    }

    setUploading(true)
    setError(null)

    try {
      const newUrls: string[] = []

      for (const file of Array.from(files)) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          throw new Error('Only images are allowed')
        }

        // Get upload URL
        const urlResponse = await fetch('/api/upload-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileType: file.type }),
        })

        if (!urlResponse.ok) {
          throw new Error('Failed to get upload URL')
        }

        const { uploadUrl, publicUrl } = await urlResponse.json()

        // Upload to storage
        const uploadResponse = await fetch(uploadUrl, {
          method: 'PUT',
          headers: { 'Content-Type': file.type },
          body: file,
        })

        if (!uploadResponse.ok) {
          throw new Error('Failed to upload file')
        }

        newUrls.push(publicUrl)
      }

      const allUrls = [...uploadedUrls, ...newUrls]
      setUploadedUrls(allUrls)
      onPhotosUploaded(allUrls)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const removePhoto = (index: number) => {
    const newUrls = uploadedUrls.filter((_, i) => i !== index)
    setUploadedUrls(newUrls)
    onPhotosUploaded(newUrls)
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Photos (optional, {uploadedUrls.length}/{maxPhotos})
        </label>
        
        {uploadedUrls.length < maxPhotos && (
          <label className="block">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              disabled={uploading}
              className="hidden"
            />
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-primary-500 hover:bg-primary-50 transition-colors">
              {uploading ? (
                <p className="text-gray-600">Uploading...</p>
              ) : (
                <>
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                  >
                    <path
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <p className="mt-2 text-sm text-gray-600">
                    Click to upload photos
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    PNG, JPG, WEBP up to 10MB
                  </p>
                </>
              )}
            </div>
          </label>
        )}

        {error && (
          <p className="mt-2 text-sm text-red-600">{error}</p>
        )}
      </div>

      {uploadedUrls.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {uploadedUrls.map((url, index) => (
            <div key={index} className="relative group">
              <Image
                src={url}
                alt={`Upload ${index + 1}`}
                width={200}
                height={200}
                className="rounded-lg object-cover w-full h-32"
              />
              <button
                type="button"
                onClick={() => removePhoto(index)}
                className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
