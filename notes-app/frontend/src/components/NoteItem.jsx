import React from 'react'

export default function NoteItem({ 
  note, 
  onDelete, 
  onUpdate,
    onArchive,
    onRestore,
    onDuplicate,
  selectMode = false,
  selected = new Set(),
  onToggleSelect,
  favorites = new Set(),
  onToggleFavorite,
  getWordCount,
  getReadingTime,
  showArchived
}){
  const edit = ()=> window.dispatchEvent(new CustomEvent('note:edit', { detail: { note } }))
  
  const formatDate = (date) => {
    const d = new Date(date)
    const now = new Date()
    const diff = now - d
    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)
    
    if (seconds < 60) return 'just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const isSelected = selected.has(note._id)
  const isFavorited = favorites.has(note._id)
  const preview = note.content.substring(0, 100)
  const audienceLabel = {
    students: 'To Students',
    staff: 'To Staff',
    all: 'To Everyone'
  }[note.audience] || 'To Students'

  return (
    <div className={`note-item ${isSelected ? 'selected' : ''} ${selectMode && 'with-checkbox'}`}>
      {selectMode && (
        <input 
          type="checkbox" 
          className="note-checkbox"
          checked={isSelected}
          onChange={() => onToggleSelect(note._id)}
        />
      )}
      
      <div className="note-header">
        <h3 className="note-title">
          {note.pinned && '📌 '}
          {note.title}
        </h3>
        <button 
          type="button"
          className={`note-favorite-btn ${isFavorited ? 'favorited' : ''}`}
          onClick={() => onToggleFavorite(note._id)}
          title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
        >
          {isFavorited ? '⭐' : '☆'}
        </button>
      </div>

      <div className="note-meta">
        📅 {formatDate(note.createdAt)}
        {note.createdBy && <span> • by {note.createdBy.username || note.createdBy.email || 'Unknown'}</span>}
        <span> • {audienceLabel}</span>
        {note.updatedAt && note.updatedAt !== note.createdAt && (
          <span> • edited {formatDate(note.updatedAt)}</span>
        )}
        {getWordCount && getReadingTime && (
          <span> • {getWordCount(note.content)} words • {getReadingTime(note.content)}</span>
        )}
      </div>

      <p className="note-preview">{preview}{preview.length >= 100 ? '...' : ''}</p>

      {note.tags && note.tags.length > 0 && (
        <div className="note-tags">
          {note.tags.map(t=> (
            <span key={t} className="note-tag">#{t}</span>
          ))}
        </div>
      )}

      <div className="note-actions">
        <button onClick={edit}>✏️ Edit</button>
        <button onClick={()=>onDelete(note._id)}>🗑️ Delete</button>
        <button onClick={()=>onDuplicate(note)}>📋 Duplicate</button>
        {!note.archived && <button onClick={()=>onArchive(note._id)}>📦 Archive</button>}
        {note.archived && <button onClick={()=>onRestore(note._id)}>↩️ Restore</button>}
      </div>
    </div>
  )
}
