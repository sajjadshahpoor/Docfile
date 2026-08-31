import type { Editor } from '@tiptap/react'
import { goToRange } from '../docMarks'

interface HeadingEntry {
  level: number
  text: string
  from: number
  to: number
}

function listHeadings(editor: Editor): HeadingEntry[] {
  const entries: HeadingEntry[] = []
  editor.state.doc.descendants((node, pos) => {
    if (node.type.name === 'heading') {
      entries.push({
        level: Number(node.attrs.level ?? 1),
        text: node.textContent || '(Empty heading)',
        from: pos,
        to: pos + node.nodeSize
      })
    }
  })
  return entries
}

interface NavigationPaneProps {
  editor: Editor
  onClose: () => void
}

export default function NavigationPane({ editor, onClose }: NavigationPaneProps): JSX.Element {
  const headings = listHeadings(editor)

  return (
    <div className="flex w-64 flex-shrink-0 flex-col border-r border-gray-200 bg-white">
      <div className="flex items-center justify-between border-b border-gray-200 px-3 py-2">
        <span className="text-sm font-semibold text-gray-700">Navigation</span>
        <button
          type="button"
          onClick={onClose}
          title="Close Navigation Pane"
          className="rounded px-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          ✕
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {headings.length === 0 ? (
          <div className="p-2 text-xs text-gray-400">
            No headings yet. Apply a Heading style (Home &gt; Styles) to see them here.
          </div>
        ) : (
          <ul className="space-y-0.5">
            {headings.map((h) => (
              <li key={h.from}>
                <button
                  type="button"
                  onClick={() => goToRange(editor, h.from, h.to)}
                  title={h.text}
                  className="block w-full truncate rounded px-2 py-1 text-left text-sm text-gray-700 hover:bg-gray-100"
                  style={{ paddingLeft: `${8 + (h.level - 1) * 14}px` }}
                >
                  {h.text}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
