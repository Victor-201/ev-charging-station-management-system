import React from 'react'
import './navbar.scss'


export default function Navbar({ onToggle }){
return (
<header className="navbar">
<div className="navbar-left">
<button className="nav-toggle" onClick={onToggle} aria-label="Toggle sidebar">
<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
<path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
</svg>
</button>
<div className="brand">
<div className="brand-logo">⚡</div>
<div className="brand-text">EV Charging <span className="brand-pro">Admin</span></div>
</div>
</div>


<div className="navbar-right">
<div className="nav-search-wrap">
<input className="nav-search" placeholder="Tìm kiếm trạm, phiên..." aria-label="Search" />
</div>
<button className="nav-help" title="Help">?
</button>
<div className="nav-avatar" title="Profile">TD</div>
</div>
</header>
)
}