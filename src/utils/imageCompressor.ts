// src/utils/imageCompressor.ts
// Client-side image compression + thumbnail generation using Canvas API
// Zero dependencies beyond browser APIs

export interface CompressResult {
  compressed: File
  thumbnail: File
  skippedCompression: boolean
}

/**
 * Compress an image for chat and generate a thumbnail.
 * - Animated GIFs skip compression to preserve animation.
 * - Images under 200KB skip compression to avoid resampling artifacts.
 * - Max compressed width: 1500px, WebP @ 0.8 quality (JPEG 0.85 fallback).
 * - Thumbnail: 200px max width, WebP @ 0.7 (JPEG 0.8 fallback).
 * - If compressed is larger than original, original is used instead.
 */
export const compressImageForChat = (file: File): Promise<CompressResult> => {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file)
    const img = new Image()

    img.onload = () => {
      try {
        const isGif = file.type === 'image/gif'
        const isSmall = file.size < 200 * 1024

        // Always generate thumbnail
        const thumbnail = generateThumbnail(img, file.name)

        if (isGif || isSmall) {
          URL.revokeObjectURL(objectUrl)
          thumbnail.then(thumb => {
            resolve({ compressed: file, thumbnail: thumb, skippedCompression: true })
          }).catch(reject)
          return
        }

        // Compress the full image
        const maxWidth = 1500
        let targetWidth = img.width
        let targetHeight = img.height

        if (img.width > maxWidth) {
          targetWidth = maxWidth
          targetHeight = Math.round((img.height / img.width) * maxWidth)
        }

        const canvas = document.createElement('canvas')
        canvas.width = targetWidth
        canvas.height = targetHeight
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight)

        // Try WebP first
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              URL.revokeObjectURL(objectUrl)
              thumbnail.then(thumb => {
                resolve({ compressed: file, thumbnail: thumb, skippedCompression: true })
              }).catch(reject)
              return
            }

            const isWebP = blob.type === 'image/webp'
            if (!isWebP) {
              // Fallback to JPEG
              canvas.toBlob(
                (jpegBlob) => {
                  URL.revokeObjectURL(objectUrl)
                  if (!jpegBlob || jpegBlob.size >= file.size) {
                    thumbnail.then(thumb => {
                      resolve({ compressed: file, thumbnail: thumb, skippedCompression: true })
                    }).catch(reject)
                    return
                  }
                  const ext = '.jpg'
                  const baseName = file.name.replace(/\.[^.]+$/, '')
                  const compressedFile = new File([jpegBlob], baseName + ext, { type: 'image/jpeg' })
                  thumbnail.then(thumb => {
                    resolve({ compressed: compressedFile, thumbnail: thumb, skippedCompression: false })
                  }).catch(reject)
                },
                'image/jpeg',
                0.85
              )
              return
            }

            // WebP succeeded — check if it's smaller
            if (blob.size >= file.size) {
              URL.revokeObjectURL(objectUrl)
              thumbnail.then(thumb => {
                resolve({ compressed: file, thumbnail: thumb, skippedCompression: true })
              }).catch(reject)
              return
            }

            const baseName = file.name.replace(/\.[^.]+$/, '')
            const compressedFile = new File([blob], baseName + '.webp', { type: 'image/webp' })
            URL.revokeObjectURL(objectUrl)
            thumbnail.then(thumb => {
              resolve({ compressed: compressedFile, thumbnail: thumb, skippedCompression: false })
            }).catch(reject)
          },
          'image/webp',
          0.8
        )
      } catch (err) {
        URL.revokeObjectURL(objectUrl)
        reject(err)
      }
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Failed to load image for compression'))
    }

    img.src = objectUrl
  })
}

/**
 * Generate a 200px-wide thumbnail from an image element.
 */
const generateThumbnail = (img: HTMLImageElement, originalName: string): Promise<File> => {
  return new Promise((resolve, reject) => {
    try {
      const maxThumbWidth = 200
      let thumbWidth = Math.min(img.width, maxThumbWidth)
      let thumbHeight = Math.round((img.height / img.width) * thumbWidth)

      const canvas = document.createElement('canvas')
      canvas.width = thumbWidth
      canvas.height = thumbHeight
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, thumbWidth, thumbHeight)

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Thumbnail generation failed'))
            return
          }

          const isWebP = blob.type === 'image/webp'
          if (!isWebP) {
            // Fallback to JPEG
            canvas.toBlob(
              (jpegBlob) => {
                if (!jpegBlob) {
                  reject(new Error('Thumbnail JPEG fallback failed'))
                  return
                }
                const baseName = originalName.replace(/\.[^.]+$/, '')
                resolve(new File([jpegBlob], `${baseName}_thumb.jpg`, { type: 'image/jpeg' }))
              },
              'image/jpeg',
              0.8
            )
            return
          }

          const baseName = originalName.replace(/\.[^.]+$/, '')
          resolve(new File([blob], `${baseName}_thumb.webp`, { type: 'image/webp' }))
        },
        'image/webp',
        0.7
      )
    } catch (err) {
      reject(err)
    }
  })
}
