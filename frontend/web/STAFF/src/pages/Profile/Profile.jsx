import React from 'react'
import Card from '../../components/Card.jsx'
import './profile.scss'

export default function Profile(){
  return (
    <div className="page profile-page">
      <h1>Profile</h1>
      <Card title="Account">User: Admin<br/>Role: Manager</Card>
    </div>
  )
}
