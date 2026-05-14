import React, { useState, useRef } from 'react'
import axios from 'axios'

export default function FileUpload({ API, token, onUploaded }){
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [progress, setProgress] = useState(0)
  const dropRef = useRef()

  const submit = async (e) => {
    e && e.preventDefault()
    if(!file) return setError('Select a file')
    setLoading(true)
    setError(null)
    setProgress(0)
    try{
      const fd = new FormData()
      fd.append('file', file)
      const res = await axios.post(`${API}/api/files/upload`, fd, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (evt) => {
          if(evt.total) setProgress(Math.round((evt.loaded / evt.total) * 100))
        }
      })
      onUploaded && onUploaded(res.data)
      setFile(null)
    }catch(err){
      setError(err?.response?.data?.message || 'Upload failed')
    }finally{setLoading(false); setProgress(0)}
  }

  const handleDrop = (e) => {
    e.preventDefault(); e.stopPropagation();
    const f = e.dataTransfer.files && e.dataTransfer.files[0]
    if(f) setFile(f)
  }

  return (
    <form onSubmit={submit} className="file-upload" onDrop={handleDrop} onDragOver={(e)=>{e.preventDefault(); e.stopPropagation()}}>
      <input className="file-input" type="file" onChange={e=>setFile(e.target.files[0])} />
      <div style={{display:'flex', gap:12, alignItems:'center'}}>
        <button className="btn-primary" type="submit" disabled={loading}>{loading ? `Uploading ${progress}%` : 'Upload'}</button>
        {file && <div style={{fontSize:13}}>{file.name} ({(file.size/1024).toFixed(1)} KB)</div>}
      </div>
      {progress>0 && <div style={{height:6, background:'var(--bg-alt)', borderRadius:6, marginTop:8}}><div style={{height:6, background:'var(--primary)', width:`${progress}%`, borderRadius:6}}/></div>}
      {error && <div className="file-error">{error}</div>}
      <div style={{fontSize:12, color:'var(--text-muted)', marginTop:6}}>Tip: drag & drop files here</div>
    </form>
  )
}
