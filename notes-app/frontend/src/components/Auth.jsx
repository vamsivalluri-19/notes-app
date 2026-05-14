import React, { useState } from 'react'
import axios from 'axios'

export default function Auth({ API, onLogin }){
  const [mode, setMode] = useState('login')
  const [loginRole, setLoginRole] = useState('student')
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('student')
  const [error, setError] = useState(null)

  const submit = async (e) => {
    e.preventDefault()
    try{
      if(mode === 'login'){
        const res = await axios.post(`${API}/api/auth/login`, { email, password })
        const user = res.data.user || {}
        const normalizedUser = { ...user, role: user.role || loginRole }
        onLogin(res.data.token, normalizedUser)
      } else {
        const res = await axios.post(`${API}/api/auth/register`, { username, email, password, role })
        onLogin(res.data.token, res.data.user)
      }
    }catch(err){
      setError(err?.response?.data?.message || 'Auth failed')
    }
  }

  return (
    <div className="auth-shell auth-shell--simple">
      <div className="auth-card auth-card--simple">
        <div className="auth-image" aria-hidden="true">
          <svg viewBox="0 0 560 220" role="img" aria-label="Student and staff login illustration">
            <defs>
              <linearGradient id="authGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#60a5fa" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
            </defs>
            <rect x="18" y="18" width="524" height="184" rx="28" fill="url(#authGlow)" opacity="0.16" />
            <circle cx="138" cy="108" r="42" fill="#dbeafe" />
            <path d="M102 114c8-24 56-30 72-4 4 7 6 16 6 25v13H96v-10c0-9 2-18 6-24z" fill="#2563eb" />
            <circle cx="127" cy="104" r="5" fill="#0f172a" />
            <circle cx="150" cy="104" r="5" fill="#0f172a" />
            <path d="M129 120c5 4 10 4 16 0" stroke="#0f172a" strokeWidth="4" strokeLinecap="round" fill="none" />

            <circle cx="420" cy="108" r="42" fill="#dcfce7" />
            <path d="M384 114c8-24 56-30 72-4 4 7 6 16 6 25v13h-84v-10c0-9 2-18 6-24z" fill="#059669" />
            <circle cx="409" cy="104" r="5" fill="#0f172a" />
            <circle cx="432" cy="104" r="5" fill="#0f172a" />
            <path d="M411 120c5 4 10 4 16 0" stroke="#0f172a" strokeWidth="4" strokeLinecap="round" fill="none" />

            <rect x="214" y="64" width="132" height="92" rx="18" fill="#ffffff" opacity="0.9" />
            <path d="M234 96h92" stroke="#93c5fd" strokeWidth="8" strokeLinecap="round" />
            <path d="M234 118h64" stroke="#a7f3d0" strokeWidth="8" strokeLinecap="round" />
            <circle cx="280" cy="66" r="12" fill="#fbbf24" opacity="0.95" />
          </svg>
        </div>

        <div className="auth-copy auth-copy--simple">
          <p className="auth-kicker">School Notes Portal</p>
          <h1>{mode === 'login' ? 'Login' : 'Register'}</h1>
          <p className="auth-description">Enter your login details below.</p>

          {mode === 'login' && (
            <div className="auth-role-toggle" role="tablist" aria-label="Login role">
              <button type="button" className={`role-pill ${loginRole === 'student' ? 'active' : ''}`} onClick={()=>setLoginRole('student')}>Student</button>
              <button type="button" className={`role-pill ${loginRole === 'staff' ? 'active' : ''}`} onClick={()=>setLoginRole('staff')}>Staff</button>
            </div>
          )}
        </div>

        <form onSubmit={submit} className="auth-form">
          {mode === 'register' && (
            <input required placeholder="Username" value={username} onChange={e=>setUsername(e.target.value)} />
          )}
          <input required placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
          <input required type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} />

          {mode === 'register' && (
            <select value={role} onChange={e=>setRole(e.target.value)}>
              <option value="student">Student</option>
              <option value="staff">Staff</option>
            </select>
          )}

          <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
            <button className="btn-primary" type="submit">{mode === 'login' ? `Login as ${loginRole}` : 'Register'}</button>
            <button type="button" className="btn-secondary" onClick={()=>setMode(m=>m==='login' ? 'register' : 'login')}>{mode==='login' ? 'Switch to Register' : 'Switch to Login'}</button>
          </div>
          {error && <div style={{color:'var(--danger)'}}>{error}</div>}
        </form>
      </div>
    </div>
  )
}
