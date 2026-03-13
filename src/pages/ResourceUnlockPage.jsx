// src/pages/ResourceUnlockPage.jsx
import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getLinkBySlug, trackLinkView } from '../services/linksService'
import EmailSubscribeUnlock from '../components/unlock/EmailSubscribeUnlock'
import SocialFollowUnlock from '../components/unlock/SocialFollowUnlock'
import SponsorUnlock from '../components/unlock/SponsorUnlock'
import { FollowerPairingUnlock } from '../components/unlock/FollowerPairingUnlock'

// Generate a stable anonymous session key for this browser session
const getAnonSessionKey = () => {
  const key = 'adgate_anon_session'
  let id = sessionStorage.getItem(key)
  if (!id) {
    id = `anon_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`
    sessionStorage.setItem(key, id)
  }
  return id
}

const ResourceUnlockPage = () => {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { currentUser, isLoggedIn } = useAuth()

  const [link, setLink] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const viewTracked = useRef(false)

  // ── Load link data ───────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      try {
        const data = await getLinkBySlug(slug)
        if (!data) {
          setNotFound(true)
        } else {
          setLink(data)
        }
      } catch {
        setNotFound(true)
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [slug])

  // ── Track view once link is loaded ───────────────────────────────────
  useEffect(() => {
    if (!link || viewTracked.current) return
    viewTracked.current = true
    const sessionKey = getAnonSessionKey()
    trackLinkView(link.id, sessionKey, currentUser?.id || null)
  }, [link, currentUser?.id])

  // ── Loading state ────────────────────────────────────────────────────
  if (isLoading) return <UnlockPageSkeleton />

  // ── Not found ────────────────────────────────────────────────────────
  if (notFound) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', minHeight: '100vh', padding: '32px',
        fontFamily: 'Söhne, ui-sans-serif, system-ui, sans-serif',
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔗</div>
        <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#111', margin: '0 0 8px' }}>
          Link not found
        </h2>
        <p style={{ fontSize: '14px', color: '#888', textAlign: 'center', maxWidth: '280px' }}>
          This link may have been removed or the URL is incorrect.
        </p>
        <button
          onClick={() => navigate('/explore')}
          style={{
            marginTop: '24px', background: '#D97757', color: 'white',
            border: 'none', borderRadius: '12px', padding: '12px 24px',
            fontSize: '14px', fontWeight: 900, cursor: 'pointer',
          }}
        >
          Browse resources →
        </button>
      </div>
    )
  }

  // ── Route to correct unlock type ─────────────────────────────────────
  const commonProps = {
    link,
    currentUser,
    isLoggedIn,
    sessionKey: getAnonSessionKey(),
  }

  if (link.mode === 'follower_pairing') {
    return <FollowerPairingUnlock {...commonProps} slug={slug} />
  }

  switch (link.unlock_type) {
    case 'email_subscribe':
      return <EmailSubscribeUnlock {...commonProps} />
    case 'social_follow':
      return <SocialFollowUnlock {...commonProps} />
    case 'custom_sponsor':
      return <SponsorUnlock {...commonProps} />
    default:
      return (
        <div style={{ padding: '40px', textAlign: 'center' }}>
          Unknown unlock type: {link.unlock_type}
        </div>
      )
  }
}

// ── Page skeleton ─────────────────────────────────────────────────────────

const UnlockPageSkeleton = () => (
  <div style={{
    maxWidth: '560px', margin: '0 auto', padding: '32px 16px',
    fontFamily: 'Söhne, ui-sans-serif, system-ui, sans-serif',
  }}>
    {/* Creator row */}
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#F3F1EC' }} />
      <div style={{ height: '14px', width: '120px', background: '#F3F1EC', borderRadius: '6px' }} />
    </div>
    {/* File card */}
    <div style={{ height: '120px', background: '#F3F1EC', borderRadius: '14px', marginBottom: '20px' }} />
    {/* Email input */}
    <div style={{ height: '52px', background: '#F3F1EC', borderRadius: '12px', marginBottom: '12px' }} />
    {/* Button */}
    <div style={{ height: '52px', background: '#F3F1EC', borderRadius: '12px' }} />
  </div>
)

export default ResourceUnlockPage
