// supabase/functions/generate-upload-url/index.ts
// ---------------------------------------------------------------------------
// CHAT MEDIA ADDITIONS — the two blocks below must be ADDED to the existing
// generate-upload-url Edge Function (already deployed). They do NOT replace
// any existing code. Paste them into the places indicated.
//
// === ADDITION 1: Add to FILE_RULES object ===
// Add this entry after the existing `assets` entry:
//
//   chat_media: {
//     allowedMimeTypes: [
//       'image/jpeg', 'image/png', 'image/gif', 'image/webp',
//       'video/mp4', 'video/quicktime', 'video/webm',
//       'application/pdf',
//       'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
//       'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
//       'application/vnd.openxmlformats-officedocument.presentationml.presentation',
//       'text/plain',
//       'audio/mpeg', 'audio/mp4', 'audio/wav',
//     ],
//     // maxSizeBytes is determined dynamically based on user plan
//   },
//
// === ADDITION 2: New handler block ===
// Add the following BEFORE the existing `// ── Validate bucket` line
// (around line 542 of the original R2.txt reference).
//
// ────────────────────────────────────────────────────────────────────────────
// CHAT MEDIA HANDLER
// ────────────────────────────────────────────────────────────────────────────
//
// When purpose is 'chat_media' or 'chat_media_with_thumbnail', use
// plan-aware key prefixing and return isPro in the response.
//
// --- purpose: 'chat_media' ---
//
//   if (body.purpose === 'chat_media') {
//     const { data: userData } = await supabase.from('users').select('is_pro').eq('id', user.id).single()
//     const isPro = userData?.is_pro || false
//     const maxSize = isPro ? 104857600 : 10485760 // 100MB vs 10MB
//
//     // Validate MIME
//     const chatRules = FILE_RULES.chat_media
//     if (!chatRules.allowedMimeTypes.includes(body.mimeType)) {
//       return Response.json({ error: 'File type not supported.' }, { status: 400 })
//     }
//     // Validate size
//     if (body.sizeBytes > maxSize) {
//       return Response.json({ error: 'File too large', maxSize, isPro }, { status: 400 })
//     }
//     if (body.sizeBytes <= 0) {
//       return Response.json({ error: 'File size must be greater than 0.' }, { status: 400 })
//     }
//
//     const prefix = isPro ? 'chat/perm/' : 'chat/temp/'
//     const timestamp = Date.now()
//     const random = Math.random().toString(36).substring(2, 10)
//     const ext = body.fileName.includes('.') ? '.' + body.fileName.split('.').pop()!.toLowerCase() : ''
//     const r2Key = `${prefix}${user.id}/${timestamp}-${random}${ext}`
//     const r2Bucket = BUCKETS.assets
//
//     const { data: fileRecord, error: dbError } = await supabase
//       .from('files')
//       .insert({
//         owner_id: user.id,
//         r2_key: r2Key,
//         r2_bucket: r2Bucket,
//         original_name: body.fileName,
//         file_type: getFileType(body.mimeType),
//         mime_type: body.mimeType,
//         size_bytes: body.sizeBytes,
//         is_placeholder: true,
//       })
//       .select('id')
//       .single()
//
//     if (dbError) {
//       return Response.json({ error: 'Failed to create file record.' }, { status: 500 })
//     }
//
//     const presignedUrl = await generatePresignedPutUrl({
//       bucket: r2Bucket,
//       key: r2Key,
//       contentType: body.mimeType,
//       expiresInSeconds: 3600,
//     })
//
//     return Response.json({
//       fileId: fileRecord.id,
//       r2Key,
//       presignedUrl,
//       isPro,
//       expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
//     }, {
//       headers: { 'Access-Control-Allow-Origin': '*' },
//     })
//   }
//
// --- purpose: 'chat_media_with_thumbnail' ---
//
//   if (body.purpose === 'chat_media_with_thumbnail') {
//     const { mainFile, thumbnailFile } = body
//     if (!mainFile || !thumbnailFile) {
//       return Response.json({ error: 'mainFile and thumbnailFile are required' }, { status: 400 })
//     }
//
//     const { data: userData } = await supabase.from('users').select('is_pro').eq('id', user.id).single()
//     const isPro = userData?.is_pro || false
//     const maxSize = isPro ? 104857600 : 10485760
//
//     const chatRules = FILE_RULES.chat_media
//     if (!chatRules.allowedMimeTypes.includes(mainFile.contentType)) {
//       return Response.json({ error: 'File type not supported.' }, { status: 400 })
//     }
//     if (mainFile.fileSize > maxSize) {
//       return Response.json({ error: 'File too large', maxSize, isPro }, { status: 400 })
//     }
//
//     const prefix = isPro ? 'chat/perm/' : 'chat/temp/'
//     const timestamp = Date.now()
//     const random = Math.random().toString(36).substring(2, 10)
//     const mainExt = mainFile.fileName.includes('.')
//       ? '.' + mainFile.fileName.split('.').pop()!.toLowerCase() : ''
//     const thumbExt = thumbnailFile.fileName.includes('.')
//       ? '.' + thumbnailFile.fileName.split('.').pop()!.toLowerCase() : ''
//
//     const mainR2Key = `${prefix}${user.id}/${timestamp}-${random}${mainExt}`
//     const thumbnailR2Key = `${prefix}${user.id}/${timestamp}-${random}_thumb${thumbExt}`
//     const r2Bucket = BUCKETS.assets
//
//     // Insert both file records
//     const [mainInsert, thumbInsert] = await Promise.all([
//       supabase.from('files').insert({
//         owner_id: user.id,
//         r2_key: mainR2Key,
//         r2_bucket: r2Bucket,
//         original_name: mainFile.fileName,
//         file_type: getFileType(mainFile.contentType),
//         mime_type: mainFile.contentType,
//         size_bytes: mainFile.fileSize,
//         is_placeholder: true,
//       }).select('id').single(),
//       supabase.from('files').insert({
//         owner_id: user.id,
//         r2_key: thumbnailR2Key,
//         r2_bucket: r2Bucket,
//         original_name: thumbnailFile.fileName,
//         file_type: 'image',
//         mime_type: thumbnailFile.contentType,
//         size_bytes: thumbnailFile.fileSize,
//         is_placeholder: true,
//       }).select('id').single(),
//     ])
//
//     if (mainInsert.error || thumbInsert.error) {
//       return Response.json({ error: 'Failed to create file records.' }, { status: 500 })
//     }
//
//     // Generate both presigned URLs
//     const [mainUrl, thumbUrl] = await Promise.all([
//       generatePresignedPutUrl({
//         bucket: r2Bucket, key: mainR2Key,
//         contentType: mainFile.contentType, expiresInSeconds: 3600,
//       }),
//       generatePresignedPutUrl({
//         bucket: r2Bucket, key: thumbnailR2Key,
//         contentType: thumbnailFile.contentType, expiresInSeconds: 3600,
//       }),
//     ])
//
//     return Response.json({
//       mainFileId: mainInsert.data.id,
//       mainR2Key,
//       mainPresignedUrl: mainUrl,
//       thumbnailFileId: thumbInsert.data.id,
//       thumbnailR2Key,
//       thumbnailPresignedUrl: thumbUrl,
//       isPro,
//       expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
//     }, {
//       headers: { 'Access-Control-Allow-Origin': '*' },
//     })
//   }
//
// ────────────────────────────────────────────────────────────────────────────

export {} // makes the file a module so TS doesn't complain
