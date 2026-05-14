import React, { useEffect, useState } from 'react'
import axios from 'axios'

export default function FileList({ API, token, mine=false }){
  const [files, setFiles] = useState([])
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(6)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [previewFile, setPreviewFile] = useState(null)
  const [commentText, setCommentText] = useState('')
  const [shareUrl, setShareUrl] = useState(null)

  const fetchFiles = async (p = page) =>{
    setLoading(true)
    try{
      const url = mine ? `${API}/api/files/mine` : `${API}/api/files/public`
      const res = await axios.get(url, { params: { page: p, limit, search }, headers: token ? { Authorization:`Bearer ${token}` } : {} })
      const data = res.data || {}
      const list = data.files || data;
      setFiles(list)
      setTotal(data.total || (list && list.length) || 0)
      setPage(data.page || p)
      setLimit(data.limit || limit)
    }catch(err){
      console.error(err)
    }finally{setLoading(false)}
  }

  useEffect(()=>{ fetchFiles(1) }, [API, token, mine, search])

  const openPreview = (f) => {
    setPreviewFile(f)
  }

  const handleDownload = async (f) => {
    try{
      // increment download counter
      if(token){ await axios.post(`${API}/api/files/${f._id}/download`, {}, { headers: { Authorization:`Bearer ${token}` } }) }
      // open file
      window.open(`${API}/uploads/${f.filename}`, '_blank')
    }catch(err){ console.error(err) }
  }

  const toggleVisibility = async (f) => {
    try{
      const res = await axios.post(`${API}/api/files/${f._id}/toggle-visibility`, {}, { headers: { Authorization:`Bearer ${token}` } })
      fetchFiles(page)
    }catch(err){ console.error(err) }
  }

  const generateShare = async (f) => {
    try{
      const res = await axios.post(`${API}/api/files/${f._id}/share`, {}, { headers: { Authorization:`Bearer ${token}` } })
      setShareUrl(res.data.shareUrl)
    }catch(err){ console.error(err) }
  }

  const submitComment = async (f) => {
    if(!commentText.trim()) return
    try{
      await axios.post(`${API}/api/files/${f._id}/comment`, { text: commentText }, { headers: { Authorization:`Bearer ${token}` } })
      setCommentText('')
      fetchFiles(page)
    }catch(err){ console.error(err) }
  }

  return (
    <div>
      <div style={{display:'flex', gap:8, marginBottom:12}}>
        <input placeholder="Search files..." value={search} onChange={e=>setSearch(e.target.value)} />
        <button className="btn-secondary" onClick={()=>fetchFiles(1)}>Search</button>
      </div>

      <div className="file-list">
        {loading && <div className="empty-subtext">Loading...</div>}
        {!loading && files.length===0 && <div className="empty-subtext">No files</div>}
        {files.map(f=> (
          <div key={f._id} className="file-item">
            <div className="file-main">
              <div>
                <strong className="file-title">{f.originalName}</strong>
                <div className="file-meta">Uploaded by: {f.uploader?.username || f.uploader}</div>
                <div className="file-meta">{new Date(f.createdAt).toLocaleString()}</div>
                <div className="file-meta">Downloads: {f.downloadCount || 0}</div>
                {f.comments && f.comments.length>0 && (
                  <div style={{marginTop:8}}>
                    <strong>Comments</strong>
                    {f.comments.map(c => (
                      <div key={c._id} style={{fontSize:13, color:'var(--text-muted)'}}>- {c.text}</div>
                    ))}
                  </div>
                )}
              </div>
              <div className="file-actions">
                <button className="btn-secondary" onClick={()=>openPreview(f)}>Preview</button>
                <button className="btn-primary" onClick={()=>handleDownload(f)}>Download</button>
                {token && <button className="btn-secondary" onClick={()=>generateShare(f)}>Get Share Link</button>}
                {token && <button className="btn-secondary" onClick={()=>toggleVisibility(f)}>{f.visibleToStudents ? 'Hide' : 'Show'}</button>}
                <div className="file-size">{(f.size/1024).toFixed(1)} KB</div>
              </div>
            </div>
            {shareUrl && (<div style={{marginTop:8}}><a href={shareUrl} target="_blank" rel="noreferrer">{shareUrl}</a></div>)}
            {previewFile && previewFile._id === f._id && (
              <div className="preview-modal">
                <div className="preview-content">
                  <button className="btn-secondary" onClick={()=>setPreviewFile(null)}>Close Preview</button>
                  {previewFile.mimetype.startsWith('image/') ? (
                    <img src={`${API}/uploads/${previewFile.filename}`} alt={previewFile.originalName} style={{maxWidth:'100%'}} />
                  ) : previewFile.mimetype === 'application/pdf' ? (
                    <iframe src={`${API}/uploads/${previewFile.filename}`} style={{width:'100%', height:600}} title={previewFile.originalName} />
                  ) : (
                    <div style={{padding:12}}>Preview not available for this file type.</div>
                  )}
                  <div style={{marginTop:12}}>
                    <input value={commentText} onChange={e=>setCommentText(e.target.value)} placeholder="Add a comment" />
                    <button className="btn-primary" onClick={()=>submitComment(previewFile)}>Comment</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{display:'flex', justifyContent:'center', gap:8, marginTop:12}}>
        <button className="btn-pagination" onClick={()=>{ if(page>1) { setPage(p=>p-1); fetchFiles(page-1) } }} disabled={page<=1}>Prev</button>
        <div className="page-indicator">Page {page} / {Math.max(1, Math.ceil(total/limit))}</div>
        <button className="btn-pagination" onClick={()=>{ if(page*limit<total){ setPage(p=>p+1); fetchFiles(page+1) } }} disabled={page*limit>=total}>Next</button>
      </div>
    </div>
  )
}
