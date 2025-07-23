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
  const [hashtagAutocomplete, setHashtagAutocomplete] = useState<{
    noteId: string
    query: string
    savedCursorPos: number
    highlightedIndex: number
  } | null>(null)
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false)
  const [showFullScreenButtons, setShowFullScreenButtons] = useState<boolean>(false)
  const [showFullScreenTags, setShowFullScreenTags] = useState<boolean>(false)
  const [selectingTagId, setSelectingTagId] = useState<string | null>(null)
  const activeNoteRef = useRef<HTMLTextAreaElement>(null)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const fullScreenButtonTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const fullScreenTagTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // UX: Platform detection for cross-platform keyboard shortcuts
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
  const modKey = isMac ? '⌘' : 'Ctrl'

  // UX: Prevent empty note creation to avoid clutter in the notes list
  // Users should add content or tags before creating new notes to maintain meaningful organization
  const currentNote = notes.find(note => note.id === activeNoteId)
  const canCreateNewNote = currentNote && (currentNote.content.trim() || currentNote.tagIds.length > 0)

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

  // UX: Auto-show help panel when no notes exist to guide new users
  useEffect(() => {
    if (notes.length === 0) {
      setShowHelp(true)
    }
  }, [notes.length])

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
      highlightedIndex: -1 // UX: Start with no selection until user navigates or types
    })
  }

  const exitInlineTagEdit = () => {
    setInlineTagEdit(null)
    // UX: In fullscreen mode, hide tags when exiting tag editing
    if (isFullScreen) {
      setShowFullScreenTags(false)
    }
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

  // UX: Handle hashtag autocomplete selection
  const selectHashtagTag = (tagId: string, isNew = false) => {
    if (!hashtagAutocomplete || !activeNoteRef.current) return
    
    let selectedTag = tags.find(t => t.id === tagId)
    
    // Create new tag if needed
    if (isNew && !selectedTag) {
      selectedTag = {
        id: Date.now().toString(),
        name: hashtagAutocomplete.query.trim()
      }
      setTags(prevTags => [...prevTags, selectedTag!])
    }
    
    if (selectedTag) {
      // Add tag to note
      toggleTag(hashtagAutocomplete.noteId, selectedTag.id)
      
      // Restore cursor position in main textarea
      setTimeout(() => {
        if (activeNoteRef.current) {
          activeNoteRef.current.setSelectionRange(hashtagAutocomplete.savedCursorPos, hashtagAutocomplete.savedCursorPos)
          activeNoteRef.current.focus()
        }
      }, 0)
    }
    
    setHashtagAutocomplete(null)
  }

  // UX: Cancel hashtag autocomplete and restore cursor
  const cancelHashtagAutocomplete = () => {
    if (!hashtagAutocomplete || !activeNoteRef.current) return
    
    setTimeout(() => {
      if (activeNoteRef.current) {
        activeNoteRef.current.setSelectionRange(hashtagAutocomplete.savedCursorPos, hashtagAutocomplete.savedCursorPos)
        activeNoteRef.current.focus()
      }
    }, 0)
    
    setHashtagAutocomplete(null)
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
      
      // UX: Escape to hide tags in fullscreen mode
      if (e.key === 'Escape' && isFullScreen && showFullScreenTags && !inlineTagEdit) {
        e.preventDefault()
        setShowFullScreenTags(false)
        return
      }
      
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
      // Only allow if current note has content or tags to prevent empty notes
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && canCreateNewNote) {
        e.preventDefault()
        // UX: Exit tag editing mode first if active, then create new note
        if (inlineTagEdit) {
          setInlineTagEdit(null)
        }
        createNewNote()
      }
      
      // UX: Cmd+I opens inline tag editing for lightweight tag selection
      // Alternative to clicking "Edit Tags" - provides fuzzy search and keyboard navigation
      // In fullscreen mode, also shows tags section with smoother transition
      if ((e.metaKey || e.ctrlKey) && e.key === 'i' && !isTagInputFocused) {
        e.preventDefault()
        if (activeNoteId && !inlineTagEdit) {
          startInlineTagEdit(activeNoteId)
          // UX: In fullscreen mode, show tags with smooth transition
          if (isFullScreen) {
            setShowFullScreenTags(true)
          }
        }
      }
      
      // UX: Cmd+Up/Down for note navigation - efficient keyboard-only workflow
      if ((e.metaKey || e.ctrlKey) && (e.key === 'ArrowUp' || e.key === 'ArrowDown') && !isTagInputFocused && !inlineTagEdit) {
        e.preventDefault()
        const currentIndex = notes.findIndex(note => note.id === activeNoteId)
        let newIndex = currentIndex
        
        if (e.key === 'ArrowUp' && currentIndex > 0) {
          newIndex = currentIndex - 1
        } else if (e.key === 'ArrowDown' && currentIndex < notes.length - 1) {
          newIndex = currentIndex + 1
        }
        
        if (newIndex !== currentIndex) {
          setActiveNoteId(notes[newIndex].id)
          // UX: Clear any tag editing state when switching notes
          if (editingTags) setEditingTags(null)
          if (inlineTagEdit) setInlineTagEdit(null)
          
          // UX: Focus and position cursor at beginning of new note
          setTimeout(() => {
            if (activeNoteRef.current) {
              activeNoteRef.current.focus()
              activeNoteRef.current.setSelectionRange(0, 0)
              
              // UX: Scroll note into view with margin to ensure full visibility
              const noteElement = activeNoteRef.current.closest('.bg-white')
              if (noteElement) {
                noteElement.scrollIntoView({
                  behavior: 'smooth',
                  block: 'nearest',
                  inline: 'nearest'
                })
              }
            }
          }, 0)
        }
      }
      
      // UX: Ctrl+Alt+N creates new tag - global shortcut for quick tag creation
      if ((e.metaKey || e.ctrlKey) && e.altKey && e.key.toLowerCase() === 'n' && !isTagInputFocused) {
        e.preventDefault()
        const tagName = prompt('Enter new tag name:')
        if (tagName && tagName.trim()) {
          const newTag: Tag = {
            id: Date.now().toString(),
            name: tagName.trim()
          }
          setTags(prevTags => [...prevTags, newTag])
        }
      }
      
      // UX: Cmd+Shift+F toggles fullscreen focus mode for distraction-free writing
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'f' && !isTagInputFocused) {
        e.preventDefault()
        setIsFullScreen(prev => !prev)
        // UX: Reset fullscreen UI state when toggling
        setShowFullScreenButtons(false)
        setShowFullScreenTags(false)
        // Clear any existing timeout
        if (fullScreenButtonTimeoutRef.current) {
          clearTimeout(fullScreenButtonTimeoutRef.current)
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [inlineTagEdit, activeNoteId, editingTags, notes, isFullScreen])

  // UX: Mouse movement detection for fullscreen mode - show buttons on movement, hide after idle
  useEffect(() => {
    if (!isFullScreen) return

    const handleMouseMove = () => {
      setShowFullScreenButtons(true)
      
      // Clear existing timeout
      if (fullScreenButtonTimeoutRef.current) {
        clearTimeout(fullScreenButtonTimeoutRef.current)
      }
      
      // Hide buttons after 2 seconds of no movement
      fullScreenButtonTimeoutRef.current = setTimeout(() => {
        setShowFullScreenButtons(false)
      }, 2000)
    }

    window.addEventListener('mousemove', handleMouseMove)
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      if (fullScreenButtonTimeoutRef.current) {
        clearTimeout(fullScreenButtonTimeoutRef.current)
      }
    }
  }, [isFullScreen])

  // UX: Auto-hide tags in fullscreen mode after 6 seconds of mouse inactivity
  useEffect(() => {
    if (!isFullScreen || !showFullScreenTags) return

    const startTagHideTimer = () => {
      // Clear existing timeout
      if (fullScreenTagTimeoutRef.current) {
        clearTimeout(fullScreenTagTimeoutRef.current)
      }
      
      // Hide tags after 6 seconds of no interaction
      fullScreenTagTimeoutRef.current = setTimeout(() => {
        setShowFullScreenTags(false)
      }, 6000)
    }

    const handleMouseMove = (e: MouseEvent) => {
      const target = e.target as Element
      // Only reset timer if mouse is not over tags area
      if (!target.closest('[data-tags-area]')) {
        startTagHideTimer()
      }
    }

    const handleMouseLeave = () => {
      startTagHideTimer()
    }

    // Start timer initially
    startTagHideTimer()

    // Listen for mouse movements and mouse leave events
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseleave', handleMouseLeave)
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseleave', handleMouseLeave)
      if (fullScreenTagTimeoutRef.current) {
        clearTimeout(fullScreenTagTimeoutRef.current)
      }
    }
  }, [isFullScreen, showFullScreenTags])

  // UX: Dedicated keyboard handler for tag search input with specialized navigation
  const handleTagInputKeyDown = (e: React.KeyboardEvent) => {
    if (!inlineTagEdit) return
    
    // UX: Cmd+Enter is handled by global handler - don't handle it here to avoid double-firing
    
    if (e.key === 'Escape') {
      // UX: Exit tag search and return focus to note content for seamless writing
      e.preventDefault()
      exitInlineTagEdit()
    } else if (e.key === 'Enter') {
      // UX: Enter selects highlighted tag with visual feedback
      e.preventDefault()
      const filteredOptions = getFilteredTagOptions(inlineTagEdit.query)
      if (filteredOptions.length > 0 && inlineTagEdit.highlightedIndex >= 0) {
        const highlightedOption = filteredOptions[inlineTagEdit.highlightedIndex]
        
        // UX: Show visual feedback first
        setSelectingTagId(highlightedOption.id)
        
        // UX: Brief delay for visual feedback, then perform selection
        setTimeout(() => {
          if (highlightedOption?.isNew) {
            // Create new tag
            const newTag: Tag = {
              id: Date.now().toString(),
              name: highlightedOption.name
            }
            setTags(prevTags => [...prevTags, newTag])
            toggleTag(inlineTagEdit.noteId, newTag.id)
          } else {
            // Toggle existing tag
            toggleTag(inlineTagEdit.noteId, highlightedOption.id)
          }
          
          // Reset selecting state and exit tag mode
          setSelectingTagId(null)
          continueTaggingSession()
        }, 250) // 250ms visual feedback delay
      } else {
        exitInlineTagEdit() // UX: Exit if no options available or nothing selected
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
    <div className={`min-h-screen transition-all duration-500 ease-in-out ${
      isFullScreen 
        ? 'bg-white fixed inset-0 z-50' 
        : 'bg-gray-50 pb-16 md:pb-0'
    }`}>
      <div className={`transition-all duration-500 ease-in-out ${
        isFullScreen 
          ? 'h-full p-8 max-w-4xl mx-auto' 
          : 'max-w-3xl mx-auto p-4'
      }`}>
        {!isFullScreen && (
          <div className="hidden md:flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Notes</h1>
            {/* UX: New note button shows conditional availability to prevent empty note clutter
                 Disabled state with helpful tooltip guides user behavior toward meaningful content creation */}
            <button
              onClick={canCreateNewNote ? createNewNote : undefined}
              disabled={!canCreateNewNote}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                canCreateNewNote
                  ? 'bg-blue-500 text-white hover:bg-blue-600 cursor-pointer'  // UX: Blue primary action when available
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'              // UX: Gray disabled state with not-allowed cursor
              }`}
              title={canCreateNewNote ? `New Note (${modKey}↵)` : 'Add content or tags to create new note'}  // UX: Tooltip explains requirement
            >
              <span className="text-lg">+</span>
            </button>
          </div>
        )}
        
        {activeTab === 'notes' && (
          <div className={`${isFullScreen ? 'h-full' : 'space-y-4'}`}>
          {notes.length === 0 ? (
            !isFullScreen && (
              <div className="bg-white rounded-lg shadow-sm border-2 border-gray-200 p-8 text-center">
                <h2 className="text-2xl font-semibold text-gray-700 mb-4">Welcome to Notes!</h2>
                <p className="text-gray-500 mb-6">Start capturing your thoughts instantly.</p>
                <button
                  onClick={createNewNote}
                  className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 mx-auto"
                  title={`Create your first note (${modKey}↵)`}
                >
                  <span className="text-lg">+</span>
                  Create your first note
                </button>
              </div>
            )
          ) : (
            // UX: In fullscreen mode, only show the active note; otherwise show all notes
            (isFullScreen 
              ? notes.filter(note => note.id === activeNoteId)
              : notes
            ).map((note, index) => (
            <div 
              key={note.id}
              className={`transition-all duration-300 ease-out relative ${
                isFullScreen 
                  ? 'bg-transparent border-none p-0 h-full flex flex-col'
                  : `bg-white rounded-lg shadow-sm border-2 p-4 ${
                      note.id === activeNoteId ? 'border-blue-400' : 'border-gray-200'
                    } ${note.isBookmarked ? 'bg-yellow-50' : ''} ${
                      note.isNew ? 'animate-expandIn' : ''
                    }`
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
              {/* UX: Action buttons positioned for easy access without blocking content */}
              {/* UX: In fullscreen mode, only show buttons on mouse movement for distraction-free writing */}
              {(!isFullScreen || showFullScreenButtons) && (
                <div className={`flex items-center gap-1 md:gap-2 transition-opacity duration-300 ${
                  isFullScreen 
                    ? 'absolute top-4 right-4 opacity-80 hover:opacity-100'
                    : 'absolute top-2 right-2 md:top-4 md:right-4'
                }`}>
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
                {/* UX: Tags button in fullscreen mode - aligned with other action buttons */}
                {isFullScreen && !showFullScreenTags && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      // UX: Just toggle tag visibility, don't enter search mode
                      setShowFullScreenTags(prev => !prev)
                    }}
                    className="p-1.5 md:p-2 rounded hover:bg-gray-100 text-gray-400"
                    title={`Tags (${modKey}I)`}
                  >
                    <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                  </button>
                )}
              </div>
              )}
              {/* UX: Tags section with right padding to avoid action button overlap */}
              {/* UX: In fullscreen mode, hide tags unless explicitly shown */}
              {(!isFullScreen || showFullScreenTags) && (
                <div 
                  data-tags-area
                  className={`flex flex-wrap gap-2 mb-3 fullscreen-tag-transition ${
                    isFullScreen ? 'pr-44' : 'pr-24 md:pr-32'
                  }`}
                >
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
                        <button
                          key={option.id}
                          onClick={(e) => {
                            e.stopPropagation()
                            if (option.isNew) {
                              // Create new tag
                              const newTag: Tag = {
                                id: Date.now().toString(),
                                name: option.name
                              }
                              setTags(prevTags => [...prevTags, newTag])
                              toggleTag(inlineTagEdit.noteId, newTag.id)
                              continueTaggingSession()
                            } else {
                              // Toggle existing tag
                              toggleTag(inlineTagEdit.noteId, option.id)
                              continueTaggingSession()
                            }
                          }}
                          onMouseEnter={() => {
                            setInlineTagEdit({
                              ...inlineTagEdit,
                              highlightedIndex: index
                            })
                          }}
                          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors cursor-pointer hover:scale-105 ${
                            selectingTagId === option.id
                              ? 'bg-blue-600 text-white ring-4 ring-blue-200 scale-105' // UX: Bright feedback when selecting
                              : index === inlineTagEdit.highlightedIndex
                              ? option.isNew
                                ? 'bg-green-100 text-green-700 ring-2 ring-green-400'
                                : note.tagIds.includes(option.id)
                                ? 'bg-blue-500 text-white ring-2 ring-blue-300'
                                : 'bg-gray-200 text-gray-700 ring-2 ring-blue-400'
                              : option.isNew
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : note.tagIds.includes(option.id)
                              ? 'bg-blue-500 text-white hover:bg-blue-600'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          {option.isNew ? `+ Create "${option.name}"` : option.name}
                        </button>
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
              )}


              {/* Date created with save indicator - hidden in fullscreen mode */}
              {!isFullScreen && (
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
              )}

              {/* Note content */}
              <textarea
                ref={note.id === activeNoteId ? activeNoteRef : null}
                className={`w-full resize-none outline-none overflow-hidden transition-all duration-300 ${
                  isFullScreen 
                    ? 'flex-1 text-lg leading-relaxed p-4 bg-transparent border-none min-h-0' 
                    : 'min-h-[1.5rem]'
                } ${
                  note.isCompleted ? 'line-through text-gray-400' : 'text-gray-800'
                }`}
                value={note.content}
                onChange={(e) => {
                  updateNote(note.id, e.target.value)
                  autoResizeTextarea(e.target)
                }}
                onInput={(e) => autoResizeTextarea(e.target as HTMLTextAreaElement)}
                onKeyDown={(e) => {
                  // UX: Hashtag-style tagging feels natural like social media
                  // Pressing # opens tag picker without showing # character in note content
                  // Saves cursor position so user returns to exact typing location after tagging
                  if (e.key === '#' && !hashtagAutocomplete) {
                    e.preventDefault()
                    const textarea = e.target as HTMLTextAreaElement
                    const cursorPos = textarea.selectionStart
                    
                    setHashtagAutocomplete({
                      noteId: note.id,
                      query: '',
                      savedCursorPos: cursorPos, // UX: Return to exact cursor position after tagging
                      highlightedIndex: 0
                    })
                  }
                }}
                onFocus={() => {
                  // UX: Clear tag editing when user clicks into note content
                  // User intends to write, so exit tag mode and focus on writing
                  if (inlineTagEdit) {
                    setInlineTagEdit(null)
                  }
                }}
                placeholder={`Start writing... (${modKey}+I for tags, # for inline tags)`}
              />

              {/* UX: Hashtag autocomplete - positioned as narrow dropdown to avoid overwhelming the interface
                   33% width keeps it compact while still usable, positioned below note for clear association */}
              {hashtagAutocomplete && hashtagAutocomplete.noteId === note.id && (
                <div 
                  className={`bg-white border rounded-lg shadow-xl p-3 z-50 mt-2 ${
                    isFullScreen 
                      ? 'fixed bottom-8 left-1/2 transform -translate-x-1/2 w-80'
                      : 'absolute'
                  }`}
                  style={!isFullScreen ? {
                    top: '100%',
                    left: '0',
                    width: '33%'
                  } : undefined}
                >
                  {/* UX: Real text input allows natural typing including spaces, punctuation, multi-word tags
                       Auto-focus immediately puts user in typing mode without extra clicks */}
                  <input
                    type="text"
                    value={hashtagAutocomplete.query}
                    onChange={(e) => setHashtagAutocomplete({
                      ...hashtagAutocomplete,
                      query: e.target.value,
                      highlightedIndex: 0 // UX: Reset selection to top when search changes
                    })}
                    onKeyDown={(e) => {
                      const filteredOptions = getFilteredTagOptions(hashtagAutocomplete.query)
                      
                      if (e.key === 'Escape') {
                        e.preventDefault()
                        cancelHashtagAutocomplete() // UX: Escape returns to note without disrupting workflow
                      } else if (e.key === 'Enter') {
                        e.preventDefault()
                        if (filteredOptions.length > 0) {
                          const selectedOption = filteredOptions[hashtagAutocomplete.highlightedIndex]
                          selectHashtagTag(selectedOption.id, selectedOption.isNew)
                        }
                      } else if (e.key === 'ArrowUp') {
                        e.preventDefault()
                        // UX: Keyboard navigation prevents mouse dependency for power users
                        setHashtagAutocomplete({
                          ...hashtagAutocomplete,
                          highlightedIndex: Math.max(0, hashtagAutocomplete.highlightedIndex - 1)
                        })
                      } else if (e.key === 'ArrowDown') {
                        e.preventDefault()
                        setHashtagAutocomplete({
                          ...hashtagAutocomplete,
                          highlightedIndex: Math.min(filteredOptions.length - 1, hashtagAutocomplete.highlightedIndex + 1)
                        })
                      }
                    }}
                    placeholder="Search tags..."
                    className="w-full px-3 py-2 border rounded-md outline-none focus:border-blue-400 text-sm mb-2"
                    autoFocus // UX: Immediate focus eliminates extra click, maintains typing flow
                  />
                  
                  {/* Tag options */}
                  <div className="max-h-48 overflow-y-auto">
                    {getFilteredTagOptions(hashtagAutocomplete.query).map((option, index) => {
                      const isAlreadySelected = note.tagIds.includes(option.id)
                      return (
                        <button
                          key={option.id}
                          onClick={() => selectHashtagTag(option.id, option.isNew)}
                          className={`w-full text-left px-3 py-2 rounded-md text-sm transition-all mb-1 flex items-center gap-2 ${
                            // UX: Visual hierarchy separates keyboard focus from selection state
                            // Inner color = selection state, border = keyboard position
                            index === hashtagAutocomplete.highlightedIndex
                              ? isAlreadySelected && !option.isNew
                                ? 'bg-blue-600 text-white border-4 border-yellow-400'      // UX: Keep dark blue to show "already selected" + thick border for keyboard focus
                                : option.isNew
                                ? 'bg-green-100 text-green-700 border-4 border-yellow-400'  // UX: Green for "will create new" + keyboard focus
                                : 'bg-blue-100 text-blue-700 border-4 border-yellow-400'   // UX: Light blue for "available to select" + keyboard focus
                              : // UX: Normal states show only selection status without keyboard distraction
                              option.isNew
                              ? 'bg-green-50 text-green-700 hover:bg-green-100 border border-transparent'  // UX: Light green hints at "createable"
                              : isAlreadySelected
                              ? 'bg-blue-600 text-white hover:bg-blue-700 border border-transparent'      // UX: Dark blue confirms "selected"
                              : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-transparent'    // UX: Neutral gray for "available"
                          }`}
                        >
                          {/* UX: Checkmark on left provides immediate visual confirmation of selection
                               White color ensures visibility against dark blue selected background */}
                          {isAlreadySelected && !option.isNew && (
                            <span className="text-white">✓</span>
                          )}
                          <span className="flex-1">
                            {/* UX: Clear language - "Create" prefix eliminates ambiguity about new vs existing tags */}
                            {option.isNew ? `+ Create "${option.name}"` : option.name}
                          </span>
                        </button>
                      )
                    })}
                    {getFilteredTagOptions(hashtagAutocomplete.query).length === 0 && hashtagAutocomplete.query && (
                      <div className="px-3 py-2 text-sm text-gray-500">
                        No matching tags
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Last updated - only show for existing notes with content, hidden in fullscreen */}
              {!isFullScreen && index > 0 && note.content && (
                <div className="text-xs text-gray-400 mt-2">
                  Updated {formatDate(note.updatedAt)}
                </div>
              )}
            </div>
          )))}
          </div>
        )}
        
        {activeTab === 'tags' && (
          <div className="bg-white rounded-lg shadow-sm border-2 border-gray-200 p-8 text-center">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Tags Management</h2>
            <p className="text-gray-500">Tag management features coming soon...</p>
          </div>
        )}
      </div>
      
      {/* UX: Floating action button for new note creation - hidden in fullscreen */}
      {!isFullScreen && (
        <button
          onClick={canCreateNewNote ? createNewNote : undefined}
          disabled={!canCreateNewNote}
          className={`md:hidden fixed bottom-20 right-4 w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-2xl transition-colors z-10 ${
            canCreateNewNote
              ? 'bg-blue-500 text-white hover:bg-blue-600 cursor-pointer'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
          title={canCreateNewNote ? `New Note (${modKey}↵)` : 'Add content or tags to create new note'}
        >
          +
        </button>
      )}
      
      {/* Help button - hidden in fullscreen */}
      {!isFullScreen && (
        <button
          onClick={() => setShowHelp(!showHelp)}
          className="fixed bottom-4 right-4 w-10 h-10 bg-gray-600 text-white rounded-full shadow-lg flex items-center justify-center text-sm hover:bg-gray-700 transition-colors z-20"
          title="Keyboard Shortcuts"
        >
          ?
        </button>
      )}
      
      {/* Keyboard shortcuts help panel - hidden in fullscreen */}
      {!isFullScreen && showHelp && (
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
              <span className="text-gray-600">Navigate between notes</span>
              <div className="flex gap-1">
                <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">{modKey}↑</kbd>
                <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">{modKey}↓</kbd>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Create new tag</span>
              <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">{modKey}+Alt+N</kbd>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Toggle fullscreen mode</span>
              <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">{modKey}+Shift+F</kbd>
            </div>
            
            <div className="border-t pt-2 mt-2">
              <div className="text-gray-500 text-xs mb-1 font-medium">Tag Search Mode ({modKey}I):</div>
              <div className="text-gray-500 text-xs mb-2 italic">Browse all tags, create new ones</div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Open tag search</span>
                <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">{modKey}I</kbd>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Navigate options</span>
                <div className="flex gap-1">
                  <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">↑</kbd>
                  <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">↓</kbd>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Select/toggle tag</span>
                <div className="flex gap-1">
                  <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Space</kbd>
                  <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">↵</kbd>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Exit</span>
                <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Esc</kbd>
              </div>
            </div>
            
            <div className="border-t pt-2 mt-2">
              <div className="text-gray-500 text-xs mb-1 font-medium">Hashtag Mode (#):</div>
              <div className="text-gray-500 text-xs mb-2 italic">Quick inline tagging while writing</div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Start hashtag tagging</span>
                <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">#</kbd>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Navigate options</span>
                <div className="flex gap-1">
                  <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">↑</kbd>
                  <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">↓</kbd>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Select tag</span>
                <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">↵</kbd>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Cancel</span>
                <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Esc</kbd>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* UX: Bottom navigation tab bar with clear visual states - hidden in fullscreen */}
      {!isFullScreen && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden">
        <div className="flex">
          <button
            onClick={() => setActiveTab('notes')}
            className={`flex-1 py-4 text-center ${
              // UX: Blue accent color + top border clearly shows active tab, gray for inactive
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
      )}
    </div>
  )
}

export default App