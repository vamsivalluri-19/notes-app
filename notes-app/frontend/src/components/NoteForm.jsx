import React, { useState, useEffect } from 'react'

export default function NoteForm({ onCreate, onUpdate, categories = [] }){
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tagsInput, setTagsInput] = useState('')
  const [pinned, setPinned] = useState(false)
  const [category, setCategory] = useState('')
  const [audience, setAudience] = useState('students')
  const [editingId, setEditingId] = useState(null)
  const [charCount, setCharCount] = useState(0)

  useEffect(()=>{
    const handleEdit = (e)=>{
      if(e.detail && e.detail.note){
        const n = e.detail.note
        setTitle(n.title)
        setContent(n.content)
        setTagsInput((n.tags||[]).join(', '))
        setPinned(!!n.pinned)
        setCategory(n.category || '')
        setAudience(n.audience || 'students')
        setEditingId(n._id)
        setCharCount(n.content.length)
      }
    }
    window.addEventListener('note:edit', handleEdit)
    return ()=> window.removeEventListener('note:edit', handleEdit)
  },[])

  const clear = ()=>{ 
    setTitle('')
    setContent('')
    setTagsInput('')
    setPinned(false)
    setCategory('')
    setAudience('students')
    setEditingId(null)
    setCharCount(0)
  }

  const submit = async (e)=>{
    e.preventDefault()
    if (!title.trim() || !content.trim()) return
    
    const payload = { 
      title: title.trim(), 
      content: content.trim(), 
      tags: tagsInput ? tagsInput.split(',').map(t=>t.trim()).filter(Boolean) : [],
      pinned,
      category,
      audience
    }
    
    if(editingId){ 
      await onUpdate(editingId, payload)
      clear() 
    } else { 
      await onCreate(payload)
      clear() 
    }
  }

  return (
    <form className="note-form" onSubmit={submit}>
      <input 
        type="text"
        required 
        placeholder="Note title..." 
        value={title} 
        onChange={e=>setTitle(e.target.value)}
        maxLength={100}
      />
      <div style={{display:'flex', gap:8, alignItems:'center'}}>
        <textarea 
          required 
          rows={10}
          placeholder="What's on your mind? Start typing..." 
          value={content} 
          onChange={e=>{setContent(e.target.value); setCharCount(e.target.value.length)}}
        />
        <span style={{fontSize:12, color:'var(--text-muted)', whiteSpace:'nowrap'}}>
          {charCount} chars
        </span>
      </div>
      <input 
        type="text"
        placeholder="Tags (comma separated, e.g: work, personal, urgent)" 
        value={tagsInput} 
        onChange={e=>setTagsInput(e.target.value)}
      />
      <select 
        value={category}
        onChange={e=>setCategory(e.target.value)}
        style={{padding: '14px 16px'}}
      >
        <option value="">📁 Select Category (optional)</option>
        {categories.map(cat => (
          <option key={cat} value={cat}>{cat}</option>
        ))}
      </select>
      <select value={audience} onChange={e=>setAudience(e.target.value)} style={{padding: '14px 16px'}}>
        <option value="students">To Students</option>
        <option value="staff">To Staff</option>
        <option value="all">To Everyone</option>
      </select>
      <label style={{display:'flex', alignItems:'center', gap:8, cursor:'pointer'}}>
        <input 
          type="checkbox" 
          checked={pinned} 
          onChange={e=>setPinned(e.target.checked)}
        /> 
        <span>📌 Pin this note</span>
      </label>
      <div className="actions">
        <button type="submit" className="btn-primary">
          {editingId? '✓ Update Note' : '+ Add Note'}
        </button>
        {editingId && (
          <button type="button" className="btn-secondary" onClick={clear}>
            ✕ Cancel
          </button>
        )}
      </div>
    </form>
  )
}
