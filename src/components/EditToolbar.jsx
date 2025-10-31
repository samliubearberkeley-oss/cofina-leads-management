import React from 'react'
import '../styles/EditToolbar.css'

function EditToolbar({ 
  onAddRow, 
  onDeleteRows, 
  onCopyRows, 
  onPasteRows, 
  onUndo,
  canDelete,
  canCopy,
  canUndo
}) {
  return (
    <div className="edit-toolbar active">
      <button id="addRowBtn" onClick={onAddRow}>
        Add Row <span className="shortcut-hint">(Ctrl+N)</span>
      </button>
      <button 
        id="deleteRowBtn" 
        onClick={onDeleteRows}
        disabled={!canDelete}
      >
        Delete Row <span className="shortcut-hint">(Delete)</span>
      </button>
      <button 
        id="copyBtn" 
        onClick={onCopyRows}
        disabled={!canCopy}
      >
        Copy <span className="shortcut-hint">(Ctrl+C)</span>
      </button>
      <button id="pasteBtn" onClick={onPasteRows}>
        Paste <span className="shortcut-hint">(Ctrl+V)</span>
      </button>
      <button 
        id="undoBtn" 
        onClick={onUndo}
        disabled={!canUndo}
      >
        Undo <span className="shortcut-hint">(Ctrl+Z)</span>
      </button>
    </div>
  )
}

export default EditToolbar

