import React from 'react'
import NoteItem from './NoteItem'

export default function NoteList({ 
  notes, 
  onDelete, 
  onUpdate,
    onArchive,
    onRestore,
    onDuplicate,
  viewMode = 'grid',
  selectMode = false,
  selected = new Set(),
  onToggleSelect,
  favorites = new Set(),
  onToggleFavorite,
  getWordCount,
  getReadingTime,
  showArchived
}){
  return (
    <div className={`note-list ${viewMode === 'list' ? 'list-view' : ''}`}>
      {notes.map(n=> (
        <NoteItem 
          key={n._id} 
          note={n} 
          onDelete={onDelete} 
          onUpdate={onUpdate}
                    onArchive={onArchive}
                    onRestore={onRestore}
                    onDuplicate={onDuplicate}
          selectMode={selectMode}
          selected={selected}
          onToggleSelect={onToggleSelect}
          favorites={favorites}
          onToggleFavorite={onToggleFavorite}
                  getWordCount={getWordCount}
                  getReadingTime={getReadingTime}
                  showArchived={showArchived}
        />
      ))}
    </div>
  )
}
