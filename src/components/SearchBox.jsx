import React from 'react'
import '../styles/SearchBox.css'

function SearchBox({ value, onChange }) {
  return (
    <div className="search-box">
      <input
        type="text"
        id="searchInput"
        placeholder="🔍 Search table content..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}

export default SearchBox

