import React from 'react'
import Card from '../../components/Card.jsx'
import Table from '../../components/Table.jsx'
import './sessions.scss'

export default function Sessions(){
  return (
    <div className="page sessions-page">
      <h1>Sessions</h1>
      <Card title="Session history">
        <Table
          columns={["ID","User","Station","Start","End","Energy"]}
          rows={[["S100","Pham","ST-001","08:00","09:00","12 kWh"]]}
        />
      </Card>
    </div>
  )
}
