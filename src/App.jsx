import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import Connexion from './components/connexion'
import TodoApp from './TodoApp.jsx'
import './App.css'

function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Important : enregistrer le listener AVANT getSession() pour ne pas rater
    // une session issue du lien de confirmation (hash / ?code=… dans l’URL).
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setLoading(false)
    })

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="auth-loading">
        <p>Chargement…</p>
      </div>
    )
  }

  if (!session?.user) {
    return <Connexion />
  }

  return <TodoApp key={session.user.id} user={session.user} />
}

export default App
