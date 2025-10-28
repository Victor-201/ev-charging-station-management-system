import React, { useState } from 'react'
import Sidebar from './Sidebar'
import Navbar from './Navbar'
import Modal from './Modal'
import './layout.scss'


export default function LayoutExample(){
const [open, setOpen] = useState(true)
const [showModal, setShowModal] = useState(false)


return (
<div className="app-root">
<Navbar onToggle={() => setOpen(v => !v)} />
<div className={`app-body ${open ? 'sidebar-open' : 'sidebar-closed'}`}>
<Sidebar active={open} />
<main className={`content ${open ? 'with-sidebar' : 'no-sidebar'}`}>
<div className="content-inner">
<div className="content-card">
<h1>Welcome back, Trọng 👋</h1>
<p className="muted">Quick overview of your station network, sessions and payments.</p>


<div className="grid">
<div className="stat">⚡<div>Active Stations<span>12</span></div></div>
<div className="stat">📊<div>Active Sessions<span>23</span></div></div>
<div className="stat">💳<div>Payments<span>5</span></div></div>
</div>


<div className="actions">
<button className="btn primary" onClick={() => setShowModal(true)}>Create reservation</button>
<button className="btn ghost">Import CSV</button>
</div>
</div>


<div style={{height:600}}></div>
</div>
</main>
</div>


<Modal open={showModal} title="Create reservation" onClose={() => setShowModal(false)}>
<p>Demo modal content. Replace with your form.</p>
</Modal>
</div>
)
}