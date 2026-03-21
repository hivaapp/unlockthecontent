import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const stripeProLink = import.meta.env.VITE_STRIPE_PRO_LINK || 'https://buy.stripe.com/test_00weVfdKm42Agwj4QafIs00';

/** If the user had clicked "Start Pro" before signing up, redirect to Stripe instead of dashboard */
const maybeRedirectToStripe = (session: { user: { id: string; email?: string } }): boolean => {
  if (localStorage.getItem('pendingProUpgrade') === 'true') {
    localStorage.removeItem('pendingProUpgrade');
    const url = `${stripeProLink}?client_reference_id=${session.user.id}&prefilled_email=${encodeURIComponent(session.user.email || '')}`;
    window.location.href = url;
    return true;
  }
  return false;
}

const AuthCallbackPage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleCallback = async () => {
      const hashParams = new URLSearchParams(window.location.hash.replace('#', ''))
      const type = hashParams.get('type') || searchParams.get('type')
      const errorParam = hashParams.get('error_description') || searchParams.get('error_description')

      if (errorParam) {
        setError(decodeURIComponent(errorParam))
        return
      }

      // Wait for Supabase to process the session from the URL
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()

      if (sessionError) {
        setError(sessionError.message)
        return
      }

      if (type === 'recovery') {
        navigate('/reset-password', { replace: true })
        return
      }

      if (type === 'signup' || type === 'email_change') {
        // Email confirmed — check for pending Pro upgrade first
        if (session && maybeRedirectToStripe(session)) return;
        navigate('/dashboard', { replace: true })
        return
      }

      if (session) {
        // OAuth or magic link — check for pending Pro upgrade first
        if (maybeRedirectToStripe(session)) return;

        const { data: userProfile } = await supabase
          .from('users')
          .select('username, is_creator')
          .eq('id', session.user.id)
          .single()

        if (userProfile?.is_creator) {
          navigate('/dashboard', { replace: true })
        } else {
          navigate('/', { replace: true })
        }
        return
      }

      // Fallback
      navigate('/', { replace: true })
    }

    handleCallback()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (error) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', height: '100vh', padding: '32px',
        fontFamily: 'Söhne, ui-sans-serif, system-ui, sans-serif',
        background: '#FAF9F7',
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
        <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#21201C', margin: '0 0 8px' }}>
          Link expired or invalid
        </h2>
        <p style={{ fontSize: '14px', color: '#6B6860', textAlign: 'center', maxWidth: '320px', margin: '0 0 24px' }}>
          {error}
        </p>
        <button
          onClick={() => navigate('/')}
          style={{
            background: '#D97757', color: 'white', border: 'none',
            padding: '12px 24px', borderRadius: '10px',
            fontSize: '14px', fontWeight: 800, cursor: 'pointer',
          }}
        >
          Go to UnlockTheContent →
        </button>
      </div>
    )
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', height: '100vh',
      fontFamily: 'Söhne, ui-sans-serif, system-ui, sans-serif',
      background: '#FAF9F7',
    }}>
      <div style={{
        width: '40px', height: '40px', border: '3px solid #E6E2D9',
        borderTopColor: '#D97757', borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <p style={{ marginTop: '16px', fontSize: '14px', color: '#6B6860', fontWeight: 600 }}>
        Signing you in...
      </p>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}

export default AuthCallbackPage
