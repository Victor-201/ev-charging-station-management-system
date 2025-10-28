import React from 'react'
import './table.scss'

export default function Table({ columns = [], rows = [] }){
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>{columns.map(c => <th key={c}>{c}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r,i) => (
            <tr key={i}>{r.map((c,j) => <td key={j}>{c}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
