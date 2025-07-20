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

  // Auto-focus active note
  useEffect(() => {
    if (activeNoteRef.current) {
      activeNoteRef.current.focus()
    }
  }, [activeNoteId])

  const updateNote = (noteId: string, content: string) => {
    setNotes(prevNotes => 
      prevNotes.map(note => 
        note.id === noteId 
          ? { ...note, content, updatedAt: new Date() }
          : note
      )
    )
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

  // Keyboard shortcut for new note
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault()
        createNewNote()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">Notes</h1>
        
        <div className="space-y-4">
          {notes.map((note, index) => (
            <div 
              key={note.id}
              className={`bg-white rounded-lg shadow-sm border-2 p-4 ${
                note.id === activeNoteId ? 'border-blue-400' : 'border-gray-200'
              }`}
              onClick={() => {
                setActiveNoteId(note.id)
                // Close edit tags mode when clicking a different note
                if (editingTags && editingTags !== note.id) {
                  setEditingTags(null)
                }
              }}
            >
              {/* Tags section */}
              <div className="flex flex-wrap gap-2 mb-3">
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

              {/* Date created */}
              <div className="text-sm text-gray-500 mb-2">
                {note.createdAt.toLocaleDateString()}
              </div>

              {/* Note content */}
              <textarea
                ref={note.id === activeNoteId ? activeNoteRef : null}
                className={`w-full min-h-[100px] resize-none outline-none ${
                  note.isCompleted ? 'line-through text-gray-400' : 'text-gray-800'
                }`}
                value={note.content}
                onChange={(e) => updateNote(note.id, e.target.value)}
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
      </div>
    </div>
  )
}

export default App