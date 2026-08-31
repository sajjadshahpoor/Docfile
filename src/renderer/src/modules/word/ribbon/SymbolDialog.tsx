import type { Editor } from '@tiptap/react'

interface SymbolDialogProps {
  editor: Editor
  onClose: () => void
}

const SYMBOLS = [
  '©', '®', '™', '°', '±', '≠', '≤', '≥', '÷', '×', '∞', '√',
  '∑', 'π', 'µ', 'Ω', '§', '¶', '†', '‡', '•', '…', '–', '—',
  '‘', '’', '“', '”', '¡', '¿', '¢', '£', '¥', '€', '½', '¼',
  '¾', '→', '←', '↑', '↓', '↔', 'α', 'β', 'γ', 'δ', 'Σ', 'Δ'
]

export default function SymbolDialog({ editor, onClose }: SymbolDialogProps): JSX.Element {
  const insert = (symbol: string): void => {
    editor.chain().focus().insertContent(symbol).run()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div
        className="w-[380px] rounded-lg border border-gray-200 bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-base font-semibold text-gray-800">Symbol</h2>
        <div className="grid grid-cols-8 gap-1">
          {SYMBOLS.map((s) => (
            <button
              key={s}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => insert(s)}
              title={s}
              className="flex h-9 w-9 items-center justify-center rounded border border-gray-200 text-base hover:bg-gray-100"
            >
              {s}
            </button>
          ))}
        </div>
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
