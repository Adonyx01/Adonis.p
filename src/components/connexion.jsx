import { useState } from 'react'
import { supabase } from '../lib/supabase'

function normalizeEmail(value) {
  return value.trim().toLowerCase()
}

function authErrorMessage(error) {
  const msg = (error?.message ?? '').toLowerCase()

  if (msg.includes('invalid login credentials') || msg.includes('invalid credentials')) {
    return 'Email ou mot de passe incorrect. Vérifie aussi que tu as bien confirmé ton compte (lien reçu par mail).'
  }
  if (msg.includes('email not confirmed')) {
    return 'Tu dois d’abord confirmer ton email : ouvre le lien reçu par Supabase, puis réessaie de te connecter.'
  }
  if (msg.includes('user already registered')) {
    return 'Ce compte existe déjà. Utilise « Se connecter » ou « Mot de passe oublié » dans le tableau Supabase.'
  }
  if (msg.includes('network') || msg.includes('fetch')) {
    return 'Problème réseau. Vérifie ta connexion et que l’URL du projet dans .env est correcte.'
  }

  return error?.message ?? 'Une erreur est survenue. Réessaie dans un instant.'
}

function Connexion() {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)

  function resetFeedback() {
    setMessage(null)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    resetFeedback()

    const normalized = normalizeEmail(email)

    if (!normalized || !password) {
      setMessage({ type: 'error', text: 'Renseigne un email et un mot de passe.' })
      return
    }

    setLoading(true)

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email: normalized,
          password,
        })
        if (error) {
          setMessage({ type: 'error', text: authErrorMessage(error) })
        }
      } else {
        const { error } = await supabase.auth.signUp({
          email: normalized,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
          },
        })
        if (error) {
          setMessage({ type: 'error', text: authErrorMessage(error) })
        } else {
          setMessage({
            type: 'success',
            text: 'Compte créé. Si la confirmation par email est activée, vérifie ta boîte mail puis connecte-toi avec le même email.',
          })
        }
      }
    } catch (err) {
      setMessage({ type: 'error', text: authErrorMessage(err) })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">{mode === 'login' ? 'Connexion' : 'Inscription'}</h1>
        <p className="auth-subtitle">
          {mode === 'login'
            ? 'Connecte-toi pour accéder à tes tâches.'
            : 'Crée un compte avec ton email.'}
        </p>

        {message && (
          <div className={`auth-message auth-message--${message.type}`} role="alert">
            {message.text}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="auth-label" htmlFor="auth-email">Email</label>
          <input
            id="auth-email"
            className="auth-input"
            type="email"
            autoComplete="email"
            placeholder="toi@exemple.com"
            value={email}
            onChange={e => { setEmail(e.target.value); resetFeedback() }}
          />

          <label className="auth-label" htmlFor="auth-password">Mot de passe</label>
          <input
            id="auth-password"
            className="auth-input"
            type="password"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            placeholder="••••••••"
            value={password}
            onChange={e => { setPassword(e.target.value); resetFeedback() }}
          />

          <button className="auth-btn auth-btn--primary" type="submit" disabled={loading}>
            {loading ? 'Patienter…' : mode === 'login' ? 'Se connecter' : 'Créer un compte'}
          </button>
        </form>

        <p className="auth-switch">
          {mode === 'login' ? (
            <>
              Pas encore de compte ?{' '}
              <button
                type="button"
                className="auth-link"
                onClick={() => { setMode('register'); resetFeedback() }}
              >
                S&apos;inscrire
              </button>
            </>
          ) : (
            <>
              Déjà un compte ?{' '}
              <button
                type="button"
                className="auth-link"
                onClick={() => { setMode('login'); resetFeedback() }}
              >
                Se connecter
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  )
}

export default Connexion
