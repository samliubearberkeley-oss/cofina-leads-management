import React from 'react'
import '../styles/EditToggle.css'

function EditToggle({ editMode, onToggle }) {
  return (
    <div className="edit-toggle">
      <input
        type="checkbox"
        id="editModeCheckbox"
        checked={editMode}
        onChange={(e) => onToggle(e.target.checked)}
      />
      <label htmlFor="editModeCheckbox">Edit Mode</label>
    </div>
  )
}

export default EditToggle

