import { useEffect, useState } from 'react'
import type { Editor } from '@tiptap/react'
import type { Node as ProseMirrorNode } from '@tiptap/pm/model'

interface Match {
  from: number
  to: number
}

function findMatches(doc: ProseMirrorNode, query: string): Match[] {
  if (!query) return []
  const matches: Match[] = []
  const lowerQuery = query.toLowerCase()

  doc.descendants((node, pos) => {
    if (!node.isTextblock) return true

    let text = ''
    const positions: number[] = []
    node.forEach((child, offset) => {
      if (child.isText && child.text) {
        for (let i = 0; i < child.text.length; i++) {
          text += child.text[i]
          positions.push(pos + 1 + offset + i)
        }
      }
    })

    const lowerText = text.toLowerCase()
    let idx = 0
    while (true) {
      const found = lowerText.indexOf(lowerQuery, idx)
      if (found === -1) break
      matches.push({ from: positions[found], to: positions[found + query.length - 1] + 1 })
      idx = found + Math.max(query.length, 1)
    }
    return false
  })

  return matches
}

interface FindReplaceProps {
  editor: Editor
  onClose: () => void
}

export default function FindReplace({ editor, onClose }: FindReplaceProps): JSX.Element {
  const [query, setQuery] = useState('')
  const [replacement, setReplacement] = useState('')
  const [matchIndex, setMatchIndex] = useState(0)

  const matches = findMatches(editor.state.doc, query)

  useEffect(() => {
    setMatchIndex(0)
  }, [query])

  const goTo = (index: number): void => {
    if (matches.length === 0) return
    const clamped = ((index % matches.length) + matches.length) % matches.length
    setMatchIndex(clamped)
    const m = matches[clamped]
    editor.chain().focus().setTextSelection({ from: m.from, to: m.to }).scrollIntoView().run()
  }

  const replaceCurrent = (): void => {
    if (matches.length === 0) return
    const m = matches[matchIndex]
    editor.chain().focus().insertContentAt({ from: m.from, to: m.to }, replacement).run()
  }

  const replaceAll = (): void => {
    if (matches.length === 0) return
    const sorted = [...matches].sort((a, b) => b.from - a.from)
    let chain = editor.chain().focus()
    for (const m of sorted) {
      chain = chain.insertContentAt({ from: m.from, to: m.to }, replacement)
    }
    chain.run()
  }

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm">
      <input
        autoFocus
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') goTo(matchIndex + 1)
          if (e.key === 'Escape') onClose()
        }}
        placeholder="Find"
        className="h-8 w-44 rounded border border-gray-300 px-2"
      />
      <span className="w-14 text-xs text-gray-500">
        {query ? `${matches.length ? matchIndex + 1 : 0}/${matches.length}` : ''}
      </span>
      <button
        type="button"
        disabled={!matches.length}
        onClick={() => goTo(matchIndex - 1)}
        className="h-8 rounded border border-gray-300 bg-white px-2 disabled:opacity-40"
      >
        Prev
      </button>
      <button
        type="button"
        disabled={!matches.length}
        onClick={() => goTo(matchIndex + 1)}
        className="h-8 rounded border border-gray-300 bg-white px-2 disabled:opacity-40"
      >
        Next
      </button>
      <input
        value={replacement}
        onChange={(e) => setReplacement(e.target.value)}
        placeholder="Replace with"
        className="h-8 w-44 rounded border border-gray-300 px-2"
      />
      <button
        type="button"
        disabled={!matches.length}
        onClick={replaceCurrent}
        className="h-8 rounded border border-gray-300 bg-white px-2 disabled:opacity-40"
      >
        Replace
      </button>
      <button
        type="button"
        disabled={!matches.length}
        onClick={replaceAll}
        className="h-8 rounded border border-gray-300 bg-white px-2 disabled:opacity-40"
      >
        Replace All
      </button>
      <button
        type="button"
        onClick={onClose}
        className="ml-auto h-8 rounded px-2 text-gray-500 hover:bg-amber-100"
      >
        ✕
      </button>
    </div>
  )
}
