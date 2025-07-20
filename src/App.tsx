import { useState, useEffect, useRef } from 'react'

interface Note {
  id: string
  content: string
  tagIds: string[]
  createdAt: Date
  updatedAt: Date
  isBookmarked: boolean
  isCompleted: boolean
}

interface Tag {
  id: string
  name: string
}

function App() {
  const [notes, setNotes] = useState<Note[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [activeNoteId, setActiveNoteId] = useState<string>('')
  const [editingTags, setEditingTags] = useState<string | null>(null)
  const [newTagInput, setNewTagInput] = useState<string>('')
  const [creatingTagForNote, setCreatingTagForNote] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'notes' | 'tags'>('notes')
  const [saving, setSaving] = useState<string | null>(null)
  const [tagPicker, setTagPicker] = useState<{
    isOpen: boolean
    noteId: string
    query: string
    selectedIndex: number
  } | null>(null)
  const activeNoteRef = useRef<HTMLTextAreaElement>(null)

  // Initialize with an empty note and some sample tags
  useEffect(() => {
    const initialNote: Note = {
      id: Date.now().toString(),
      content: '',
      tagIds: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      isBookmarked: false,
      isCompleted: false
    }
    setNotes([initialNote])
    setActiveNoteId(initialNote.id)
    
    // Sample tags
    setTags([
      { id: '1', name: 'work' },
      { id: '2', name: 'personal' },
      { id: '3', name: 'ideas' }
    ])
  }, [])

  // Auto-focus active note and resize textarea
  useEffect(() => {
    if (activeNoteRef.current) {
      activeNoteRef.current.focus()
      autoResizeTextarea(activeNoteRef.current)
    }
  }, [activeNoteId])

  // Resize all textareas on mount and when notes change
  useEffect(() => {
    const textareas = document.querySelectorAll('textarea')
    textareas.forEach(textarea => autoResizeTextarea(textarea as HTMLTextAreaElement))
  }, [notes])

  const updateNote = (noteId: string, content: string) => {
    setSaving(noteId)
    setNotes(prevNotes => 
      prevNotes.map(note => 
        note.id === noteId 
          ? { ...note, content, updatedAt: new Date() }
          : note
      )
    )
    // Clear saving indicator after a short delay
    setTimeout(() => setSaving(null), 500)
  }

  const autoResizeTextarea = (textarea: HTMLTextAreaElement) => {
    textarea.style.height = 'auto'
    textarea.style.height = `${textarea.scrollHeight}px`
  }

  const createNewNote = () => {
    const newNote: Note = {
      id: Date.now().toString(),
      content: '',
      tagIds: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      isBookmarked: false,
      isCompleted: false
    }
    setNotes(prevNotes => [newNote, ...prevNotes])
    setActiveNoteId(newNote.id)
  }

  const formatDate = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes} min ago`
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`
    if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`
    
    return date.toLocaleDateString()
  }

  const toggleTag = (noteId: string, tagId: string) => {
    setNotes(prevNotes =>
      prevNotes.map(note =>
        note.id === noteId
          ? {
              ...note,
              tagIds: note.tagIds.includes(tagId)
                ? note.tagIds.filter(id => id !== tagId)
                : [...note.tagIds, tagId],
              updatedAt: new Date()
            }
          : note
      )
    )
  }

  const createTag = (name: string) => {
    const newTag: Tag = {
      id: Date.now().toString(),
      name: name.trim()
    }
    setTags(prevTags => [...prevTags, newTag])
    
    // If creating for a specific note, add it immediately
    if (creatingTagForNote) {
      toggleTag(creatingTagForNote, newTag.id)
    }
    
    setNewTagInput('')
    setCreatingTagForNote(null)
  }

  const toggleBookmark = (noteId: string) => {
    setNotes(prevNotes =>
      prevNotes.map(note =>
        note.id === noteId
          ? { ...note, isBookmarked: !note.isBookmarked, updatedAt: new Date() }
          : note
      )
    )
  }

  const toggleComplete = (noteId: string) => {
    setNotes(prevNotes =>
      prevNotes.map(note =>
        note.id === noteId
          ? { ...note, isCompleted: !note.isCompleted, updatedAt: new Date() }
          : note
      )
    )
  }

  const archiveNote = (noteId: string) => {
    setNotes(prevNotes => prevNotes.filter(note => note.id !== noteId))
    // If we archived the active note, set a new active note
    if (noteId === activeNoteId && notes.length > 1) {
      const remainingNotes = notes.filter(note => note.id !== noteId)
      setActiveNoteId(remainingNotes[0].id)
    }
  }

  const openTagPicker = (noteId: string) => {
    setTagPicker({
      isOpen: true,
      noteId,
      query: '',
      selectedIndex: 0
    })
  }

  const closeTagPicker = () => {
    setTagPicker(null)
  }

  const updateTagPickerQuery = (query: string) => {
    if (tagPicker) {
      setTagPicker({
        ...tagPicker,
        query,
        selectedIndex: 0 // Reset selection when query changes
      })
    }
  }

  const navigateTagPicker = (direction: 'up' | 'down') => {
    if (!tagPicker) return
    
    const maxIndex = Math.max(filteredTagOptions.length - 1, 0)
    let newIndex = tagPicker.selectedIndex
    
    if (direction === 'up') {
      newIndex = newIndex > 0 ? newIndex - 1 : maxIndex
    } else {
      newIndex = newIndex < maxIndex ? newIndex + 1 : 0
    }
    
    setTagPicker({
      ...tagPicker,
      selectedIndex: newIndex
    })
  }

  const selectTagFromPicker = (tagId?: string, tagName?: string) => {
    if (!tagPicker) return
    
    let selectedTag
    if (tagId && tagName) {
      selectedTag = { id: tagId, name: tagName }
    } else {
      selectedTag = filteredTagOptions[tagPicker.selectedIndex]
      if (!selectedTag) return
    }
    
    // Toggle tag on note
    toggleTag(tagPicker.noteId, selectedTag.id)
    closeTagPicker()
  }

  const filteredTagOptions = tagPicker 
    ? [
        // Existing tags
        ...tags.filter(tag => 
          tag.name.toLowerCase().includes(tagPicker.query.toLowerCase())
        ).map(tag => ({ ...tag, isNew: false })),
        // Option to create new tag if query doesn't match existing
        ...(tagPicker.query.trim() && 
           !tags.some(tag => tag.name.toLowerCase() === tagPicker.query.toLowerCase())
          ? [{ id: 'new', name: tagPicker.query.trim(), isNew: true }]
          : []
        )
      ]
    : []

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // New note shortcut
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault()
        createNewNote()
      }
      
      // Tag picker shortcut (Cmd+I)
      if ((e.metaKey || e.ctrlKey) && e.key === 'i') {
        e.preventDefault()
        if (activeNoteId && !tagPicker?.isOpen) {
          openTagPicker(activeNoteId)
        }
      }
      
      // Handle tag picker keyboard navigation
      if (tagPicker?.isOpen) {
        if (e.key === 'Escape') {
          e.preventDefault()
          closeTagPicker()
        } else if (e.key === 'Enter') {
          e.preventDefault()
          const selectedOption = filteredTagOptions[tagPicker.selectedIndex]
          if (selectedOption) {
            if (selectedOption.isNew) {
              // Create new tag
              const newTag: Tag = {
                id: Date.now().toString(),
                name: selectedOption.name
              }
              setTags(prevTags => [...prevTags, newTag])
              selectTagFromPicker(newTag.id, newTag.name)
            } else {
              selectTagFromPicker(selectedOption.id, selectedOption.name)
            }
          }
        } else if (e.key === 'ArrowUp') {
          e.preventDefault()
          navigateTagPicker('up')
        } else if (e.key === 'ArrowDown') {
          e.preventDefault()
          navigateTagPicker('down')
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [tagPicker, filteredTagOptions, activeNoteId])

  return (
    <div className="min-h-screen bg-gray-50 pb-16 md:pb-0">
      <div className="max-w-3xl mx-auto p-4">
        {/* Desktop header with New Note button */}
        <div className="hidden md:flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Notes</h1>
          <button
            onClick={createNewNote}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <span className="text-lg">+</span>
            <kbd className="px-1.5 py-0.5 bg-blue-400 rounded text-xs">⌘/</kbd>
          </button>
        </div>
        
        {activeTab === 'notes' && (
          <div className="space-y-4">
          {notes.map((note, index) => (
            <div 
              key={note.id}
              className={`bg-white rounded-lg shadow-sm border-2 p-4 relative ${
                note.id === activeNoteId ? 'border-blue-400' : 'border-gray-200'
              } ${note.isBookmarked ? 'bg-yellow-50' : ''}`}
              onClick={() => {
                setActiveNoteId(note.id)
                // Close edit tags mode when clicking a different note
                if (editingTags && editingTags !== note.id) {
                  setEditingTags(null)
                }
              }}
            >
              {/* Action buttons */}
              <div className="absolute top-2 right-2 md:top-4 md:right-4 flex items-center gap-1 md:gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleBookmark(note.id)
                  }}
                  className={`p-1.5 md:p-2 rounded hover:bg-gray-100 ${
                    note.isBookmarked ? 'text-yellow-600' : 'text-gray-400'
                  }`}
                  title="Bookmark"
                >
                  <svg className="w-4 h-4 md:w-5 md:h-5" fill={note.isBookmarked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleComplete(note.id)
                  }}
                  className={`p-1.5 md:p-2 rounded hover:bg-gray-100 ${
                    note.isCompleted ? 'text-green-600' : 'text-gray-400'
                  }`}
                  title="Complete"
                >
                  <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    if (confirm('Archive this note?')) {
                      archiveNote(note.id)
                    }
                  }}
                  className="p-1.5 md:p-2 rounded hover:bg-gray-100 text-gray-400"
                  title="Archive"
                >
                  <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                </button>
              </div>
              {/* Tags section */}
              <div className="flex flex-wrap gap-2 mb-3 pr-24 md:pr-32">
                {index === 0 || editingTags === note.id ? (
                  // Show all tags for first note or when editing
                  <>
                    {tags.map(tag => (
                      <button
                        key={tag.id}
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleTag(note.id, tag.id)
                        }}
                        className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                          note.tagIds.includes(tag.id)
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {tag.name}
                      </button>
                    ))}
                    {creatingTagForNote === note.id ? (
                      <input
                        type="text"
                        value={newTagInput}
                        onChange={(e) => setNewTagInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && newTagInput.trim()) {
                            createTag(newTagInput)
                          } else if (e.key === 'Escape') {
                            setCreatingTagForNote(null)
                            setNewTagInput('')
                          }
                        }}
                        onBlur={() => {
                          if (newTagInput.trim()) {
                            createTag(newTagInput)
                          } else {
                            setCreatingTagForNote(null)
                            setNewTagInput('')
                          }
                        }}
                        className="px-3 py-1 rounded-full text-sm border-2 border-gray-300 outline-none focus:border-blue-400"
                        placeholder="Tag name..."
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setCreatingTagForNote(note.id)
                        }}
                        className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200"
                      >
                        + Create Tag
                      </button>
                    )}
                  </>
                ) : (
                  // Show only active tags for existing notes
                  <>
                    {note.tagIds.map(tagId => {
                      const tag = tags.find(t => t.id === tagId)
                      return tag ? (
                        <span
                          key={tag.id}
                          className="px-3 py-1 rounded-full text-sm font-medium bg-blue-500 text-white"
                        >
                          {tag.name}
                        </span>
                      ) : null
                    })}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditingTags(note.id)
                      }}
                      className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200"
                    >
                      Edit Tags
                    </button>
                  </>
                )}
              </div>

              {/* Date created with save indicator */}
              <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
                <span>{note.createdAt.toLocaleDateString()}</span>
                {saving === note.id && (
                  <span className="text-xs text-green-600 flex items-center gap-1">
                    <svg className="w-3 h-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Saving...
                  </span>
                )}
              </div>

              {/* Note content */}
              <textarea
                ref={note.id === activeNoteId ? activeNoteRef : null}
                className={`w-full min-h-[1.5rem] resize-none outline-none overflow-hidden ${
                  note.isCompleted ? 'line-through text-gray-400' : 'text-gray-800'
                }`}
                value={note.content}
                onChange={(e) => {
                  updateNote(note.id, e.target.value)
                  autoResizeTextarea(e.target)
                }}
                onInput={(e) => autoResizeTextarea(e.target as HTMLTextAreaElement)}
                placeholder="Start typing..."
              />


              {/* Last updated - only show for existing notes with content */}
              {index > 0 && note.content && (
                <div className="text-xs text-gray-400 mt-2">
                  Updated {formatDate(note.updatedAt)}
                </div>
              )}
            </div>
          ))}
          </div>
        )}
        
        {activeTab === 'tags' && (
          <div className="bg-white rounded-lg shadow-sm border-2 border-gray-200 p-8 text-center">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Tags Management</h2>
            <p className="text-gray-500">Tag management features coming soon...</p>
          </div>
        )}
      </div>
      
      {/* Mobile FAB for new note */}
      <button
        onClick={createNewNote}
        className="md:hidden fixed bottom-20 right-4 w-14 h-14 bg-blue-500 text-white rounded-full shadow-lg flex items-center justify-center text-2xl hover:bg-blue-600 transition-colors z-10"
        title="New Note (⌘/)"
      >
        +
      </button>
      
      {/* Mobile bottom navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden">
        <div className="flex">
          <button
            onClick={() => setActiveTab('notes')}
            className={`flex-1 py-4 text-center ${
              activeTab === 'notes' 
                ? 'text-blue-600 border-t-2 border-blue-600' 
                : 'text-gray-600'
            }`}
          >
            <svg className="w-6 h-6 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
            <span className="text-xs">Notes</span>
          </button>
          <button
            onClick={() => setActiveTab('tags')}
            className={`flex-1 py-4 text-center ${
              activeTab === 'tags' 
                ? 'text-blue-600 border-t-2 border-blue-600' 
                : 'text-gray-600'
            }`}
          >
            <svg className="w-6 h-6 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            <span className="text-xs">Tags</span>
          </button>
        </div>
      </div>
      
      {/* Tag Picker Modal */}
      {tagPicker?.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-96 max-h-96 flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Add Tags</h3>
              <p className="text-sm text-gray-500 mt-1">Press ⌘I to open, ↑↓ to navigate, Enter to select</p>
            </div>
            
            {/* Search Input */}
            <div className="p-4 border-b border-gray-200">
              <input
                type="text"
                value={tagPicker.query}
                onChange={(e) => updateTagPickerQuery(e.target.value)}
                placeholder="Search or create tags..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md outline-none focus:border-blue-400"
                autoFocus
              />
            </div>
            
            {/* Tag List */}
            <div className="flex-1 overflow-y-auto">
              {filteredTagOptions.length > 0 ? (
                filteredTagOptions.map((option, index) => (
                  <button
                    key={option.id}
                    onClick={() => {
                      if (option.isNew) {
                        const newTag: Tag = {
                          id: Date.now().toString(),
                          name: option.name
                        }
                        setTags(prevTags => [...prevTags, newTag])
                        selectTagFromPicker(newTag.id, newTag.name)
                      } else {
                        selectTagFromPicker(option.id, option.name)
                      }
                    }}
                    className={`w-full text-left px-4 py-3 flex items-center gap-3 border-b border-gray-100 last:border-b-0 ${
                      index === tagPicker.selectedIndex
                        ? 'bg-blue-50 border-blue-200'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    {option.isNew ? (
                      <>
                        <span className="text-green-600 font-bold">+</span>
                        <span className="text-green-600">Create "{option.name}"</span>
                      </>
                    ) : (
                      <>
                        <span className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs">
                          #
                        </span>
                        <span className="text-gray-800">{option.name}</span>
                        {notes.find(n => n.id === tagPicker.noteId)?.tagIds.includes(option.id) && (
                          <span className="ml-auto text-blue-600 text-sm">✓</span>
                        )}
                      </>
                    )}
                  </button>
                ))
              ) : (
                <div className="p-4 text-center text-gray-500">
                  {tagPicker.query ? 'No tags found' : 'Start typing to search tags'}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App