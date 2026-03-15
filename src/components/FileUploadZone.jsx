// src/components/FileUploadZone.jsx
import { useState, useRef, useCallback } from 'react'
import { uploadFile, validateFile, formatFileSize, getFileEmoji } from '../services/uploadService'

const STAGE_LABELS = {
  validating:  'Checking file...',
  preparing:   'Preparing upload...',
  uploading:   'Uploading...',
  confirming:  'Finishing...',
  complete:    'Upload complete',
}

const FileUploadZone = ({
  bucket = 'content',
  onUploadComplete,   // ({ fileId, r2Key, originalName, mimeType, sizeBytes }) => void
  onUploadError,      // (errorMessage) => void
  onRemove,           // () => void
  accept,             // optional MIME type string e.g. "video/*"
  maxFiles = 1,
  label = 'Drag a file or tap to attach',
  sublabel,
  currentFile,        // { originalName, sizeBytes, mimeType } — for showing existing file
  disabled = false,
  isAuthenticated = true,
  onPendingFile,      // (file) => void
}) => {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [stage, setStage] = useState(null)
  const [error, setError] = useState(null)
  const inputRef = useRef(null)
  const abortRef = useRef(null)

  const handleFile = useCallback(async (file) => {
    setError(null)

    // Client-side validation
    const validation = validateFile(file, bucket)
    if (!validation.valid) {
      setError(validation.error)
      onUploadError?.(validation.error)
      return
    }

    if (!isAuthenticated) {
      // Defer upload
      onPendingFile?.(file);
      onUploadComplete?.({ 
        originalName: file.name, 
        sizeBytes: file.size, 
        mimeType: file.type,
        fileId: null,
      });
      return;
    }

    setIsUploading(true)
    setProgress(0)
    setStage('preparing')

    // Create abort controller for cancellation
    abortRef.current = new AbortController()

    try {
      const result = await uploadFile(file, bucket, {
        onProgress: setProgress,
        onStageChange: setStage,
        signal: abortRef.current.signal,
      })
      onUploadComplete?.(result)
    } catch (err) {
      if (err.message !== 'Upload cancelled.') {
        setError(err.message)
        onUploadError?.(err.message)
      }
    } finally {
      setIsUploading(false)
      setStage(null)
      abortRef.current = null
    }
  }, [bucket, onUploadComplete, onUploadError, isAuthenticated, onPendingFile])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file && !disabled) handleFile(file)
  }, [handleFile, disabled])

  const handleDragOver = (e) => {
    e.preventDefault()
    if (!disabled) setIsDragging(true)
  }

  const handleDragLeave = () => setIsDragging(false)

  const handleInputChange = (e) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    // Reset input so same file can be re-selected
    e.target.value = ''
  }

  const handleCancel = () => {
    abortRef.current?.abort()
    setIsUploading(false)
    setProgress(0)
    setStage(null)
  }

  const handleRemove = () => {
    setError(null)
    onRemove?.()
  }

  // ── Existing file state ──────────────────────────────────────────────
  if (currentFile && !isUploading) {
    return (
      <div style={{
        border: '1px solid #E6E2D9', borderRadius: '12px',
        padding: '14px 16px', background: '#FFFFFF',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '28px' }}>
            {getFileEmoji(currentFile.originalName, currentFile.mimeType)}
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: '14px', fontWeight: 700, color: '#21201C',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              fontFamily: 'Söhne, ui-sans-serif, system-ui, sans-serif',
            }}>
              {currentFile.originalName}
            </div>
            <div style={{
              fontSize: '12px', color: '#6B6860', fontWeight: 500, marginTop: '2px',
              fontFamily: 'Söhne, ui-sans-serif, system-ui, sans-serif',
            }}>
              {formatFileSize(currentFile.sizeBytes)}
            </div>
          </div>
          {!disabled && (
            <button
              onClick={handleRemove}
              style={{
                width: '32px', height: '32px', borderRadius: '50%',
                border: '1px solid #E6E2D9', background: '#FFFFFF',
                cursor: 'pointer', fontSize: '14px', color: '#6B6860',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>
    )
  }

  // ── Uploading state ──────────────────────────────────────────────────
  if (isUploading) {
    return (
      <div style={{
        border: '1px solid #E6E2D9', borderRadius: '12px',
        padding: '20px 16px', background: '#FFFFFF',
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', marginBottom: '10px',
          fontFamily: 'Söhne, ui-sans-serif, system-ui, sans-serif',
        }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#21201C' }}>
            {STAGE_LABELS[stage] || 'Uploading...'}
          </span>
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#D97757' }}>
            {progress}%
          </span>
        </div>

        {/* Progress bar */}
        <div style={{
          height: '6px', background: '#F3F1EC', borderRadius: '3px', overflow: 'hidden',
        }}>
          <div style={{
            height: '100%', width: `${progress}%`,
            background: '#D97757', borderRadius: '3px',
            transition: 'width 200ms ease',
          }} />
        </div>

        <button
          onClick={handleCancel}
          style={{
            marginTop: '12px', fontSize: '12px', fontWeight: 600,
            color: '#AAA49C', background: 'none', border: 'none',
            cursor: 'pointer', padding: '0',
            fontFamily: 'Söhne, ui-sans-serif, system-ui, sans-serif',
          }}
        >
          Cancel upload
        </button>
      </div>
    )
  }

  // ── Drop zone state ──────────────────────────────────────────────────
  return (
    <div>
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !disabled && inputRef.current?.click()}
        style={{
          border: `1.5px dashed ${isDragging ? '#D97757' : error ? '#C0392B' : '#E6E2D9'}`,
          borderRadius: '12px',
          padding: '24px 16px',
          background: isDragging ? '#FAF0EB' : '#FFFFFF',
          cursor: disabled ? 'not-allowed' : 'pointer',
          transition: 'all 200ms ease',
          textAlign: 'center',
          opacity: disabled ? 0.5 : 1,
          fontFamily: 'Söhne, ui-sans-serif, system-ui, sans-serif',
        }}
      >
        <div style={{ fontSize: '32px', marginBottom: '8px' }}>📎</div>
        <div style={{ fontSize: '14px', fontWeight: 700, color: '#21201C' }}>{label}</div>
        {sublabel && (
          <div style={{ fontSize: '12px', color: '#AAA49C', fontWeight: 500, marginTop: '4px' }}>
            {sublabel}
          </div>
        )}
      </div>

      {error && (
        <div style={{
          marginTop: '8px', padding: '10px 14px',
          background: '#FDECEA', border: '1px solid #C0392B20',
          borderRadius: '8px',
        }}>
          <span style={{
            fontSize: '12px', fontWeight: 600, color: '#C0392B',
            fontFamily: 'Söhne, ui-sans-serif, system-ui, sans-serif',
          }}>
            ⚠️ {error}
          </span>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleInputChange}
        style={{ display: 'none' }}
        disabled={disabled}
      />
    </div>
  )
}

export default FileUploadZone
