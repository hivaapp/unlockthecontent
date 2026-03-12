import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const ResetPasswordPage = () => {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const getStrength = (pwd: string) => {
    let score = 0
    if (pwd.length >= 8) score++
    if (pwd.length >= 12) score++
    if (/[A-Z]/.test(pwd)) score++
    if (/[0-9]/.test(pwd)) score++
    if (/[^A-Za-z0-9]/.test(pwd)) score++
    if (score <= 1) return { width: '25%', color: '#C0392B', label: 'Weak' }
    if (score <= 2) return { width: '50%', color: '#A0622A', label: 'Fair' }
    if (score <= 3) return { width: '75%', color: '#3B82F6', label: 'Good' }
    return { width: '100%', color: '#417A55', label: 'Strong' }
  }

  const handleReset = async () => {
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setIsLoading(true)
    setError(null)

    const { error: updateError } = await supabase.auth.updateUser({ password })

    if (updateError) {
      setError(updateError.message)
      setIsLoading(false)
      return
    }

    setSuccess(true)
    setIsLoading(false)

    // Redirect to dashboard after 2 seconds
    setTimeout(() => navigate('/dashboard', { replace: true }), 2000)
  }

  const strength = getStrength(password)

  if (success) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', height: '100vh', padding: '32px',
        fontFamily: 'Söhne, ui-sans-serif, system-ui, sans-serif',
        background: '#FAF9F7',
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
        <h2 style={{ fontSize: '22px', fontWeight: 900, color: '#21201C', margin: '0 0 8px', textAlign: 'center' }}>
          Password updated
        </h2>
        <p style={{ fontSize: '14px', color: '#6B6860', textAlign: 'center' }}>
          Redirecting you to your dashboard...
        </p>
      </div>
    )
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: '100vh', padding: '32px',
      fontFamily: 'Söhne, ui-sans-serif, system-ui, sans-serif',
      background: '#FAF9F7',
    }}>
      <div style={{
        background: 'white', borderRadius: '16px', padding: '32px',
        width: '100%', maxWidth: '400px',
        border: '1px solid #E6E2D9',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <span style={{ fontSize: '24px', fontWeight: 900, color: '#21201C' }}>AdGate</span>
        </div>

        <h1 style={{ fontSize: '22px', fontWeight: 900, color: '#21201C', margin: '0 0 8px' }}>
          Set new password
        </h1>
        <p style={{ fontSize: '13px', color: '#6B6860', margin: '0 0 24px', lineHeight: 1.6 }}>
          Choose a strong password for your account.
        </p>

        {error && (
          <div style={{
            background: '#FDECEA', border: '1px solid #C0392B33',
            borderRadius: '8px', padding: '10px 14px', marginBottom: '16px',
          }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#C0392B' }}>
              ⚠️ {error}
            </span>
          </div>
        )}

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#6B6860', marginBottom: '6px' }}>
            New password
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              style={{
                width: '100%', height: '40px', border: '1px solid #E6E2D9',
                borderRadius: '8px', padding: '0 44px 0 16px',
                fontSize: '15px', color: '#21201C', boxSizing: 'border-box',
                outline: 'none', fontFamily: 'inherit',
                background: 'white',
              }}
              onFocus={e => { e.target.style.borderColor = '#D97757'; e.target.style.boxShadow = '0 0 0 3px rgba(217,119,87,0.1)'; }}
              onBlur={e => { e.target.style.borderColor = '#E6E2D9'; e.target.style.boxShadow = 'none'; }}
            />
            <button
              onClick={() => setShowPassword(s => !s)}
              style={{
                position: 'absolute', right: '0', top: '0',
                width: '44px', height: '40px', border: 'none',
                background: 'transparent', cursor: 'pointer',
                color: '#AAA49C', fontSize: '16px',
              }}
            >
              {showPassword ? '🙈' : '👁'}
            </button>
          </div>

          {password && (
            <div style={{ marginTop: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <div style={{ flex: 1, height: '4px', background: '#F3F1EC', borderRadius: '2px', marginRight: '8px' }}>
                  <div style={{ height: '100%', width: strength.width, background: strength.color, borderRadius: '2px', transition: 'width 300ms ease' }} />
                </div>
                <span style={{ fontSize: '11px', fontWeight: 700, color: strength.color }}>{strength.label}</span>
              </div>
            </div>
          )}
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#6B6860', marginBottom: '6px' }}>
            Confirm password
          </label>
          <input
            type="password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            placeholder="Repeat your new password"
            style={{
              width: '100%', height: '40px',
              border: `1px solid ${confirm && confirm !== password ? '#C0392B' : '#E6E2D9'}`,
              borderRadius: '8px', padding: '0 16px',
              fontSize: '15px', color: '#21201C', boxSizing: 'border-box',
              outline: 'none', fontFamily: 'inherit',
              background: 'white',
            }}
            onFocus={e => { if (!(confirm && confirm !== password)) { e.target.style.borderColor = '#D97757'; e.target.style.boxShadow = '0 0 0 3px rgba(217,119,87,0.1)'; } }}
            onBlur={e => { if (!(confirm && confirm !== password)) { e.target.style.borderColor = '#E6E2D9'; e.target.style.boxShadow = 'none'; } }}
          />
          {confirm && confirm !== password && (
            <p style={{ fontSize: '11px', color: '#C0392B', fontWeight: 700, margin: '4px 0 0' }}>
              Passwords do not match
            </p>
          )}
        </div>

        <button
          onClick={handleReset}
          disabled={isLoading || !password || !confirm || password !== confirm}
          style={{
            width: '100%', height: '40px', background: '#D97757',
            color: 'white', border: 'none', borderRadius: '8px',
            fontSize: '15px', fontWeight: 900, cursor: 'pointer',
            opacity: isLoading || !password || !confirm || password !== confirm ? 0.6 : 1,
          }}
        >
          {isLoading ? 'Updating...' : 'Update Password →'}
        </button>
      </div>
    </div>
  )
}

export default ResetPasswordPage
