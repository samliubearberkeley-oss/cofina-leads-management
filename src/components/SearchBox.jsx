import React from 'react'
import '../styles/SearchBox.css'

function SearchBox({ value, onChange }) {
  return (
    <div className="search-box">
      <input
        type="text"
        id="searchInput"
        placeholder="🔍 搜索表格内容..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}

export default SearchBox

