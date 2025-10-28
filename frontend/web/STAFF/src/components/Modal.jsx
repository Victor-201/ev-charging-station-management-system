import React, { useEffect } from 'react'
import './modal.scss'


export default function Modal({ open, title, children, onClose, className = '' }){
useEffect(() => {
function onKey(e){
if (e.key === 'Escape') onClose?.()
}
if (open) document.addEventListener('keydown', onKey)
return () => document.removeEventListener('keydown', onKey)
}, [open, onClose])


if (!open) return null
return (
<div className="modal-backdrop" onClick={onClose} aria-hidden={!open}>
<div
className={`modal ${className}`}
role="dialog"
aria-modal="true"
aria-label={title}
onClick={e => e.stopPropagation()}
>
<div className="modal-header">
<h3 className="modal-title">{title}</h3>
<button className="modal-close" aria-label="Close modal" onClick={onClose}>✕</button>
</div>
<div className="modal-body">{children}</div>
</div>
</div>
)
}