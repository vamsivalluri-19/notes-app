import React, { useEffect, useState } from 'react'
import Auth from './components/Auth'
import NoteList from './components/NoteList'
import NoteForm from './components/NoteForm'
import FileUpload from './components/FileUpload'
import FileList from './components/FileList'
import Toast from './components/Toast'
import Spinner from './components/Spinner'
import axios from 'axios'

const DEFAULT_API = 'https://notes-app-44s0.onrender.com'
const envApi = import.meta.env.VITE_API_URL || ''
const API = (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(envApi)
  ? DEFAULT_API
  : (envApi || DEFAULT_API)
).replace(/\/$/, '')

export default function CleanApp(){
  const [authUser, setAuthUser] = useState(() => JSON.parse(localStorage.getItem('user') || 'null'))
  const [token, setToken] = useState(() => localStorage.getItem('token') || null)
  const [pageView, setPageView] = useState(() => {
    const savedUser = JSON.parse(localStorage.getItem('user') || 'null')
    if (savedUser?.role === 'staff') return 'staff'
    if (savedUser?.role === 'student') return 'student'
    return 'login'
  })
  const [notes, setNotes] = useState([])
  const [students, setStudents] = useState([])
  const [staffFilesVersion, setStaffFilesVersion] = useState(0)
  const [noteSearch, setNoteSearch] = useState('')
  const [noteAudience, setNoteAudience] = useState('all')
  const [notePinnedOnly, setNotePinnedOnly] = useState(false)
  const [favorites, setFavorites] = useState(() => {
    const savedUser = JSON.parse(localStorage.getItem('user') || 'null')
    const saved = localStorage.getItem(`favorites:${savedUser?.id || 'guest'}`)
    return new Set(JSON.parse(saved || '[]'))
  })
  const [loading, setLoading] = useState(false)
  const [rosterLoading, setRosterLoading] = useState(false)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token)
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    } else {
      localStorage.removeItem('token')
      delete axios.defaults.headers.common['Authorization']
    }

    if (authUser) localStorage.setItem('user', JSON.stringify(authUser))
    else localStorage.removeItem('user')
  }, [token, authUser])

  useEffect(() => {
    const favoritesKey = `favorites:${authUser?.id || 'guest'}`
    localStorage.setItem(favoritesKey, JSON.stringify(Array.from(favorites)))
  }, [favorites, authUser])

  const authHeaders = () => (token ? { headers: { Authorization: `Bearer ${token}` } } : {})

  const onLogin = (nextToken, nextUser) => {
    const role = nextUser?.role === 'staff' ? 'staff' : 'student'
    setToken(nextToken)
    setAuthUser(nextUser)
    setPageView(role)
  }

  const logout = () => {
    setToken(null)
    setAuthUser(null)
    setPageView('login')
    setNotes([])
    setStudents([])
    setStaffFilesVersion(0)
    setFavorites(new Set())
    setNoteSearch('')
    setNoteAudience('all')
    setNotePinnedOnly(false)
  }

  const fetchNotes = async () => {
    setLoading(true)
    try {
      const params = {
        search: noteSearch || undefined,
        pinned: notePinnedOnly ? 'true' : undefined,
        tags: undefined
      }

      if (noteAudience !== 'all') {
        params.audience = noteAudience
      }

      const res = await axios.get(`${API}/api/notes`, { ...authHeaders(), params })
      if (res.data && res.data.notes) {
        setNotes(res.data.notes)
      } else if (Array.isArray(res.data)) {
        setNotes(res.data)
      }
    } catch (err) {
      setToast({
        type: 'error',
        message: err?.response?.data?.message || 'Failed to fetch notes'
      })
    } finally {
      setLoading(false)
    }
  }

  const toggleFavorite = (noteId) => {
    setFavorites((current) => {
      const next = new Set(current)
      if (next.has(noteId)) next.delete(noteId)
      else next.add(noteId)
      return next
    })
  }

  const exportNotes = async () => {
    try {
      const response = await axios.get(`${API}/api/notes/export`, {
        ...authHeaders(),
        params: { format: 'csv', search: noteSearch || undefined, pinned: notePinnedOnly ? 'true' : undefined },
        responseType: 'blob'
      })
      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.href = url
      link.download = 'notes-export.csv'
      link.click()
      URL.revokeObjectURL(url)
      setToast({ type: 'success', message: 'Notes exported' })
    } catch (err) {
      setToast({
        type: 'error',
        message: err?.response?.data?.message || 'Failed to export notes'
      })
    }
  }

  const fetchStudents = async () => {
    if (authUser?.role !== 'staff') return
    setRosterLoading(true)
    try {
      const res = await axios.get(`${API}/api/users/students`, authHeaders())
      setStudents(res.data?.students || [])
    } catch (err) {
      setToast({
        type: 'error',
        message: err?.response?.data?.message || 'Failed to fetch students'
      })
    } finally {
      setRosterLoading(false)
    }
  }

  const createNote = async (payload) => {
    await axios.post(`${API}/api/notes`, payload, authHeaders())
    setToast({ type: 'success', message: 'Note sent' })
    await fetchNotes()
  }

  const updateNote = async (id, payload) => {
    await axios.put(`${API}/api/notes/${id}`, payload, authHeaders())
    setToast({ type: 'success', message: 'Note updated' })
    await fetchNotes()
  }

  const deleteNote = async (id) => {
    await axios.delete(`${API}/api/notes/${id}`, authHeaders())
    setToast({ type: 'success', message: 'Note deleted' })
    await fetchNotes()
  }

  useEffect(() => {
    if (token && pageView !== 'login') {
      fetchNotes()
      fetchStudents()
    }
  }, [token, pageView, noteSearch, noteAudience, notePinnedOnly])

  const isLoggedIn = !!authUser && !!token && pageView !== 'login'
  const isStaff = authUser?.role === 'staff'

  return (
    <div className="app-root">
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
      {isLoggedIn ? (
        <>
          {/* HEADER */}
          <header className="header" style={{borderBottom: '1px solid var(--border)'}}>
            <div className="header-left">
              <h1 className="logo">📝 School Notes Portal</h1>
            </div>
            <div className="controls" style={{display: 'flex', alignItems: 'center', gap: '16px'}}>
              <div style={{textAlign: 'right'}}>
                <p style={{margin: '0 0 4px 0', fontSize: '14px', color: 'var(--text-muted)'}}>
                  Logged in as
                </p>
                <p style={{margin: 0, fontWeight: '600'}}>
                  {authUser?.username}
                </p>
                <span style={{fontSize: '12px', color: 'var(--text-muted)'}}>
                  {authUser?.role === 'staff' ? '👨‍🏫 Staff' : '👨‍🎓 Student'}
                </span>
              </div>
              <button className="btn-danger" onClick={logout}>
                Logout
              </button>
            </div>
          </header>

          {/* MAIN CONTENT */}
          <main className="main">
            <div style={{display: 'grid', gridTemplateColumns: '1fr', gap: '24px', padding: '24px'}}>
              {/* DASHBOARD TITLE */}
              <section>
                <h2 style={{marginTop: 0, marginBottom: 16}}>
                  {isStaff ? '👨‍🏫 Staff Dashboard' : '👨‍🎓 Student Dashboard'}
                </h2>
                <p style={{color: 'var(--text-muted)', marginTop: 0}}>
                  Welcome, {authUser?.username}! {isStaff ? 'Your staff profile is shown below.' : 'Manage your notes and files below.'}
                </p>
              </section>

              <section className="portal-card" style={{display: 'grid', gap: 14}}>
                <div style={{display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap'}}>
                  <div>
                    <div style={{fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em'}}>Visible Notes</div>
                    <div style={{fontSize: 26, fontWeight: 800}}>{notes.length}</div>
                  </div>
                  <div>
                    <div style={{fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em'}}>Favorites</div>
                    <div style={{fontSize: 26, fontWeight: 800}}>{favorites.size}</div>
                  </div>
                  <div>
                    <div style={{fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em'}}>Files</div>
                    <div style={{fontSize: 26, fontWeight: 800}}>{isStaff ? 'Staff' : 'Shared'}</div>
                  </div>
                </div>
                <div style={{display: 'grid', gridTemplateColumns: 'minmax(220px, 1fr) repeat(2, minmax(160px, 220px)) auto', gap: 12}}>
                  <input
                    value={noteSearch}
                    onChange={(e) => setNoteSearch(e.target.value)}
                    placeholder="Search notes"
                  />
                  <select value={noteAudience} onChange={(e) => setNoteAudience(e.target.value)}>
                    <option value="all">All audiences</option>
                    <option value="students">Students</option>
                    <option value="staff">Staff</option>
                  </select>
                  <button className={`btn-secondary ${notePinnedOnly ? 'active' : ''}`} onClick={() => setNotePinnedOnly((value) => !value)} type="button">
                    {notePinnedOnly ? 'Pinned only' : 'Show pinned'}
                  </button>
                  {isStaff ? (
                    <button className="btn-primary" type="button" onClick={exportNotes}>Export CSV</button>
                  ) : (
                    <div />
                  )}
                </div>
              </section>

              {isStaff ? (
                <>
                <div style={{display: 'grid', gridTemplateColumns: 'minmax(0, 1.35fr) minmax(280px, 0.75fr)', gap: '24px', alignItems: 'start'}}>
                  <section style={{borderTop: '1px solid var(--border)', paddingTop: '24px'}}>
                    <h3 style={{marginTop: 0}}>📣 Staff Announcements</h3>
                    {loading ? (
                      <Spinner />
                    ) : (
                      <>
                        <NoteForm
                          onCreate={createNote}
                          onUpdate={updateNote}
                        />
                        {notes.length > 0 ? (
                          <NoteList
                            notes={notes}
                            onUpdate={updateNote}
                            onDelete={deleteNote}
                            favorites={favorites}
                            onToggleFavorite={toggleFavorite}
                          />
                        ) : (
                          <p style={{textAlign: 'center', color: 'var(--text-muted)'}}>
                            No announcements yet. Publish one for students or staff.
                          </p>
                        )}
                      </>
                    )}
                  </section>

                  <aside style={{borderTop: '1px solid var(--border)', paddingTop: '24px'}}>
                    <h3 style={{marginTop: 0}}>👨‍🎓 Student Roster</h3>
                    <div className="portal-card" style={{marginBottom: 16}}>
                      <p style={{marginTop: 0}}><strong>Staff:</strong> {authUser?.username}</p>
                      <p><strong>Email:</strong> {authUser?.email || 'Not available'}</p>
                      <p style={{marginBottom: 0}}><strong>Role:</strong> Staff</p>
                    </div>
                    {rosterLoading ? (
                      <Spinner />
                    ) : (
                      <div style={{display: 'grid', gap: 12}}>
                        {students.length > 0 ? students.map((student) => (
                          <div key={student._id} className="portal-card">
                            <p style={{margin: '0 0 4px 0', fontWeight: 700}}>{student.username}</p>
                            <p style={{margin: '0 0 4px 0', color: 'var(--text-muted)'}}>{student.email}</p>
                            <p style={{margin: 0, fontSize: 13}}>
                              {student.noteCount || 0} note{(student.noteCount || 0) === 1 ? '' : 's'} from this student
                            </p>
                            <p style={{margin: '4px 0 0 0', fontSize: 12, color: 'var(--text-muted)'}}>
                              Last activity: {student.latestNoteAt ? new Date(student.latestNoteAt).toLocaleString() : 'No notes yet'}
                            </p>
                          </div>
                        )) : (
                          <p style={{color: 'var(--text-muted)'}}>No students have signed up yet.</p>
                        )}
                      </div>
                    )}
                  </aside>
                </div>

                <section style={{borderTop: '1px solid var(--border)', paddingTop: '24px'}}>
                  <h3 style={{marginTop: 0}}>📁 Staff Files</h3>
                  <FileUpload
                    API={API}
                    token={token}
                    onUploaded={() => {
                      setStaffFilesVersion(version => version + 1)
                      setToast({ type: 'success', message: 'File uploaded' })
                    }}
                  />
                  <FileList key={staffFilesVersion} API={API} token={token} mine={true} />
                </section>
                </>
              ) : (
                <>
                  {/* NOTES SECTION */}
                  <section style={{borderTop: '1px solid var(--border)', paddingTop: '24px'}}>
                    <h3 style={{marginTop: 0}}>📓 Messages and Notes</h3>
                    {loading ? (
                      <Spinner />
                    ) : (
                      <>
                        <NoteForm
                          onCreate={createNote}
                          onUpdate={updateNote}
                        />
                        {notes.length > 0 ? (
                          <NoteList 
                            notes={notes} 
                            onUpdate={updateNote}
                            onDelete={deleteNote}
                            favorites={favorites}
                            onToggleFavorite={toggleFavorite}
                          />
                        ) : (
                          <p style={{textAlign: 'center', color: 'var(--text-muted)'}}>
                            No messages yet. Send one to staff or share one with students.
                          </p>
                        )}
                      </>
                    )}
                  </section>

                  {/* FILES SECTION */}
                  <section style={{borderTop: '1px solid var(--border)', paddingTop: '24px'}}>
                    <h3 style={{marginTop: 0}}>📁 Shared Files</h3>
                    <FileList API={API} token={token} mine={false} />
                  </section>
                </>
              )}
            </div>
          </main>
        </>
      ) : (
        <main className="main auth-only-main">
          <Auth API={API} onLogin={onLogin} />
        </main>
      )}
    </div>
  )
}
