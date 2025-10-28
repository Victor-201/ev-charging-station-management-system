import React from 'react'
import './auth.scss'

export default function Login(){
  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>Sign in</h2>
        <input placeholder="Email" />
        <input placeholder="Password" type="password" />
        <button>Sign in (demo)</button>
      </div>
    </div>
  )
}
