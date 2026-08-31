import type { Editor } from '@tiptap/react'

interface WordCountDialogProps {
  editor: Editor
  pageContentHeightPx: number
  onClose: () => void
}

function countBlocks(editor: Editor): number {
  let count = 0
  editor.state.doc.descendants((node) => {
    if (node.type.name === 'paragraph' || node.type.name === 'heading') count += 1
  })
  return count
}

// No true multi-page layout exists in this app (see pageSetup.ts), so lines
// are counted from actual rendered line boxes and pages are estimated from
// total content height against one page's content height — both are honest
// approximations rather than the exact values Word computes.
function countRenderedLines(editor: Editor): number {
  const blocks = editor.view.dom.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li')
  let lines = 0
  blocks.forEach((el) => {
    lines += Math.max(1, el.getClientRects().length)
  })
  return lines || 1
}

export default function WordCountDialog({ editor, pageContentHeightPx, onClose }: WordCountDialogProps): JSX.Element {
  const words = editor.storage.characterCount?.words() ?? 0
  const charactersWithSpaces = editor.storage.characterCount?.characters() ?? 0
  const charactersNoSpaces = editor.state.doc.textContent.replace(/\s/g, '').length
  const paragraphs = countBlocks(editor)
  const lines = countRenderedLines(editor)
  const pages = Math.max(1, Math.round(editor.view.dom.scrollHeight / pageContentHeightPx))

  const rows: [string, number][] = [
    ['Pages (estimated)', pages],
    ['Words', words],
    ['Characters (no spaces)', charactersNoSpaces],
    ['Characters (with spaces)', charactersWithSpaces],
    ['Paragraphs', paragraphs],
    ['Lines (estimated)', lines]
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div
        className="w-[320px] rounded-lg border border-gray-200 bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-base font-semibold text-gray-800">Word Count</h2>
        <table className="w-full text-sm">
          <tbody>
            {rows.map(([label, value]) => (
              <tr key={label} className="border-b border-gray-100 last:border-0">
                <td className="py-1.5 text-gray-600">{label}</td>
                <td className="py-1.5 text-right font-medium text-gray-800">{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-md bg-office-word px-4 py-1.5 text-sm font-medium text-white hover:bg-office-word/90"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
