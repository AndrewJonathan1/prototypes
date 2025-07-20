import { useState, useEffect, useRef } from 'react'

interface Note {
  id: string
  content: string
  tagIds: string[]
  createdAt: Date
  updatedAt: Date
  isBookmarked: boolean
  isCompleted: boolean
  isNew?: boolean
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
  const [inlineTagEdit, setInlineTagEdit] = useState<{
    noteId: string
    query: string
    highlightedIndex: number
  } | null>(null)
  const [showHelp, setShowHelp] = useState<boolean>(false)
  const activeNoteRef = useRef<HTMLTextAreaElement>(null)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // UX: Platform detection for cross-platform keyboard shortcuts
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
  const modKey = isMac ? '⌘' : 'Ctrl'
  const modKeyName = isMac ? 'Cmd' : 'Ctrl'

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
    
    // Business/Startup/Personal Development tags with emoji prefixes
    setTags([
      { id: '1', name: '💼 business' },
      { id: '2', name: '🚀 startup' },
      { id: '3', name: '💡 ideas' },
      { id: '4', name: '📈 growth' },
      { id: '5', name: '💰 funding' },
      { id: '6', name: '🎯 goals' },
      { id: '7', name: '📊 metrics' },
      { id: '8', name: '🤝 networking' },
      { id: '9', name: '👥 team' },
      { id: '10', name: '🏆 wins' },
      { id: '11', name: '📚 learning' },
      { id: '12', name: '⚡ productivity' },
      { id: '13', name: '🧘 mindfulness' },
      { id: '14', name: '💪 habits' },
      { id: '15', name: '🔥 motivation' },
      { id: '16', name: '🎨 creativity' },
      { id: '17', name: '🔧 tools' },
      { id: '18', name: '📝 notes' },
      { id: '19', name: '⏰ urgent' },
      { id: '20', name: '🌟 inspiration' }
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
    // UX: Update note content immediately without showing save indicator on every keystroke
    setNotes(prevNotes => 
      prevNotes.map(note => 
        note.id === noteId 
          ? { ...note, content, updatedAt: new Date() }
          : note
      )
    )
    
    // UX: Only show save indicator after user stops typing (debounced)
    // Clear any existing timeout first
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    
    // Show saving indicator after 500ms of no typing
    saveTimeoutRef.current = setTimeout(() => {
      setSaving(noteId)
      // Hide indicator after brief moment to show "saved" feedback
      setTimeout(() => setSaving(null), 300)
    }, 500)
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
      isCompleted: false,
      isNew: true // UX: Flag for expand-in animation when note is created
    }
    
    // UX: Clear any active tag editing state when creating new note to avoid confusion
    // User should focus on the new note, not continue editing tags on old note
    setInlineTagEdit(null)
    
    setNotes(prevNotes => [newNote, ...prevNotes])
    setActiveNoteId(newNote.id)
    
    // UX: Remove animation flag after animation completes so note behaves normally
    // The isNew flag triggers expand-in animation, then gets removed for normal behavior
    setTimeout(() => {
      setNotes(prevNotes => 
        prevNotes.map(note => 
          note.id === newNote.id ? { ...note, isNew: false } : note
        )
      )
    }, 400) // Match animation duration in CSS
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

  const startInlineTagEdit = (noteId: string) => {
    // UX: Start inline tag editing with fuzzy search and keyboard navigation
    // This provides a lightweight alternative to showing all tags at once
    setInlineTagEdit({
      noteId,
      query: '',
      highlightedIndex: 0 // UX: Start with first option highlighted for keyboard navigation
    })
  }

  const exitInlineTagEdit = () => {
    setInlineTagEdit(null)
    // UX: Return focus to note content after tag editing for seamless writing flow
    // User expects to continue typing in the note after finishing tag selection
    setTimeout(() => {
      if (activeNoteRef.current) {
        activeNoteRef.current.focus()
      }
    }, 0)
  }

  const updateInlineTagQuery = (query: string) => {
    if (inlineTagEdit) {
      const filteredOptions = getFilteredTagOptions(query)
      setInlineTagEdit({
        ...inlineTagEdit,
        query,
        highlightedIndex: Math.min(inlineTagEdit.highlightedIndex, Math.max(0, filteredOptions.length - 1))
      })
    }
  }

  const navigateInlineTagEdit = (direction: 'up' | 'down') => {
    if (!inlineTagEdit) return
    
    const filteredOptions = getFilteredTagOptions(inlineTagEdit.query)
    const maxIndex = Math.max(filteredOptions.length - 1, 0)
    let newIndex = inlineTagEdit.highlightedIndex
    
    if (direction === 'up') {
      newIndex = newIndex > 0 ? newIndex - 1 : maxIndex
    } else {
      newIndex = newIndex < maxIndex ? newIndex + 1 : 0
    }
    
    setInlineTagEdit({
      ...inlineTagEdit,
      highlightedIndex: newIndex
    })
  }

  const toggleHighlightedTag = () => {
    if (!inlineTagEdit) return
    
    const filteredOptions = getFilteredTagOptions(inlineTagEdit.query)
    const highlightedOption = filteredOptions[inlineTagEdit.highlightedIndex]
    
    if (highlightedOption) {
      if (highlightedOption.isNew) {
        // UX: Don't create new tags with space/enter in toggle mode
        // User must explicitly confirm new tag creation to prevent accidents
        return
      } else {
        // UX: Toggle existing tag and optionally continue tagging session
        toggleTag(inlineTagEdit.noteId, highlightedOption.id)
        
        // UX: Smart auto-advance logic - only advance when user clearly intended one result
        // If user typed a search and there's exactly one result, they probably want to continue
        const shouldAutoAdvance = inlineTagEdit.query.trim() && 
          getFilteredTagOptions(inlineTagEdit.query).length === 1
        
        if (shouldAutoAdvance) {
          continueTaggingSession()
        } else {
          // UX: Clear search but stay in tag mode for easy multi-tag selection
          setInlineTagEdit({
            ...inlineTagEdit,
            query: ''
          })
        }
      }
    }
  }

  const confirmCreateTag = () => {
    if (!inlineTagEdit) return
    
    const filteredOptions = getFilteredTagOptions(inlineTagEdit.query)
    const highlightedOption = filteredOptions[inlineTagEdit.highlightedIndex]
    
    if (highlightedOption?.isNew) {
      // UX: Create new tag and immediately apply it to current note
      const newTag: Tag = {
        id: Date.now().toString(),
        name: highlightedOption.name
      }
      setTags(prevTags => [...prevTags, newTag])
      toggleTag(inlineTagEdit.noteId, newTag.id)
      
      // UX: Always auto-advance after creating new tag since user explicitly created something
      // This keeps the flow moving for users who want to add multiple tags
      continueTaggingSession()
    }
  }

  const continueTaggingSession = () => {
    if (!inlineTagEdit) return
    
    // UX: Auto-advance to next unselected tag for efficient multi-tag selection
    // Clear search query and position cursor on next relevant tag
    const note = notes.find(n => n.id === inlineTagEdit.noteId)
    if (!note) return
    
    // UX: Find first unselected tag to highlight for continued tagging efficiency
    const allTags = getFilteredTagOptions('')
    const firstUnselectedIndex = allTags.findIndex(tag => 
      !tag.isNew && !note.tagIds.includes(tag.id)
    )
    
    setInlineTagEdit({
      ...inlineTagEdit,
      query: '',
      highlightedIndex: Math.max(0, firstUnselectedIndex)
    })
  }

  const fuzzyMatch = (text: string, query: string): { matches: boolean; score: number } => {
    if (!query.trim()) return { matches: true, score: 0 }
    
    const textLower = text.toLowerCase()
    const queryLower = query.toLowerCase()
    
    // Exact match gets highest score
    if (textLower.includes(queryLower)) {
      const index = textLower.indexOf(queryLower)
      return { matches: true, score: 1000 - index } // Earlier matches score higher
    }
    
    // Fuzzy match: check if all query characters appear in order
    let textIndex = 0
    let queryIndex = 0
    let matches = 0
    
    while (textIndex < textLower.length && queryIndex < queryLower.length) {
      if (textLower[textIndex] === queryLower[queryIndex]) {
        matches++
        queryIndex++
      }
      textIndex++
    }
    
    const isMatch = queryIndex === queryLower.length
    const score = isMatch ? (matches / textLower.length) * 100 : 0
    
    return { matches: isMatch, score }
  }

  const getFilteredTagOptions = (query: string) => {
    // Get matching tags with fuzzy search and scoring
    const matchingTags = tags
      .map(tag => ({ ...tag, ...fuzzyMatch(tag.name, query), isNew: false }))
      .filter(tag => tag.matches)
      .sort((a, b) => b.score - a.score) // Sort by relevance score
    
    // Only show "create new" option if query doesn't match any existing tags AND has content
    const shouldShowCreateOption = query.trim() && 
      matchingTags.length === 0 && 
      !tags.some(tag => tag.name.toLowerCase() === query.toLowerCase())
    
    const filtered = [
      ...matchingTags,
      ...(shouldShowCreateOption ? [{ id: 'new', name: query.trim(), isNew: true, matches: true, score: 0 }] : [])
    ]
    
    return filtered
  }

  // UX: Global keyboard shortcuts for efficient note and tag management
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // UX: Prevent global shortcuts when user is typing in tag search to avoid conflicts
      const isTagInputFocused = document.activeElement?.classList.contains('tag-search-input')
      
      // UX: Escape to exit "Edit Tags" mode on existing notes (but not first note)
      // First note always shows all tags, so escape shouldn't hide them
      if (e.key === 'Escape' && !isTagInputFocused && !inlineTagEdit && editingTags) {
        const editingNote = notes.find(note => note.id === editingTags)
        const editingNoteIndex = notes.findIndex(note => note.id === editingTags)
        // UX: Only allow escape for non-first notes since first note should always show all tags
        if (editingNote && editingNoteIndex > 0) {
          e.preventDefault()
          setEditingTags(null)
        }
      }
      
      // UX: Cmd+Enter creates new note (save and create new pattern)
      // Always handle this globally - exit tag editing first if active, then create new note
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault()
        // UX: Exit tag editing mode first if active, then create new note
        if (inlineTagEdit) {
          setInlineTagEdit(null)
        }
        createNewNote()
      }
      
      // UX: Cmd+I opens inline tag editing for lightweight tag selection
      // Alternative to clicking "Edit Tags" - provides fuzzy search and keyboard navigation
      if ((e.metaKey || e.ctrlKey) && e.key === 'i' && !isTagInputFocused) {
        e.preventDefault()
        if (activeNoteId && !inlineTagEdit) {
          startInlineTagEdit(activeNoteId)
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [inlineTagEdit, activeNoteId, editingTags, notes])

  // UX: Dedicated keyboard handler for tag search input with specialized navigation
  const handleTagInputKeyDown = (e: React.KeyboardEvent) => {
    if (!inlineTagEdit) return
    
    // UX: Cmd+Enter is handled by global handler - don't handle it here to avoid double-firing
    
    if (e.key === 'Escape') {
      // UX: Exit tag search and return focus to note content for seamless writing
      e.preventDefault()
      exitInlineTagEdit()
    } else if (e.key === 'Enter') {
      // UX: Enter selects highlighted tag or creates new tag
      e.preventDefault()
      const filteredOptions = getFilteredTagOptions(inlineTagEdit.query)
      if (filteredOptions.length > 0) {
        const highlightedOption = filteredOptions[inlineTagEdit.highlightedIndex]
        if (highlightedOption?.isNew) {
          confirmCreateTag() // UX: Create new tag when "Create" option is highlighted
        } else {
          toggleHighlightedTag() // UX: Toggle existing tag selection
        }
      } else {
        exitInlineTagEdit() // UX: Exit if no options available
      }
    } else if (e.key === ' ') {
      // UX: Space bar also selects tags for quick keyboard-only interaction
      e.preventDefault()
      toggleHighlightedTag()
    } else if (e.key === 'ArrowUp') {
      // UX: Arrow key navigation through tag options
      e.preventDefault()
      navigateInlineTagEdit('up')
    } else if (e.key === 'ArrowDown') {
      // UX: Arrow key navigation through tag options
      e.preventDefault()
      navigateInlineTagEdit('down')
    } else if (e.key === 'Tab') {
      // UX: Tab navigation as alternative to arrow keys for power users
      e.preventDefault()
      if (e.shiftKey) {
        navigateInlineTagEdit('up') // UX: Shift+Tab goes backwards through options
      } else {
        navigateInlineTagEdit('down') // UX: Tab advances to next option
      }
    }
  }

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
            <kbd className="px-1.5 py-0.5 bg-blue-400 rounded text-xs">{modKey}↵</kbd>
          </button>
        </div>
        
        {activeTab === 'notes' && (
          <div className="space-y-4">
          {notes.map((note, index) => (
            <div 
              key={note.id}
              className={`bg-white rounded-lg shadow-sm border-2 p-4 relative transition-all duration-300 ease-out ${
                note.id === activeNoteId ? 'border-blue-400' : 'border-gray-200'
              } ${note.isBookmarked ? 'bg-yellow-50' : ''} ${
                note.isNew ? 'animate-expandIn' : ''
              }`}
              onClick={() => {
                setActiveNoteId(note.id)
                // UX: Close edit tags mode when clicking a different note to avoid confusion
                if (editingTags && editingTags !== note.id) {
                  setEditingTags(null)
                }
                // UX: Clear inline tag editing when switching notes for clean state
                // User should focus on the new note, not continue editing tags on old note
                if (inlineTagEdit && inlineTagEdit.noteId !== note.id) {
                  setInlineTagEdit(null)
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
                {inlineTagEdit?.noteId === note.id ? (
                  // UX: Inline tag editing mode - lightweight alternative to showing all tags
                  // Provides fuzzy search and keyboard navigation for efficient tag selection
                  <div className="w-full">
                    <input
                      type="text"
                      value={inlineTagEdit.query}
                      onChange={(e) => updateInlineTagQuery(e.target.value)}
                      onKeyDown={handleTagInputKeyDown}
                      placeholder="Type to search tags..."
                      className="tag-search-input w-full px-3 py-2 border-2 border-blue-400 rounded-md outline-none text-sm"
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                    {/* Show filtered tags */}
                    <div className="flex flex-wrap gap-2 mt-2">
                      {getFilteredTagOptions(inlineTagEdit.query).map((option, index) => (
                        <div
                          key={option.id}
                          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                            index === inlineTagEdit.highlightedIndex
                              ? option.isNew
                                ? 'bg-green-100 text-green-700 ring-2 ring-green-400'
                                : note.tagIds.includes(option.id)
                                ? 'bg-blue-500 text-white ring-2 ring-blue-300'
                                : 'bg-gray-200 text-gray-700 ring-2 ring-blue-400'
                              : option.isNew
                              ? 'bg-green-100 text-green-700'
                              : note.tagIds.includes(option.id)
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-200 text-gray-700'
                          }`}
                        >
                          {option.isNew ? `+ Create "${option.name}"` : option.name}
                        </div>
                      ))}
                      {getFilteredTagOptions(inlineTagEdit.query).length === 0 && inlineTagEdit.query && (
                        <div className="px-3 py-1 text-sm text-gray-500">
                          No matching tags
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Tab/Shift+Tab/↑↓ navigate • Space/Enter to select • Escape to finish
                    </div>
                  </div>
                ) : index === 0 || editingTags === note.id ? (
                  // UX: Show all tags for first note (always expanded for easy initial tagging)
                  // OR when explicitly editing existing notes (via "Edit Tags" button)
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
                  // UX: Show only selected tags for existing notes to keep layout clean
                  // Plus "Edit Tags" button to expand when needed
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
                      title={`Edit Tags (or press ${modKey}I)`}
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
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Saved
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
                onFocus={() => {
                  // UX: Clear tag editing when user clicks into note content
                  // User intends to write, so exit tag mode and focus on writing
                  if (inlineTagEdit) {
                    setInlineTagEdit(null)
                  }
                }}
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
        title={`New Note (${modKey}↵)`}
      >
        +
      </button>
      
      {/* Help button */}
      <button
        onClick={() => setShowHelp(!showHelp)}
        className="fixed bottom-4 right-4 w-10 h-10 bg-gray-600 text-white rounded-full shadow-lg flex items-center justify-center text-sm hover:bg-gray-700 transition-colors z-20"
        title="Keyboard Shortcuts"
      >
        ?
      </button>
      
      {/* Keyboard shortcuts help panel */}
      {showHelp && (
        <div className="fixed bottom-16 right-4 bg-white rounded-lg shadow-xl border p-4 w-72 z-30">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-800">Keyboard Shortcuts</h3>
            <button
              onClick={() => setShowHelp(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Create new note</span>
              <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">{modKey}↵</kbd>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Keyboard-based tagging</span>
              <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">{modKey}I</kbd>
            </div>
            <div className="border-t pt-2 mt-2">
              <div className="text-gray-500 text-xs mb-1">In tag mode:</div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Navigate options</span>
                <div className="flex gap-1">
                  <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">↑</kbd>
                  <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">↓</kbd>
                  <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Tab</kbd>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Select tag</span>
                <div className="flex gap-1">
                  <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Space</kbd>
                  <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">↵</kbd>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Exit tag mode</span>
                <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Esc</kbd>
              </div>
            </div>
          </div>
        </div>
      )}
      
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
    </div>
  )
}

export default App