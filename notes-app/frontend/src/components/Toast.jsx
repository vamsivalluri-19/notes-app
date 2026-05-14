import React, { useEffect } from 'react'

export default function Toast({ type = 'success', message = '', onClose }){
  useEffect(()=>{
    const t = setTimeout(()=> onClose(), 4000)
    return ()=> clearTimeout(t)
  },[onClose])

  const getIcon = () => {
    return type === 'success' ? '✓' : '✕'
  }

  return (
    <div className={`toast ${type}`} role="status" aria-live="polite">
      <span>{getIcon()}</span>
      <span>{message}</span>
    </div>
  )
}
