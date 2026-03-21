// src/pages/ResourceUnlockPage.jsx
import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getLinkBySlug, trackLinkView } from '../services/linksService'
import { ChevronLeft, Lock, Download, CheckCircle2 } from 'lucide-react'
import EmailSubscribeUnlock from '../components/unlock/EmailSubscribeUnlock'
import SocialFollowUnlock from '../components/unlock/SocialFollowUnlock'
import SponsorUnlock from '../components/unlock/SponsorUnlock'
import { FollowerPairingUnlock } from '../components/unlock/FollowerPairingUnlock'

// Generate a stable anonymous viewer ID that persists across sessions
const getAnonViewerId = () => {
  const key = 'utc_viewer_id'
  let id = localStorage.getItem(key)
  if (!id) {
    id = `anon_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`
    localStorage.setItem(key, id)
  }
  return id
}

// Check if we already tracked a view for a specific link today
const hasTrackedViewToday = (linkId) => {
  const key = `utc_view_${linkId}`
  const ts = localStorage.getItem(key)
  if (!ts) return false
  // 24 hour window
  return (Date.now() - parseInt(ts, 10)) < 24 * 60 * 60 * 1000
}

const markViewTracked = (linkId) => {
  localStorage.setItem(`utc_view_${linkId}`, Date.now().toString())
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
    // Don't re-count if same browser already viewed this link today
    if (hasTrackedViewToday(link.id)) return
    viewTracked.current = true
    const viewerId = getAnonViewerId()
    markViewTracked(link.id)
    trackLinkView(link.id, viewerId, currentUser?.id || null)
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

  const handleUnlockSuccess = () => {
    setLink(prev => ({ ...prev, is_unlocked: true }))
  }

  // ── Route to correct unlock type ─────────────────────────────────────
  const commonProps = {
    link,
    currentUser,
    isLoggedIn,
    sessionKey: getAnonViewerId(),
    onUnlockSuccess: handleUnlockSuccess,
  }

  const renderContent = () => {
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

  const getViralCopy = (unlockType) => {
    switch (unlockType) {
      case 'email_subscribe':
        return {
          title: "You just grew their email list.",
          subtitle: "Want to collect deeply engaged emails for your own content?"
        };
      case 'social_follow':
        return {
          title: "You just boosted their follower count.",
          subtitle: "Want to grow your own audience on autopilot?"
        };
      case 'custom_sponsor':
        return {
          title: "They just got paid for you unlocking this.",
          subtitle: "Want to start monetizing your free content with sponsors?"
        };
      case 'follower_pairing':
        return {
          title: "You just joined an accountable community.",
          subtitle: "Build your own community challenges around your content."
        };
      default:
        return {
          title: "Want to grow your audience automatically?",
          subtitle: "Join creators earning with UnlockTheContent."
        };
    }
  };

  const viralData = link ? getViralCopy(link.unlock_type || link.mode) : null;

  return (
    <div style={{ background: '#FAF9F7', minHeight: '100vh' }}>
      <header style={{
        width: '100%',
        height: '64px',
        background: 'rgba(250, 249, 247, 0.9)',
        backdropFilter: 'blur(8px)',
        borderBottom: '1px solid #E6E2D9',
        display: 'flex',
        alignItems: 'center',
        padding: '0 24px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <button 
          onClick={() => navigate(-1)} 
          style={{
            width: '44px',
            height: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'white',
            border: '1px solid #E6E2D9',
            borderRadius: '12px',
            marginRight: '12px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#F3F1EC';
            e.currentTarget.style.borderColor = '#D97757';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'white';
            e.currentTarget.style.borderColor = '#E6E2D9';
          }}
        >
          <ChevronLeft size={20} color="#21201C" />
        </button>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', flex: 1 }}>
          <div style={{
            width: '24px',
            height: '24px',
            borderRadius: '8px',
            background: '#D97757',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 900,
            fontSize: '9px',
          }}>UC</div>
          <span style={{
            fontSize: '15px',
            fontWeight: 900,
            color: '#21201C',
            letterSpacing: '-0.4px',
          }}>UnlockTheContent</span>
        </Link>


      </header>
      
      <main style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: (link.is_unlocked && link.mode !== 'follower_pairing') ? 'center' : 'flex-start',
        padding: link.mode === 'follower_pairing' ? '0' : '24px 20px',
        maxWidth: link.mode === 'follower_pairing' ? 'none' : '600px',
        margin: '0 auto',
        width: '100%',
        boxSizing: 'border-box',
        overflowY: 'auto', // For small devices if height is too low
        scrollbarWidth: 'none',
      }}>
        {/* Visual Content Preview */}
        {link.mode !== 'follower_pairing' && !link.is_unlocked && (
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 0, // Allow shrinking
            padding: '16px 0',
          }}>
            <div style={{
              width: '100%',
              maxWidth: '380px',
              aspectRatio: '1.6 / 1',
              background: '#FFFFFF',
              borderRadius: '40px',
              border: '1px solid #E6E2D9',
              boxShadow: '0 8px 32px rgba(0,0,0,0.04)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden',
            }}>
              {/* Shimmer Overlay */}
              {!link.is_unlocked && (
                 <div className="absolute inset-0 opacity-10" style={{
                   background: 'linear-gradient(90deg, transparent, #D97757, transparent)',
                   backgroundSize: '200% 100%',
                   animation: 'shimmer 2s infinite linear',
                 }} />
              )}

              <div style={{
                width: 'clamp(48px, 12vh, 80px)', // Scale down icon on small screens
                height: 'clamp(48px, 12vh, 80px)',
                borderRadius: '24px',
                background: link.is_unlocked ? '#EBF5EE' : '#FAF9F7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '12px',
                zIndex: 1,
                border: `1px solid ${link.is_unlocked ? '#BBF7D0' : '#E6E2D9'}`,
              }}>
                {link.is_unlocked ? (
                  <div style={{ fontSize: 'clamp(24px, 5vh, 40px)' }}>📦</div>
                ) : (
                  <Lock size={32} color="#D97757" strokeWidth={2.5} style={{ transform: 'scale(1)' }} />
                )}
              </div>

              <div style={{ zIndex: 1, textAlign: 'center', padding: '0 24px' }}>
                 <h2 style={{ fontSize: '18px', fontWeight: 900, color: '#21201C', margin: '0' }}>
                   {link.title}
                 </h2>
              </div>
            </div>


          </div>
        )}

        {/* Interaction Zone */}
        {link.mode === 'follower_pairing' ? (
          renderContent()
        ) : (
          <div style={{
            width: '100%',
            background: 'white',
            borderRadius: '24px',
            border: '1px solid #E6E2D9',
            padding: '20px',
            boxSizing: 'border-box',
            boxShadow: '0 -4px 20px rgba(0,0,0,0.02)',
            flexShrink: 0,
          }}>
             {renderContent()}
          </div>
        )}

        {/* Viral PLG Banner (Post-Unlock) */}
        {link?.is_unlocked && link?.mode !== 'follower_pairing' && viralData && (
          <div style={{
            marginTop: '24px',
            width: '100%',
            background: '#FAF0EB',
            border: '1px solid rgba(217, 119, 87, 0.3)',
            borderRadius: '16px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', top: 0, right: 0, background: '#D97757', color: 'white',
              fontSize: '10px', fontWeight: 800, padding: '4px 10px', borderBottomLeftRadius: '12px',
              textTransform: 'uppercase', letterSpacing: '0.5px'
            }}>
              Powered by UnlockTheContent
            </div>
            <h3 style={{ fontWeight: 900, fontSize: '18px', color: '#111', margin: '14px 0 6px', letterSpacing: '-0.3px', lineHeight: 1.2 }}>
              {viralData.title}
            </h3>
            <p style={{ fontSize: '14px', fontWeight: 700, color: '#D97757', margin: '0 0 20px', maxWidth: '300px', lineHeight: 1.4 }}>
              {viralData.subtitle}
            </p>
            <Link to="/signup" style={{
              width: '100%', background: '#D97757', color: 'white', fontWeight: 900, fontSize: '15px',
              height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              textDecoration: 'none', transition: 'all 0.2s',
              boxShadow: '0 2px 4px rgba(217,119,87,0.2)'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.02)'; e.currentTarget.style.background = '#C4663F'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = '#D97757'; }}
            >
              Lock Your First File Free
            </Link>
          </div>
        )}

        {/* Secondary Actions */}
        {!link.is_unlocked && link.mode !== 'follower_pairing' && (
          <div style={{ 
            marginTop: '32px', 
            padding: '0 12px',
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center', 
            gap: '16px',
            width: '100%',
            textAlign: 'center'
          }}>
            <Link 
              to={`/@${link?.creator?.username || link?.creatorHandle}`}
              style={{
                fontSize: '13px',
                fontWeight: 700,
                color: '#6B6860',
                textDecoration: 'none',
                padding: '10px 16px',
                borderRadius: '12px',
                border: '1px solid #E6E2D9',
                background: 'white',
                transition: 'all 0.2s'
              }}
            >
              View more from this creator →
            </Link>
            
            <div style={{ fontSize: '12px', color: '#AAA49C', fontWeight: 600 }}>
              Create your own link? <Link to="/signup" style={{ color: '#D97757', textDecoration: 'none', fontWeight: 700 }}>Get started free</Link>
            </div>
          </div>
        )}
      </main>

      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  )
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
