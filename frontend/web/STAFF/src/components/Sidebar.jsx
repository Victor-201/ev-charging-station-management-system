import React, { useState } from 'react'
import { NavLink } from 'react-router-dom'
import './sidebar.scss'


const items = [
{ key:'dashboard', label:'Dashboard', to:'/dashboard', icon:'🏠' },
{ key:'stations', label:'Stations', to:'/stations', icon:'⚡' },
{ key:'sessions', label:'Sessions', to:'/sessions', icon:'📊' },
{ key:'payments', label:'Payments', to:'/payments', icon:'💳' },
{ key:'monitoring', label:'Monitoring', to:'/monitoring', icon:'🔎' },
{ key:'profile', label:'Profile', to:'/profile', icon:'👤' },
]


export default function Sidebar({ active = true }) {
const [expanded, setExpanded] = useState(active)


return (
<aside className={`sidebar ${expanded ? 'open' : 'closed'}`} aria-hidden={!expanded}>
<div className="sidebar-top">
<div className="sidebar-brand">
<div className="logo">⚡</div>
<div className="title">EV <span>Admin</span></div>
</div>
<button className="collapse-btn" onClick={() => setExpanded(v => !v)} aria-label="Toggle sidebar">
<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
</button>
</div>


<nav className="sidebar-nav" role="navigation" aria-label="Main navigation">
{items.map(i => (
<NavLink key={i.key} to={i.to} className={({isActive}) => `sidebar-item ${isActive ? 'active' : ''}`}>
<span className="item-icon" aria-hidden>{i.icon}</span>


{/* main label (hidden when collapsed) */}
<span className="item-label">{i.label}</span>


<span className="chev">›</span>


{/* tooltip - only used in collapsed mode */}
<span className="tooltip" aria-hidden>{i.label}</span>
</NavLink>
))}
</nav>


<div className="sidebar-footer">
<div className="version">v1.0</div>
<div className="footer-actions">⚙️</div>
</div>
</aside>
)
}